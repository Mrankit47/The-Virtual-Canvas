'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
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
  FileText,
  Loader2
} from 'lucide-react';
import { uploadToCloudinary } from '@/lib/cloudinaryUpload';

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
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Flow state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStage, setSubmitStage] = useState('');
  const [isUploadingRef, setIsUploadingRef] = useState(false);

  // Coupon States
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [unDiscountedPrice, setUnDiscountedPrice] = useState(0);

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
      setUnDiscountedPrice(0);
      return;
    }
    const price = Math.round(selectedStyle.basePrice * selectedSize.multiplier + selectedPaper.extraCost);
    setUnDiscountedPrice(price);
    
    if (appliedCoupon) {
      setFinalPrice(Math.max(0, price - appliedCoupon.discountAmount));
    } else {
      setFinalPrice(price);
    }
  }, [selectedStyle, selectedSize, selectedPaper, appliedCoupon]);

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

    try {
      setIsUploadingRef(true);
      const folder = 'TVC assets/Order references';
      const imageUrl = await uploadToCloudinary(file, folder);
      setReferenceImageUrl(imageUrl);
      addToast('Reference vision captured ✓', 'success');
    } catch (err: any) {
      addToast(err.message || 'Upload failed. Try again.', 'error');
    } finally {
      setIsUploadingRef(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    
    try {
      setIsValidatingCoupon(true);
      const res = await fetch('/api/coupon/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput, total: unDiscountedPrice }),
      });
      
      const data = await res.json();
      
      if (data.valid) {
        setAppliedCoupon({
          code: couponInput.trim().toUpperCase(),
          discountAmount: data.discountAmount
        });
        addToast(data.message, 'success');
      } else {
        addToast(data.message || 'Invalid coupon code', 'error');
      }
    } catch (err) {
      addToast('Failed to validate coupon', 'error');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    addToast('Coupon removed', 'info');
  };

  const validateCustomerInfo = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) errs.email = 'Valid email required';
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) errs.phone = 'Valid 10-digit phone required';
    if (!address.trim() || address.length < 10) errs.address = 'Full shipping address required';
    if (!pincode.trim() || !/^\d{6}$/.test(pincode)) errs.pincode = 'Invalid 6-digit pin code';
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
          customerName: name, email, phone, address, pincode,
          styleId: selectedStyle!._id,
          sizeId: selectedSize!._id,
          paperId: selectedPaper!._id,
          clientFinalPrice: finalPrice,
          notes: notes.trim() || undefined,
          referenceImageUrl: referenceImageUrl.trim() || undefined,
          couponCode: appliedCoupon?.code,
          discountAmount: appliedCoupon?.discountAmount
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
    <div className="w-full lg:w-80 shrink-0 mt-12 lg:mt-0 order-last lg:order-none">
      <div className="sticky top-40 p-6 sm:p-8 border border-ink/10 bg-white/50 backdrop-blur-xl rounded-sm shadow-2xl overflow-hidden relative group">
         <div className="absolute top-0 right-0 p-8 opacity-[0.03] font-serif text-[120px] leading-none select-none pointer-events-none group-hover:translate-x-4 transition-transform duration-1000">₹</div>
         <div className="flex items-center gap-3 mb-8 border-b border-ink/10 pb-6 relative z-10">
            <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center shadow-lg">
               <ShieldCheck className="text-white w-4 h-4" />
            </div>
            <div>
               <p className="text-[10px] uppercase tracking-widest font-extrabold opacity-30">Live Summary</p>
               <p className="text-xs font-bold font-serif italic text-ink/70">Secure Order Build</p>
            </div>
         </div>

         <div className="space-y-6 relative z-10">
             {selectedStyle ? (
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                     <p className="text-[9px] uppercase tracking-widest opacity-40 font-bold mb-1">Style Selection</p>
                     <p className="text-xs font-bold leading-tight">{selectedStyle.title}</p>
                  </div>
                  <p className="text-xs font-serif font-bold text-ink">₹{selectedStyle.basePrice.toLocaleString()}</p>
               </motion.div>
             ) : <p className="text-[10px] italic opacity-40 font-medium">Select a Style to begin</p>}

            {selectedSize && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-start gap-4">
                 <div className="flex-1">
                    <p className="text-[9px] uppercase tracking-widest opacity-40 font-bold mb-1">Format Scale</p>
                    <p className="text-xs font-bold">{selectedSize.label}</p>
                 </div>
                 <p className="text-[10px] font-mono font-bold text-ink/50 bg-gray-100 px-2 py-0.5 rounded-sm">×{selectedSize.multiplier}</p>
              </motion.div>
            )}

            {selectedPaper && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-start gap-4 border-b border-ink/10 pb-6">
                 <div className="flex-1">
                    <p className="text-[9px] uppercase tracking-widest opacity-40 font-bold mb-1">Medium Choice</p>
                    <p className="text-xs font-bold">{selectedPaper.title}</p>
                 </div>
                 <p className="text-[10px] font-mono font-bold text-ink/50 bg-gray-100 px-2 py-0.5 rounded-sm">+{selectedPaper.extraCost}</p>
              </motion.div>
            )}
         </div>

         <div className="mt-8 border-t border-ink/10 pt-6 relative z-10">
            <p className="text-[10px] uppercase tracking-widest opacity-40 font-extrabold mb-5">Investment Breakdown</p>
            
            <div className="space-y-3 mb-6">
                {appliedCoupon && (
                <div className="flex justify-between items-center text-xs opacity-40 line-through">
                    <span className="font-medium">Subtotal</span>
                    <span>₹{unDiscountedPrice.toLocaleString()}</span>
                </div>
                )}
                
                {appliedCoupon && (
                <div className="flex justify-between items-center text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-sm">
                    <span className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Discount
                    </span>
                    <span>-₹{appliedCoupon.discountAmount.toLocaleString()}</span>
                </div>
                )}
            </div>

            <div className="flex justify-between items-baseline mb-6">
              <span className="text-sm font-bold font-serif opacity-70">Total Acquisition</span>
              <motion.div key={finalPrice} initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="flex items-baseline gap-1 text-ink">
                <span className="text-xl opacity-40 font-serif">₹</span>
                <span className="text-4xl font-serif font-bold tracking-tighter">
                    {finalPrice.toLocaleString()}
                </span>
                <span className="text-xs opacity-20 font-sans ml-1">.00</span>
              </motion.div>
            </div>
            
            <div className="flex items-center gap-2 mt-2 opacity-50 grayscale hover:grayscale-0 transition-all duration-500 cursor-default">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <p className="text-[9px] uppercase tracking-widest font-extrabold">SSL Secure Transaction</p>
            </div>
         </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col items-center">
      
      {/* ── Stepper Header ────────────────────────────────────────────── */}
      <div className="w-full max-w-2xl mb-12 sm:mb-20 px-4 sm:px-6">
         <div className="flex justify-between relative px-2 sm:px-8">
            <div className="absolute top-1/2 left-0 w-full h-[1.5px] bg-ink/5 -z-10" />
            {STEPS.map((s) => (
              <button 
                key={s.id} 
                onClick={() => isReadyToOrder && setCurrentStep(s.id)}
                disabled={!isReadyToOrder && s.id > 1}
                className="flex flex-col items-center gap-3 sm:gap-4 group outline-none"
              >
                 <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center text-[10px] sm:text-xs transition-all duration-500 font-serif
                    ${currentStep === s.id ? 'bg-ink text-white border-ink shadow-xl scale-110 sm:scale-125' : 
                      currentStep > s.id ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-canvas border-ink/20 text-ink/30'}`}>
                    {currentStep > s.id ? <Check size={16} strokeWidth={3} /> : s.id}
                 </div>
                 <div className="text-center hidden sm:block">
                    <p className={`text-[9px] font-extrabold uppercase tracking-[0.2em] transition-colors ${currentStep === s.id ? 'text-ink' : 'text-ink/20'}`}>{s.title}</p>
                 </div>
              </button>
            ))}
         </div>
      </div>

      <div className="w-full flex flex-col lg:flex-row gap-12 sm:gap-16 px-4 sm:px-6 relative">
        
        {/* ── Main Configurator ─────────────────────────────────────────── */}
        <div className="flex-1 w-full min-h-[500px]">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: STYLE */}
            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}>
                <div className="mb-12">
                   <h2 className="font-serif text-3xl sm:text-4xl tracking-tight mb-4 text-ink">Choose Your Art Direction</h2>
                   <p className="text-sm text-ink/50 max-w-lg leading-relaxed font-medium">Select a foundational style for your commission. Each direction is handled by specialized master artists.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                   {styles.map((style) => (
                     <button
                        key={style._id}
                        onClick={() => handleSelectStyle(style)}
                        className={`group relative flex items-center gap-4 sm:gap-6 p-4 sm:p-6 border transition-all duration-500 text-left rounded-sm
                          ${selectedStyle?._id === style._id ? 'border-ink bg-ink/[0.02] shadow-2xl scale-[1.01] z-10' : 'border-ink/5 hover:border-ink/20 hover:shadow-lg'}`}
                     >
                        <div className="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0 overflow-hidden bg-ink/5 rounded-sm shadow-inner mt-[-4px]">
                           {style.imageUrl ? (
                             <Image src={style.imageUrl} alt={style.title} fill className="object-cover transition-transform duration-1000 group-hover:scale-110" />
                           ) : <div className="w-full h-full flex items-center justify-center bg-gray-50"><ImageIcon className="opacity-10 w-8 h-8" /></div>}
                           
                           {selectedStyle?._id === style._id && (
                             <motion.div 
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-ink text-white flex items-center justify-center shadow-2xl z-20 border border-white/20"
                             >
                               <Check size={14} strokeWidth={4} />
                             </motion.div>
                           )}
                           <div className="absolute inset-0 bg-ink/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="flex-1">
                           <h3 className="font-serif text-lg sm:text-xl leading-tight mb-2 pr-4 text-ink group-hover:translate-x-1 transition-transform">{style.title}</h3>
                           <p className="text-[10px] sm:text-[11px] text-ink/40 line-clamp-2 leading-relaxed mb-4 font-medium">{style.description}</p>
                           <div className="flex flex-wrap items-center gap-3">
                              <span className="text-[10px] font-bold bg-ink text-white px-3 py-1 rounded-sm shadow-lg">From ₹{style.basePrice.toLocaleString()}</span>
                              {style.requiresReference && (
                                <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-100">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  Vision Required
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
              <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}>
                <div className="mb-12">
                   <h2 className="font-serif text-3xl sm:text-4xl tracking-tight mb-4 text-ink">Dimensions & Medium</h2>
                   <p className="text-sm text-ink/50 leading-relaxed font-medium">Define the physical scale and the exclusive surface for your masterpiece.</p>
                </div>

                <div className="space-y-12">
                   <section>
                      <div className="flex items-center gap-3 mb-6">
                         <div className="w-1.5 h-1.5 rounded-full bg-ink/20" />
                         <span className="text-[10px] uppercase font-extrabold tracking-[0.3em] opacity-40">Physical Scale Selection</span>
                      </div>
                      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-4">
                         {sizes.map((s) => (
                           <button 
                            key={s._id} onClick={() => handleSelectSize(s)}
                            className={`px-6 py-5 sm:px-10 sm:py-6 border rounded-sm transition-all duration-300 flex-1 sm:flex-initial text-left group shadow-sm hover:shadow-md
                              ${selectedSize?._id === s._id ? 'bg-ink text-white border-ink shadow-2xl scale-[1.02] z-10' : 'bg-canvas border-ink/10 hover:border-ink/20'}`}>
                              <p className="text-lg sm:text-xl font-serif mb-2">{s.label}</p>
                              <div className="flex items-center justify-between">
                                <p className={`text-[9px] font-mono tracking-widest font-bold ${selectedSize?._id === s._id ? 'opacity-60' : 'opacity-30'}`}>SCALE 1:{s.multiplier}</p>
                                {selectedSize?._id === s._id && <Check size={12} className="text-white ring-1 ring-white/20 rounded-full" />}
                              </div>
                           </button>
                         ))}
                      </div>
                   </section>

                   <section>
                      <div className="flex items-center gap-3 mb-6">
                         <div className="w-1.5 h-1.5 rounded-full bg-ink/20" />
                         <span className="text-[10px] uppercase font-extrabold tracking-[0.3em] opacity-40">Mastery Surface Material</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {papers.map((p) => (
                           <button 
                            key={p._id} onClick={() => handleSelectPaper(p)}
                            className={`px-6 py-5 sm:px-8 sm:py-6 border rounded-sm transition-all duration-300 text-left group shadow-sm hover:shadow-md
                              ${selectedPaper?._id === p._id ? 'bg-ink text-white border-ink shadow-2xl scale-[1.02] z-10' : 'bg-canvas border-ink/10 hover:border-ink/20'}`}>
                              <p className="text-lg sm:text-xl font-serif mb-2">{p.title}</p>
                              <div className="flex items-center justify-between">
                                <p className={`text-[10px] font-mono tracking-widest font-extrabold ${selectedPaper?._id === p._id ? 'text-emerald-300' : 'text-ink/40'}`}>
                                   {p.extraCost === 0 ? 'SIGNATURE INCL.' : `+₹${p.extraCost}`}
                                </p>
                                {selectedPaper?._id === p._id && <Check size={12} className="text-white ring-1 ring-white/20 rounded-full" />}
                              </div>
                              <p className={`text-[9px] mt-3 leading-relaxed transition-colors ${selectedPaper?._id === p._id ? 'text-white/50' : 'text-ink/40'}`}>{p.description}</p>
                           </button>
                        ))}
                      </div>
                   </section>
                </div>
              </motion.div>
            )}

            {/* STEP 3: CONTEXT */}
            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}>
                <div className="mb-12">
                   <h2 className="font-serif text-3xl sm:text-4xl tracking-tight mb-4 text-ink">Vision & Nuance</h2>
                   <p className="text-sm text-ink/50 leading-relaxed font-medium">Capture your creative direction for your dedicated master artist.</p>
                </div>

                <div className="space-y-12">
                   <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3 mb-2">
                         <UploadCloud size={16} className="opacity-30" />
                         <span className="text-[10px] uppercase font-extrabold tracking-[0.3em] opacity-40">Primary Reference Material</span>
                      </div>
                      <label className={`relative min-h-[300px] sm:h-80 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer bg-white/[0.02] shadow-inner
                         ${selectedStyle?.requiresReference && !referenceImageUrl ? 'border-amber-400 bg-amber-50/20 animate-pulse' : 'border-ink/10 hover:border-ink/30'}`}>
                         <input type="file" onChange={handleUploadReference} accept="image/*" className="hidden" />
                         
                         {isUploadingRef ? (
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="animate-spin text-ink/20" size={24} />
                                <p className="text-[10px] uppercase tracking-widest font-extrabold opacity-40 animate-pulse">Encoding Vision...</p>
                            </div>
                         ) : referenceImageUrl ? (
                            <div className="relative w-full h-full p-4 group">
                               <Image src={referenceImageUrl} alt="Reference" fill className="object-contain p-6" />
                               <div className="absolute inset-0 bg-ink/50 backdrop-blur-[2px] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-xl">
                                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-3">
                                    <Type className="text-white w-5 h-5" />
                                  </div>
                                  <p className="text-white text-[10px] font-extrabold uppercase tracking-[0.2em] bg-ink px-4 py-2 border border-white/10 shadow-2xl">Capture New Vision</p>
                               </div>
                               <div className="absolute top-6 left-6 px-3 py-1 bg-emerald-500 text-white text-[9px] font-extrabold uppercase tracking-widest rounded-sm shadow-xl">Verified Image ✓</div>
                            </div>
                         ) : (
                            <div className="flex flex-col items-center gap-6 px-8 text-center sm:px-12">
                               <div className="w-16 h-16 rounded-full bg-ink/5 flex items-center justify-center border border-ink/5 shadow-inner scale-100 group-hover:scale-110 transition-transform duration-500">
                                <UploadCloud className="text-ink/30 w-8 h-8" />
                               </div>
                               <div>
                                  <p className="font-serif text-xl sm:text-2xl tracking-tight mb-2">Drag & Drop your vision here</p>
                                  <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] opacity-30 font-bold max-w-xs mx-auto leading-relaxed">
                                    High fidelity reference material ensures 100% precision in final output.
                                  </p>
                               </div>
                               <div className="px-10 py-4 bg-ink text-white text-[10px] font-extrabold uppercase tracking-[0.2em] shadow-2xl shadow-ink/20 hover:translate-y-[-2px] active:translate-y-0 transition-all">Select Master File</div>
                            </div>
                         )}
                      </label>
                   </div>

                   <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3 mb-2">
                         <FileText size={16} className="opacity-30" />
                         <span className="text-[10px] uppercase font-extrabold tracking-[0.3em] opacity-40">Creative Constraints & Nuance</span>
                      </div>
                      <textarea 
                        value={notes} onChange={(e) => setNotes(e.target.value)}
                        placeholder="Shared desired emotion, lighting, specific palettes, or focal points for the artist to emphasize..."
                        rows={6}
                        className="w-full bg-white border border-ink/10 rounded-xl p-6 sm:p-8 text-sm sm:text-base font-sans outline-none focus:ring-1 focus:ring-ink/20 focus:border-ink/40 transition-all leading-relaxed shadow-sm resize-none placeholder:text-ink/20"
                      />
                   </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: VERIFY */}
            {currentStep === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}>
                <div className="mb-12">
                   <h2 className="font-serif text-3xl sm:text-4xl tracking-tight mb-4 text-ink">Identity & Secure Billing</h2>
                   <p className="text-sm text-ink/50 leading-relaxed font-medium">Configure order ownership and digital certificate details.</p>
                </div>

                <div className="grid grid-cols-1 gap-10 max-w-xl">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="relative group sm:col-span-2">
                         <span className="absolute -top-2 left-5 px-2 bg-canvas text-[9px] font-extrabold uppercase tracking-widest z-10 text-ink/40">Full Legal Name</span>
                         <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-5 sm:p-6 bg-white border border-ink/10 rounded-xl text-sm sm:text-base outline-none focus:ring-1 focus:ring-ink/20 focus:border-ink transition-all shadow-sm" placeholder="e.g. Rahul Sharma" />
                         {fieldErrors.name && <p className="text-[9px] text-rose-500 mt-2 font-bold ml-5 uppercase tracking-widest">{fieldErrors.name}</p>}
                      </div>
                      <div className="relative group">
                         <span className="absolute -top-2 left-5 px-2 bg-canvas text-[9px] font-extrabold uppercase tracking-widest z-10 text-ink/40">Secured Digital Email</span>
                         <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-5 sm:p-6 bg-white border border-ink/10 rounded-xl text-sm sm:text-base outline-none focus:ring-1 focus:ring-ink/20 focus:border-ink transition-all shadow-sm" placeholder="rahul@example.com" />
                         {fieldErrors.email && <p className="text-[9px] text-rose-500 mt-2 font-bold ml-5 uppercase tracking-widest">{fieldErrors.email}</p>}
                      </div>
                      <div className="relative group">
                         <span className="absolute -top-2 left-5 px-2 bg-canvas text-[9px] font-extrabold uppercase tracking-widest z-10 text-ink/40">Encrypted Phone</span>
                         <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-5 sm:p-6 bg-white border border-ink/10 rounded-xl text-sm sm:text-base outline-none focus:ring-1 focus:ring-ink/20 focus:border-ink transition-all shadow-sm" placeholder="+91 XXXXX XXXXX" />
                         {fieldErrors.phone && <p className="text-[9px] text-rose-500 mt-2 font-bold ml-5 uppercase tracking-widest">{fieldErrors.phone}</p>}
                      </div>
                      <div className="relative group sm:col-span-2">
                         <span className="absolute -top-2 left-5 px-2 bg-canvas text-[9px] font-extrabold uppercase tracking-widest z-10 text-ink/40">Shipping Address</span>
                         <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className="w-full p-5 sm:p-6 bg-white border border-ink/10 rounded-xl text-sm sm:text-base outline-none focus:ring-1 focus:ring-ink/20 focus:border-ink transition-all shadow-sm resize-none" placeholder="House no, Street, Landmark..." />
                         {fieldErrors.address && <p className="text-[9px] text-rose-500 mt-2 font-bold ml-5 uppercase tracking-widest">{fieldErrors.address}</p>}
                      </div>
                      <div className="relative group max-w-[200px]">
                         <span className="absolute -top-2 left-5 px-2 bg-canvas text-[9px] font-extrabold uppercase tracking-widest z-10 text-ink/40">Pin Code</span>
                         <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} maxLength={6} className="w-full p-5 sm:p-6 bg-white border border-ink/10 rounded-xl text-sm sm:text-base outline-none focus:ring-1 focus:ring-ink/20 focus:border-ink transition-all shadow-sm font-mono tracking-widest" placeholder="000000" />
                         {fieldErrors.pincode && <p className="text-[9px] text-rose-500 mt-2 font-bold ml-5 uppercase tracking-widest">{fieldErrors.pincode}</p>}
                      </div>
                   </div>
                </div>

                <div className="mt-12 p-6 sm:p-10 bg-indigo-50/50 border border-indigo-100 rounded-3xl flex items-start gap-5 relative overflow-hidden group">
                   <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500/20" />
                   <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-xl shadow-indigo-500/10 shrink-0">
                      <ShieldCheck className="text-indigo-600 w-6 h-6" />
                   </div>
                   <div>
                      <p className="text-[11px] font-extrabold text-indigo-900 mb-2 uppercase tracking-[0.2em]">Privacy & Integrity Shield Active</p>
                      <p className="text-xs sm:text-sm text-indigo-800/60 leading-relaxed font-serif italic pr-4">
                        "Your vision is sacred. We encrypt all customer data and ensure 100% confidentiality of your creative references & final artwork."
                      </p>
                   </div>
                </div>

                {/* Coupon Section in Step 4 */}
                <div className="mt-8 p-8 border border-ink/10 rounded-2xl bg-white/50 backdrop-blur-sm shadow-sm max-w-lg">
                   <div className="flex items-center gap-2 mb-6">
                      <CreditCard size={16} className="opacity-30" />
                      <span className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-40">Apply Promotion</span>
                   </div>

                   {!appliedCoupon ? (
                      <div className="flex gap-4">
                         <div className="relative flex-1">
                            <input 
                               type="text" 
                               placeholder="Coupon Code" 
                               value={couponInput}
                               onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                               className="w-full bg-transparent border-b border-ink/20 py-3 outline-none focus:border-ink transition-all font-mono text-xs tracking-widest placeholder:font-sans placeholder:tracking-normal"
                            />
                            {isValidatingCoupon && (
                               <div className="absolute right-0 bottom-3">
                                  <Loader2 className="animate-spin text-ink/20" size={16} />
                                </div>
                            )}
                         </div>
                         <button 
                            onClick={handleApplyCoupon}
                            disabled={!couponInput || isValidatingCoupon}
                            className="px-6 py-3 bg-ink text-white text-[10px] font-bold uppercase tracking-widest rounded-sm disabled:opacity-30 transition-opacity"
                         >
                            Apply
                         </button>
                      </div>
                   ) : (
                      <div className="flex items-center justify-between bg-green-50 px-6 py-4 border border-green-100 rounded-xl">
                         <div className="flex items-center gap-4">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                            <div>
                               <p className="text-[11px] font-mono tracking-widest text-green-700 font-bold uppercase">{appliedCoupon.code}</p>
                               <p className="text-[10px] text-green-600/70 font-medium tracking-tight">₹{appliedCoupon.discountAmount.toLocaleString()} discount secured ✓</p>
                            </div>
                         </div>
                         <button 
                            onClick={removeCoupon}
                            className="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors"
                         >
                            Remove
                         </button>
                      </div>
                   )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>

           {/* Navigation Buttons */}
           <div className="mt-16 sm:mt-24 pt-10 border-t border-ink/5 flex items-center justify-between">
               <button 
                 onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                 className={`flex items-center gap-3 text-[11px] sm:text-xs uppercase font-extrabold tracking-[0.2em] transition-all
                   ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'opacity-40 hover:opacity-100 hover:-translate-x-2'}`}
               >
                 <ChevronLeft size={18} />
                 <span className="hidden sm:inline">Back to Previous</span>
                 <span className="sm:hidden">Back</span>
               </button>

               <button 
                 onClick={handleProceed}
                 disabled={isSubmitting || (currentStep === 1 && !selectedStyle)}
                 className="group relative flex items-center gap-4 px-10 py-5 sm:px-14 sm:py-6 bg-ink text-white rounded-sm text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.3em] transition-all hover:shadow-2xl active:scale-95 disabled:opacity-30 overflow-hidden"
               >
                 <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                 {isSubmitting ? (
                   <div className="flex items-center gap-3">
                     <Loader2 className="animate-spin" size={16} />
                     <span className="animate-pulse">Authorizing...</span>
                   </div>
                 ) : (
                   <>
                     <span>{currentStep < 4 ? 'Continue' : `Pay ₹${finalPrice.toLocaleString()}`}</span>
                     <ChevronRight size={18} className="group-hover:translate-x-1.5 transition-transform" />
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
