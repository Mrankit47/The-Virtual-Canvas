'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import ArtLoader from '@/components/ui/ArtLoader';
import { useUIStore } from '@/store/useUIStore';
import { useRouter } from 'next/navigation';
import { env } from '@/config/env';
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Image as ImageIcon, 
  Type, 
  Maximize2, 
  Layers, 
  ShieldCheck,
  CreditCard,
  UploadCloud,
  FileText
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ArtStyle {
  _id: string;
  title: string;
  description?: string;
  basePrice: number;
  imageUrl?: string;
  requiresReference: boolean;
}

export interface SizeOption {
  _id: string;
  label: string;
  description?: string;
  multiplier: number;
}

export interface PaperType {
  _id: string;
  title: string;
  description?: string;
  extraCost: number;
}

interface StudioConfiguratorProps {
  styles: ArtStyle[];
  sizes: SizeOption[];
  papers: PaperType[];
}

const STORAGE_KEY = 'tvc_studio_config';

// ─── Steps ──────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, title: 'Vision', sub: 'Art Style' },
  { id: 2, title: 'Format', sub: 'Size & Paper' },
  { id: 3, title: 'Context', sub: 'Details & Ref' },
  { id: 4, title: 'Verify', sub: 'Final Review' }
];

// ─── Component ────────────────────────────────────────────────────────────────

export function StudioConfigurator({ styles, sizes, papers }: StudioConfiguratorProps) {
  const { data: session, status } = useSession();
  const { addToast } = useUIStore();
  const router = useRouter();

  // ── State ──
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedStyle, setSelectedStyle] = useState<ArtStyle | null>(null);
  const [selectedSize, setSelectedSize] = useState<SizeOption | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<PaperType | null>(null);
  const [notes, setNotes] = useState('');
  const [referenceImageUrl, setReferenceImageUrl] = useState('');
  const [finalPrice, setFinalPrice] = useState(0);

  // Customer info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Flow state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStage, setSubmitStage] = useState('');
  const [isUploadingRef, setIsUploadingRef] = useState(false);

  // ── Restore from localStorage ──
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const { styleId, sizeId, paperId } = JSON.parse(saved);
      if (styleId) setSelectedStyle(styles.find(s => s._id === styleId) || null);
      if (sizeId) setSelectedSize(sizes.find(s => s._id === sizeId) || null);
      if (paperId) setSelectedPaper(papers.find(p => p._id === paperId) || null);
    } catch {}
  }, [styles, sizes, papers]);

  // ── Save selection to localStorage ──
  const persistConfig = useCallback((style: ArtStyle | null, size: SizeOption | null, paper: PaperType | null) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        styleId: style?._id,
        sizeId: size?._id,
        paperId: paper?._id,
      }));
    } catch {}
  }, []);

  // ── Live price calculation ──
  useEffect(() => {
    if (!selectedStyle || !selectedSize || !selectedPaper) {
      setFinalPrice(0);
      return;
    }
    const price = Math.round(selectedStyle.basePrice * selectedSize.multiplier + selectedPaper.extraCost);
    setFinalPrice(price);
  }, [selectedStyle, selectedSize, selectedPaper]);

  // ── Load Razorpay script ──
  useEffect(() => {
    const existing = document.getElementById('rzp-studio-script');
    if (!existing) {
      const s = document.createElement('script');
      s.id = 'rzp-studio-script';
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.async = true;
      document.body.appendChild(s);
    }
  }, []);

  // ── Handlers ──

  const handleSelectStyle = (style: ArtStyle) => {
    setSelectedStyle(style);
    persistConfig(style, selectedSize, selectedPaper);
    if (!style.requiresReference) setReferenceImageUrl('');
    addToast(`"${style.title}" added to vision`, 'info');
    setTimeout(() => setCurrentStep(2), 600); // Auto-advance for better UX
  };

  const handleSelectSize = (size: SizeOption) => {
    setSelectedSize(size);
    persistConfig(selectedStyle, size, selectedPaper);
  };

  const handleSelectPaper = (paper: PaperType) => {
    setSelectedPaper(paper);
    persistConfig(selectedStyle, selectedSize, paper);
  };

  const handleUploadReference = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !preset) {
      addToast('Image upload not configured', 'error');
      return;
    }

    try {
      setIsUploadingRef(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', preset);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setReferenceImageUrl(data.secure_url);
      addToast('Reference vision captured ✓', 'success');
    } catch {
      addToast('Upload failed. Try again.', 'error');
    } finally {
      setIsUploadingRef(false);
    }
  };

  const validateCustomerInfo = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) errs.email = 'Valid email required';
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) errs.phone = 'Valid 10-digit phone required';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const isReadyToOrder = Boolean(selectedStyle && selectedSize && selectedPaper && finalPrice > 0);

  const handleProceed = async () => {
    if (!isReadyToOrder) return;

    if (status !== 'authenticated') {
      addToast('Please sign in to place your order', 'info');
      signIn('credentials', { callbackUrl: window.location.href });
      return;
    }

    if (currentStep !== 4) {
      setCurrentStep(4);
      return;
    }

    if (!validateCustomerInfo()) {
      addToast('Please fill in your details', 'error');
      return;
    }

    if (selectedStyle?.requiresReference && !referenceImageUrl.trim()) {
      addToast(`"${selectedStyle.title}" requires a reference image`, 'error');
      setCurrentStep(3);
      return;
    }

    if (!(window as any).Razorpay) {
      addToast('Payment system loading...', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitStage('Drafting your commission...');

      const orderRes = await fetch('/api/custom-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name, email, phone,
          styleId: selectedStyle!._id,
          sizeId: selectedSize!._id,
          paperId: selectedPaper!._id,
          clientFinalPrice: finalPrice,
          notes: notes.trim() || undefined,
          referenceImageUrl: referenceImageUrl.trim() || undefined,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error);
      const { orderId, totalAmount } = orderData;
      
      setSubmitStage('Contacting Secure Gateway...');
      const payRes = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totalAmount, orderId }),
      });
      const payData = await payRes.json();
      if (!payRes.ok) throw new Error(payData.error);

      const options = {
        key: env.NEXT_PUBLIC_RAZORPAY_KEY,
        amount: payData.amount,
        currency: 'INR',
        name: 'The Virtual Canvas',
        description: `Studio: ${selectedStyle!.title}`,
        order_id: payData.id,
        handler: async (response: any) => {
          setSubmitStage('Verifying transaction...');
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...response, orderId }),
          });

          if (verifyRes.ok) {
            try { localStorage.removeItem(STORAGE_KEY); } catch {}
            addToast('Success! Your masterpiece is being scheduled.', 'success');
            router.push(`/track-order?id=${orderId}`);
          } else {
            router.push(`/track-order?id=${orderId}`);
          }
        },
        prefill: { name, email, contact: phone },
        theme: { color: '#000000' },
        modal: {
          ondismiss: () => {
            addToast('Commission saved. You can pay anytime via tracking.', 'info');
            router.push(`/track-order?id=${orderId}`);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err: any) {
      addToast(`❌ ${err.message || 'Transmission error'}`, 'error');
    } finally {
      setIsSubmitting(false);
      setSubmitStage('');
    }
  };

  // ─── Sub-Components (Render Helpers) ──────────────────────────────────────────

  const renderSummarySidebar = () => (
    <div className="hidden lg:block lg:w-80 shrink-0">
      <div className="sticky top-40 p-8 border border-ink/10 bg-white/50 backdrop-blur-xl rounded-sm shadow-2xl">
         <div className="flex items-center gap-3 mb-8 border-b border-ink/10 pb-6">
            <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center">
               <ShieldCheck className="text-white w-4 h-4" />
            </div>
            <div>
               <p className="text-[10px] uppercase tracking-widest font-bold opacity-30">Selection</p>
               <p className="text-xs font-bold">Live Summary</p>
            </div>
         </div>

         <div className="space-y-6">
             {selectedStyle ? (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex justify-between items-start gap-4">
                 <div className="flex-1">
                    <p className="text-[9px] uppercase tracking-widest opacity-40 font-bold mb-1">Style</p>
                    <p className="text-xs font-medium leading-tight">{selectedStyle.title}</p>
                 </div>
                 <p className="text-xs font-serif font-bold">₹{selectedStyle.basePrice.toLocaleString()}</p>
              </motion.div>
            ) : <p className="text-[10px] italic opacity-20">No style selected</p>}

            {selectedSize && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex justify-between items-start gap-4">
                 <div className="flex-1">
                    <p className="text-[9px] uppercase tracking-widest opacity-40 font-bold mb-1">Format</p>
                    <p className="text-xs font-medium">{selectedSize.label}</p>
                 </div>
                 <p className="text-[11px] font-sans font-bold text-ink/60">×{selectedSize.multiplier}</p>
              </motion.div>
            )}

            {selectedPaper && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex justify-between items-start gap-4 border-b border-ink/10 pb-6">
                 <div className="flex-1">
                    <p className="text-[9px] uppercase tracking-widest opacity-40 font-bold mb-1">Medium</p>
                    <p className="text-xs font-medium">{selectedPaper.title}</p>
                 </div>
                 <p className="text-[11px] font-sans font-bold text-ink/60">+{selectedPaper.extraCost}</p>
              </motion.div>
            )}
         </div>

         <div className="mt-8">
            <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold mb-2">Estimated Investment</p>
            <motion.p key={finalPrice} initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="text-3xl font-serif tracking-tighter">
              ₹{finalPrice.toLocaleString()}
            </motion.p>
            <p className="text-[9px] opacity-30 mt-2 font-medium">Incl. all taxes & digital delivery</p>
         </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col items-center">
      
      {/* ── Stepper Header ────────────────────────────────────────────── */}
      <div className="w-full max-w-2xl mb-20 px-6">
         <div className="flex justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-ink/5 -z-10" />
            {STEPS.map((s) => (
              <button 
                key={s.id} 
                onClick={() => isReadyToOrder && setCurrentStep(s.id)}
                disabled={!isReadyToOrder && s.id > 1}
                className="flex flex-col items-center gap-3 group"
              >
                 <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] transition-all duration-500 font-serif
                    ${currentStep === s.id ? 'bg-ink text-white border-ink shadow-lg scale-110' : 
                      currentStep > s.id ? 'bg-green-500 text-white border-green-500' : 'bg-canvas border-ink/10 text-ink/30'}`}>
                    {currentStep > s.id ? <Check size={14} strokeWidth={3} /> : s.id}
                 </div>
                 <div className="text-center">
                    <p className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${currentStep === s.id ? 'text-ink' : 'text-ink/20'}`}>{s.title}</p>
                 </div>
              </button>
            ))}
         </div>
      </div>

      <div className="w-full flex flex-col lg:flex-row gap-16 px-6 relative">
        
        {/* ── Main Configurator ─────────────────────────────────────────── */}
        <div className="flex-1 w-full min-h-[500px]">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: STYLE */}
            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }}>
                <div className="mb-12">
                   <h2 className="font-serif text-4xl tracking-tight mb-4">Choose Your Art Direction</h2>
                   <p className="text-sm text-ink/50 max-w-lg leading-relaxed">Select a foundational style for your commission. Each direction is handled by specialized artists.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {styles.map((style) => (
                     <button
                        key={style._id}
                        onClick={() => handleSelectStyle(style)}
                        className={`group relative flex items-center gap-6 p-6 border transition-all duration-500 text-left rounded-sm
                          ${selectedStyle?._id === style._id ? 'border-ink bg-ink/[0.02] shadow-xl' : 'border-ink/5 hover:border-ink/20'}`}
                     >
                        <div className="relative w-32 h-32 shrink-0 overflow-hidden bg-ink/5 rounded-sm">
                           {style.imageUrl ? (
                             <Image src={style.imageUrl} alt={style.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                           ) : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="opacity-10" /></div>}
                           
                           {/* Selection Badge - Now on Image */}
                           {selectedStyle?._id === style._id && (
                             <motion.div 
                               initial={{ scale: 0, opacity: 0 }}
                               animate={{ scale: 1, opacity: 1 }}
                               className="absolute top-2 right-2 w-7 h-7 rounded-full bg-ink text-white flex items-center justify-center shadow-lg z-10"
                             >
                               <Check size={14} strokeWidth={4} />
                             </motion.div>
                           )}
                        </div>
                        <div className="flex-1">
                           <h3 className="font-serif text-xl leading-tight mb-2 pr-4">{style.title}</h3>
                           <p className="text-[11px] text-ink/50 line-clamp-2 leading-relaxed mb-4">{style.description}</p>
                           <div className="flex flex-wrap items-center gap-3">
                              <span className="text-[10px] font-serif font-bold bg-ink text-white px-3 py-1 rounded-full">From ₹{style.basePrice.toLocaleString()}</span>
                              {style.requiresReference && (
                                <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-amber-600 font-extrabold bg-amber-50 px-2 py-1 rounded-sm">
                                  <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                                  Ref Required
                                </span>
                              )}
                           </div>
                        </div>
                     </button>
                   ))}
                </div>
              </motion.div>
            )}

            {/* STEP 2: FORMAT */}
            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-12">
                   <h2 className="font-serif text-4xl tracking-tight mb-4">Dimensions & Medium</h2>
                   <p className="text-sm text-ink/50 leading-relaxed">Define the physical scale and the surface of your masterpiece.</p>
                </div>

                <div className="space-y-12">
                   <section>
                      <div className="flex items-center gap-2 mb-6">
                         <Maximize2 size={16} className="opacity-30" />
                         <span className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-40">Physical Scale</span>
                      </div>
                      <div className="flex flex-wrap gap-3">
                         {sizes.map((s) => (
                           <button 
                            key={s._id} onClick={() => handleSelectSize(s)}
                            className={`px-8 py-5 border rounded-sm transition-all duration-300 min-w-[140px] text-left
                              ${selectedSize?._id === s._id ? 'bg-ink text-white border-ink shadow-lg' : 'bg-canvas border-ink/10 hover:border-ink/30'}`}>
                              <p className="text-base font-serif mb-1">{s.label}</p>
                              <p className={`text-[9px] font-mono tracking-widest ${selectedSize?._id === s._id ? 'opacity-50' : 'opacity-30'}`}>SCALE 1:{s.multiplier}</p>
                           </button>
                         ))}
                      </div>
                   </section>

                   <section>
                      <div className="flex items-center gap-2 mb-6">
                         <Layers size={16} className="opacity-30" />
                         <span className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-40">Surface Material</span>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {papers.map((p) => (
                           <button 
                            key={p._id} onClick={() => handleSelectPaper(p)}
                            className={`px-8 py-5 border rounded-sm transition-all duration-300 min-w-[160px] text-left group
                              ${selectedPaper?._id === p._id ? 'bg-ink text-white border-ink shadow-lg' : 'bg-canvas border-ink/10 hover:border-ink/30'}`}>
                              <p className="text-base font-serif mb-1">{p.title}</p>
                              <p className={`text-[9px] font-mono tracking-widest ${selectedPaper?._id === p._id ? 'text-green-300' : 'text-ink/30'}`}>
                                 {p.extraCost === 0 ? 'SIGNATURE INCL.' : `+₹${p.extraCost}`}
                              </p>
                           </button>
                        ))}
                      </div>
                   </section>
                </div>
              </motion.div>
            )}

            {/* STEP 3: CONTEXT */}
            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-12">
                   <h2 className="font-serif text-4xl tracking-tight mb-4">Vision & Details</h2>
                   <p className="text-sm text-ink/50 leading-relaxed">Provide context and reference images for your specialized artist.</p>
                </div>

                <div className="space-y-10">
                   <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 mb-2">
                         <UploadCloud size={16} className="opacity-30" />
                         <span className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-40">Reference Material</span>
                      </div>
                      <label className={`relative h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer bg-white/5
                         ${selectedStyle?.requiresReference && !referenceImageUrl ? 'border-amber-400 bg-amber-50/20' : 'border-ink/10 hover:border-ink/30'}`}>
                         <input type="file" onChange={handleUploadReference} accept="image/*" className="hidden" />
                         {isUploadingRef ? <ArtLoader variant="inline" size="sm" /> : referenceImageUrl ? (
                           <div className="relative w-full h-full p-4">
                              <Image src={referenceImageUrl} alt="Reference" fill className="object-contain p-4" />
                              <div className="absolute inset-0 bg-ink/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-xl">
                                 <p className="text-white text-[10px] font-bold uppercase tracking-widest">Change Image</p>
                              </div>
                           </div>
                         ) : (
                           <div className="flex flex-col items-center gap-4 px-12 text-center">
                              <div className="w-12 h-12 rounded-full bg-ink/5 flex items-center justify-center"><ImageIcon className="opacity-20" /></div>
                              <div>
                                 <p className="text-[10px] font-bold uppercase tracking-widest mb-1">Click to Upload Vision</p>
                                 <p className="text-[9px] opacity-30">JPG, PNG · Max 5MB · High resolution preferred</p>
                              </div>
                           </div>
                         )}
                      </label>
                   </div>

                   <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 mb-2">
                         <FileText size={16} className="opacity-30" />
                         <span className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-40">Creative Notes</span>
                      </div>
                      <textarea 
                        value={notes} onChange={(e) => setNotes(e.target.value)}
                        placeholder="Share your specific thoughts, color palettes, or desired emotions..."
                        rows={5}
                        className="w-full bg-white border border-ink/10 rounded-xl p-6 text-sm font-sans outline-none focus:border-ink/40 transition-all leading-relaxed shadow-sm resize-none"
                      />
                   </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: VERIFY */}
            {currentStep === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-12">
                   <h2 className="font-serif text-4xl tracking-tight mb-4">Billed Information</h2>
                   <p className="text-sm text-ink/50 leading-relaxed">Provide your contact details for official order tracking and digital delivery.</p>
                </div>

                <div className="grid grid-cols-1 gap-8 max-w-lg">
                   <div className="space-y-6">
                      <div className="relative group">
                         <span className="absolute -top-2 left-4 px-2 bg-canvas text-[9px] font-bold uppercase tracking-widest z-10 text-ink/40">Full Name</span>
                         <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-4 pt-6 bg-white border border-ink/10 rounded-xl text-sm outline-none focus:border-ink transition-all shadow-sm" placeholder="e.g. Rahul Sharma" />
                         {fieldErrors.name && <p className="text-[9px] text-red-500 mt-2 ml-4 uppercase tracking-widest">{fieldErrors.name}</p>}
                      </div>
                      <div className="relative group">
                         <span className="absolute -top-2 left-4 px-2 bg-canvas text-[9px] font-bold uppercase tracking-widest z-10 text-ink/40">Secured Email</span>
                         <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-4 pt-6 bg-white border border-ink/10 rounded-xl text-sm outline-none focus:border-ink transition-all shadow-sm" placeholder="name@domain.com" />
                         {fieldErrors.email && <p className="text-[9px] text-red-500 mt-2 ml-4 uppercase tracking-widest">{fieldErrors.email}</p>}
                      </div>
                      <div className="relative group">
                         <span className="absolute -top-2 left-4 px-2 bg-canvas text-[9px] font-bold uppercase tracking-widest z-10 text-ink/40">Contact Number</span>
                         <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-4 pt-6 bg-white border border-ink/10 rounded-xl text-sm outline-none focus:border-ink transition-all shadow-sm" placeholder="+91 XXX XXX XXXX" />
                         {fieldErrors.phone && <p className="text-[9px] text-red-500 mt-2 ml-4 uppercase tracking-widest">{fieldErrors.phone}</p>}
                      </div>
                   </div>
                </div>

                <div className="mt-12 p-8 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-4">
                   <ShieldCheck className="text-blue-500 shrink-0 mt-1" size={20} />
                   <div>
                      <p className="text-xs font-bold text-blue-900 mb-1 uppercase tracking-widest">Client Protection Active</p>
                      <p className="text-[11px] text-blue-800/70 leading-relaxed">Your data and payment are secured via industry-standard encryption. Commission tracking will be sent to the email provided above instantly.</p>
                   </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="mt-16 pt-10 border-t border-ink/5 flex items-center justify-between">
              <button 
                onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                className={`flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest transition-all
                  ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'opacity-40 hover:opacity-100 hover:-translate-x-1'}`}
              >
                <ChevronLeft size={16} />
                Back to Selection
              </button>

              <button 
                onClick={handleProceed}
                disabled={isSubmitting || (currentStep === 1 && !selectedStyle)}
                className="group flex items-center gap-3 px-10 py-5 bg-ink text-white rounded-sm text-[10px] font-bold uppercase tracking-[0.4em] transition-all hover:shadow-2xl active:scale-95 disabled:opacity-30"
              >
                {isSubmitting ? (
                  <ArtLoader variant="inline" size="sm" className="text-white" />
                ) : (
                  <>
                    {currentStep < 4 ? 'Continue Order' : `Pay ₹${finalPrice.toLocaleString()}`}
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
          </div>
        </div>

        {/* ── Summary Sidebar ────────────────────────────────────────────── */}
        {renderSummarySidebar()}
      </div>
    </div>
  );
}
