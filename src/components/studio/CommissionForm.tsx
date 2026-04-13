'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { PageTransition } from '@/components/layout/PageTransition';
import { useOrderStore } from '@/store/useOrderStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import ArtLoader from '@/components/ui/ArtLoader';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { zodResolver } from '@hookform/resolvers/zod';
import { orderFormSchema, OrderFormValues } from '@/lib/validations/order';
import { useUIStore } from '@/store/useUIStore';
import { env } from '@/config/env';
import { client } from '@/lib/sanity';
import { GET_ART_STYLES_QUERY } from '@/sanity/queries';

interface ArtStyle {
  _id: string;
  title: string;
  basePrice: number;
  description?: string;
  requiresReference?: boolean;
}

export default function CommissionForm() {
  const { data: session, status } = useSession();
  console.log("UPI:", process.env.NEXT_PUBLIC_UPI_ID);
  const { currentStep, nextStep, prevStep, setStep } = useOrderStore();
  const { addToast } = useUIStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null); // Keep for legacy if needed, or replace with orderDetails.id
  const [orderDetails, setOrderDetails] = useState<{ id: string, createdAt: string } | null>(null);
  const [receiptData, setReceiptData] = useState<OrderFormValues | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [artStyles, setArtStyles] = useState<ArtStyle[]>([]);
  const [isLoadingStyles, setIsLoadingStyles] = useState(true);
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);
  
  // Coupon States
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [originalPrice, setOriginalPrice] = useState<number>(0);

  const { register, handleSubmit, setValue, watch, trigger, formState: { errors } } = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: { price: 150 }, 
  });

  const artworkType = watch('artworkType');
  const price = watch('price');
  const referenceImage = watch('referenceImage');
  const paymentProof = watch('paymentProof');
  useEffect(() => {
    const fetchStyles = async () => {
      try {
        setIsLoadingStyles(true);
        const styles = await client.fetch(GET_ART_STYLES_QUERY);
        setArtStyles(styles);
      } catch (err) {
        console.error('Failed to fetch dynamic art styles:', err);
      } finally {
        setIsLoadingStyles(false);
      }
    };
    fetchStyles();
  }, []);

  useEffect(() => {
    if (artworkType && artStyles.length > 0) {
      const selectedStyle = artStyles.find(style => style.title === artworkType);
      if (selectedStyle) {
        setValue('price', selectedStyle.basePrice);
        setOriginalPrice(selectedStyle.basePrice);
        // Clear coupon if style changes
        setAppliedCoupon(null);
        setCouponInput('');
      }
    }
  }, [artworkType, artStyles, setValue]);

  useEffect(() => {
    // Step 2: Load Razorpay Script (Hardened)
    const existingScript = document.getElementById('razorpay-checkout-js-order');
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = 'razorpay-checkout-js-order';
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const uploadToCloudinary = async (e: React.ChangeEvent<HTMLInputElement>, field: 'referenceImage' | 'paymentProof') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    
    if (!cloudName || !preset) {
      addToast('Cloudinary variables missing in config.', 'error');
      // Mock successful UX for demonstration without keys
      setValue(field, `https://res.cloudinary.com/demo/image/upload/sample.jpg`);
      addToast('Using mock image (Cloudinary not configured)', 'info');
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', preset);
      
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setValue(field, data.secure_url);
      
      // Temporary success state for UI
      setShowUploadSuccess(true);
      setTimeout(() => setShowUploadSuccess(false), 3000);
      
      addToast('Image uploaded securely', 'success');
    } catch (err) {
      addToast('Failed to upload image.', 'error');
    } finally {
      setUploadingImage(false);
    }
  };
  
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    
    try {
      setIsValidatingCoupon(true);
      const res = await fetch('/api/coupon/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput, total: originalPrice }),
      });
      
      const data = await res.json();
      
      if (data.valid) {
        setAppliedCoupon({
          code: couponInput.trim().toUpperCase(),
          discountAmount: data.discountAmount
        });
        setValue('price', data.discountedTotal);
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
    setValue('price', originalPrice);
    addToast('Coupon removed', 'info');
  };

  const onSubmit = async (data: OrderFormValues) => {
    if (currentStep !== 3) return;
    
    // 1. Auth Guard
    if (status !== 'authenticated') {
      addToast('Please sign in to complete your commission', 'info');
      signIn('credentials', { callbackUrl: window.location.href });
      return;
    }

    if (!(window as any).Razorpay) {
      addToast("Razorpay SDK not loaded yet. Please wait.", "error");
      return;
    }

    if (!env.NEXT_PUBLIC_RAZORPAY_KEY || env.NEXT_PUBLIC_RAZORPAY_KEY.includes('YOUR_KEY_HERE')) {
      addToast("Razorpay Key missing in .env.local", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(false);
      
      // Phase 1: Create Order in Sanity
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          couponCode: appliedCoupon?.code,
          discountAmount: appliedCoupon?.discountAmount
        }),
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      const createdOrderId = result.orderId;

      // Phase 2: Initialize Razorpay Payment
      const payRes = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: data.price,
          orderId: createdOrderId
        })
      });

      const payData = await payRes.json();
      if (!payRes.ok) throw new Error(payData.error);

      // Phase 3: Open Razorpay Popup
      const options = {
        key: env.NEXT_PUBLIC_RAZORPAY_KEY,
        amount: payData.amount,
        currency: "INR",
        name: "The Virtual Canvas",
        description: `Commission Order ${createdOrderId}`,
        order_id: payData.id,
        handler: async function (response: any) {
          // Phase 4: Verify Payment
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...response,
              orderId: createdOrderId
            })
          });

          if (verifyRes.ok) {
            setOrderDetails({ id: createdOrderId, createdAt: result.createdAt });
            setOrderId(createdOrderId);
            setReceiptData(data);
            setStep(4);
            addToast('Payment Successful & Order Finalized!', 'success');
          } else {
             addToast('Payment verification failed. Please check tracking page.', 'error');
             window.location.href = `/track-order?id=${createdOrderId}`;
          }
        },
        prefill: {
          name: data.customerName,
          email: data.email,
          contact: data.phone
        },
        theme: { color: "#000000" },
        modal: {
            ondismiss: () => {
                addToast("Payment cancelled. You can pay later via Tracking Page.", "info");
                window.location.href = `/track-order?id=${createdOrderId}`;
            }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err: any) {
      setSubmitError(true);
      addToast(`❌ Error: ${err.message || "Failed to process order"}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const attemptNextStep = async () => {
    if (currentStep === 1) {
      const isValid = await trigger(['customerName', 'email', 'phone', 'artworkType', 'description']);
      if (isValid) nextStep();
    } else if (currentStep === 2) {
      nextStep();
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('receipt-container');
    if (!element) return;
    try {
      setIsDownloading(true);
      addToast('Drafting Digital Receipt...', 'info');
      const canvas = await html2canvas(element, { scale: 3, backgroundColor: '#fcfcfc', useCORS: true, windowWidth: 1200 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`TVC-(Receipt)-${orderDetails?.id}.pdf`);
      addToast('Receipt downloaded successfully', 'success');
    } catch (error) {
      console.error('PDF Generation Error:', error);
      addToast('Failed to generate PDF.', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  if (currentStep === 4 && receiptData) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center pt-8 pb-12 px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="w-full max-w-3xl flex flex-col items-center">
            
            {/* The PDF Physical Target */}
            <div id="receipt-container" className="w-full bg-[#fcfcfc] text-ink p-6 sm:p-12 md:p-20 border border-ink/10 shadow-2xl relative overflow-hidden mb-12 group rounded-sm">
               {/* Elegant Background Noise / Texture */}
               <div className="absolute inset-0 bg-ink opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
               <div className="absolute top-0 left-0 w-full h-2 bg-ink"></div>

               {/* TVC MONOGRAM WATERMARK */}
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
                 <span className="font-serif text-[120px] sm:text-[240px] tracking-tighter text-ink opacity-[0.02] select-none">TVC</span>
               </div>

               {/* HEADER */}
               <div className="text-center mb-10 sm:mb-12 relative z-10 border-b border-ink/10 pb-10 sm:pb-12 flex flex-col items-center">
                 <div className="w-14 h-14 sm:w-16 sm:h-16 border border-ink/20 flex items-center justify-center mb-6 bg-white/50 backdrop-blur-sm shadow-sm">
                   <span className="font-serif text-xl sm:text-2xl tracking-[0.1em] text-ink opacity-80">TVC</span>
                 </div>
                 <h1 className="font-serif text-2xl sm:text-3xl md:text-5xl tracking-[0.2em] mb-4 text-ink uppercase">The Virtual Canvas</h1>
                 <p className="font-sans text-[8px] sm:text-[10px] md:text-xs uppercase tracking-[0.4em] opacity-50">Official Order Receipt</p>
               </div>

               {/* BODY: 2 COLUMN GRID */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-12 md:gap-16 relative z-10 text-left">
                 
                 {/* LEFT: DETAILS */}
                 <div className="flex flex-col gap-6 sm:gap-8">
                   {/* ORDER SUMMARY */}
                   <div>
                     <p className="text-[8px] sm:text-[9px] uppercase tracking-widest opacity-40 mb-3 font-bold">Order Information</p>
                     <div className="flex flex-wrap gap-3 items-center mb-2">
                       <span className="font-mono text-xs sm:text-sm tracking-tight text-ink bg-gray-100 px-3 py-1 border border-ink/10">{orderDetails?.id || orderId}</span>
                       <span className="font-sans text-[8px] sm:text-[9px] uppercase tracking-widest text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full font-bold">Paid</span>
                     </div>
                     <p className="font-mono text-[9px] sm:text-[10px] opacity-60 mt-2">
                        {new Date(orderDetails?.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                     </p>
                   </div>
                   
                   {/* CUSTOMER DETAILS */}
                   <div>
                     <p className="text-[8px] sm:text-[9px] uppercase tracking-widest opacity-40 mb-3 font-bold">Billed To</p>
                     <p className="font-serif text-lg sm:text-xl md:text-2xl tracking-tight capitalize text-ink mb-1">{receiptData.customerName}</p>
                     <p className="font-sans text-[11px] sm:text-xs opacity-70 tracking-wide text-ink truncate">{receiptData.email}</p>
                   </div>

                   {/* ARTWORK DETAILS */}
                   <div>
                     <p className="text-[8px] sm:text-[9px] uppercase tracking-widest opacity-40 mb-3 font-bold">Commission Type</p>
                     <p className="font-sans text-[11px] sm:text-xs uppercase tracking-widest text-ink font-bold">{receiptData.artworkType}</p>
                   </div>
                 </div>

                 {/* RIGHT: PAYMENT SECTION & QR */}
                 <div className="flex flex-col justify-between items-start md:items-end border-t md:border-t-0 md:border-l border-ink/10 pt-10 md:pt-0 md:pl-12">
                   
                   <div className="w-full flex flex-col items-start md:items-end mb-10 md:mb-0">
                     <p className="text-[8px] sm:text-[9px] uppercase tracking-widest opacity-40 mb-3 font-bold">Global Tracking QR</p>
                     <div className="p-2.5 border border-ink/10 bg-white shadow-sm inline-block">
                        <QRCodeSVG 
                          value={`${typeof window !== 'undefined' ? window.location.origin : ''}/track-order?id=${orderDetails?.id || orderId}`} 
                          size={64} 
                          bgColor="#ffffff" 
                          fgColor="#000000" 
                        />
                     </div>
                     <p className="text-[8px] uppercase tracking-[0.2em] opacity-40 mt-3 text-center md:text-right">Scan to Track Status</p>
                   </div>

                   <div className="w-full text-left md:text-right mt-auto">
                     <p className="text-[8px] sm:text-[9px] uppercase tracking-widest opacity-40 mb-3 font-bold">Total Investment</p>
                     <div className="flex flex-baseline items-baseline md:justify-end gap-1">
                        <span className="text-xl sm:text-2xl opacity-40 font-serif">₹</span>
                        <span className="font-serif font-bold text-4xl sm:text-5xl md:text-6xl text-ink leading-none">{receiptData.price}</span>
                        <span className="text-xs sm:text-sm opacity-20 font-sans ml-1">.00</span>
                     </div>
                     <p className="text-[8px] sm:text-[10px] uppercase tracking-widest opacity-40 mt-4 font-medium italic">Paid via Razorpay Secure Network</p>
                   </div>
                 </div>

               </div>

               {/* FOOTER */}
               <div className="mt-16 pt-12 border-t border-ink/10 text-center relative z-10">
                 <div className="max-w-md mx-auto flex flex-col items-center gap-4">
                   <span className="text-3xl opacity-20 font-serif leading-none">“</span>
                   <p className="font-serif italic text-xs md:text-sm text-ink/70 leading-relaxed px-4">
                     Every artwork we create is crafted with precision, passion, and a deep respect for your vision.
                   </p>
                   <p className="font-serif italic text-xs md:text-sm text-ink/70 leading-relaxed px-4">
                     We don't just create art — we transform your ideas into timeless, meaningful visual experiences.
                   </p>
                 </div>
                 <div className="mt-12 w-12 h-[1px] bg-ink/30 mx-auto"></div>
                 <p className="text-[8px] uppercase tracking-[0.5em] opacity-30 mt-6 cursor-default">Crafted with care by The Virtual Canvas</p>
               </div>
            </div>

            <div className="w-full max-w-2xl px-6 flex flex-col sm:flex-row gap-4 items-center justify-center mt-6">
              <button 
                onClick={() => window.location.href = `/track-order?id=${orderDetails?.id}`}
                className="w-full sm:w-auto px-10 py-4 sm:py-5 bg-transparent border border-ink/20 text-ink text-[11px] sm:text-xs uppercase tracking-widest hover:bg-ink/5 transition-all duration-300 font-bold"
              >
                Track Live Status
              </button>
              <button 
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="w-full sm:w-auto px-10 py-4 sm:py-5 bg-ink text-canvas text-[11px] sm:text-xs uppercase tracking-widest hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3 font-bold shadow-xl shadow-ink/10"
              >
                {isDownloading ? (
                  <>
                    <ArtLoader variant="inline" size="sm" className="text-canvas" />
                    Generating PDF...
                  </>
                ) : (
                  'Download Receipt'
                )}
              </button>
            </div>
          </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-3xl bg-ink/5 p-6 sm:p-12 md:p-16 border border-ink/10 relative overflow-hidden shadow-lg">
           <div className="flex justify-between mb-16 relative w-full px-4 sm:px-10">
             <div className="absolute top-1/2 left-0 w-full h-[1.5px] bg-ink/10 -z-10" />
             {[1, 2, 3].map((step) => (
               <div key={step} className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-serif transition-all duration-500 bg-canvas border ${currentStep >= step ? 'border-ink text-ink shadow-md scale-110' : 'border-ink/20 text-ink/40'}`}>
                 {step}
               </div>
             ))}
           </div>

           <AnimatePresence mode="wait">
             {currentStep === 1 && (
               <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                 <div className="flex flex-col gap-8">
                    <h2 className="font-serif text-2xl sm:text-3xl tracking-tight">1. Your Vision</h2>
                    
                    <div className="flex flex-col gap-2">
                      <input {...register('customerName')} type="text" placeholder="Full Name" className="w-full bg-transparent border-b border-ink/20 py-4 outline-none focus:border-ink transition-colors font-sans text-sm sm:text-base placeholder:capitalize" />
                      {errors.customerName && <span className="text-rose-500 text-[10px] uppercase tracking-widest font-bold mt-1">{errors.customerName.message}</span>}
                    </div>

                    <div className="flex flex-col gap-2">
                       <input {...register('email')} type="email" placeholder="Email Address" className="w-full bg-transparent border-b border-ink/20 py-4 outline-none focus:border-ink transition-colors font-sans text-sm sm:text-base" />
                       {errors.email && <span className="text-rose-500 text-[10px] uppercase tracking-widest font-bold mt-1">{errors.email.message}</span>}
                    </div>

                    <div className="flex flex-col gap-2">
                       <input {...register('phone')} type="tel" placeholder="Phone Number" className="w-full bg-transparent border-b border-ink/20 py-4 outline-none focus:border-ink transition-colors font-sans text-sm sm:text-base" />
                       {errors.phone && <span className="text-rose-500 text-[10px] uppercase tracking-widest font-bold mt-1">{errors.phone.message}</span>}
                    </div>

                    <div className="flex flex-col gap-2">
                       <select {...register('artworkType')} className="w-full bg-transparent border-b border-ink/20 py-4 outline-none focus:border-ink transition-colors font-sans text-sm sm:text-base opacity-70 cursor-pointer appearance-none">
                         <option value="">{isLoadingStyles ? 'Loading Styles...' : 'Select Artwork Style'}</option>
                         {artStyles.map((style) => (
                           <option key={style._id} value={style.title}>
                             {style.title} (Starting ₹{style.basePrice})
                           </option>
                         ))}
                       </select>
                       {errors.artworkType && <span className="text-rose-500 text-[10px] uppercase tracking-widest font-bold mt-1">{errors.artworkType.message}</span>}
                    </div>

                    <div className="flex flex-col gap-2">
                       <textarea 
                         {...register('description')} 
                         placeholder="Describe your artistic vision..." 
                         rows={1} 
                         className="w-full bg-transparent border-b border-ink/20 py-4 outline-none focus:border-ink transition-all font-sans text-sm sm:text-base leading-relaxed resize-none overflow-hidden" 
                         onInput={(e) => {
                           const target = e.target as HTMLTextAreaElement;
                           target.style.height = 'auto';
                           target.style.height = target.scrollHeight + 'px';
                         }}
                       />
                       {errors.description && <span className="text-rose-500 text-[10px] uppercase tracking-widest font-bold mt-1">{errors.description.message}</span>}
                    </div>
                 </div>
               </motion.div>
             )}

             {currentStep === 2 && (
               <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                 <div className="flex flex-col gap-8">
                    <h2 className="font-serif text-2xl sm:text-3xl tracking-tight">2. Reference Material</h2>
                    
                    <div className="relative w-full group">
                      <label className="w-full border border-dashed border-ink/20 min-h-[300px] flex flex-col items-center justify-center text-sm opacity-80 hover:opacity-100 hover:border-ink transition-all cursor-pointer bg-canvas/30 overflow-hidden relative shadow-inner group">
                         <input type="file" onChange={(e) => uploadToCloudinary(e, 'referenceImage')} accept="image/*" className="hidden" />
                         
                         {uploadingImage ? (
                            <div className="flex flex-col items-center gap-4">
                               <ArtLoader variant="inline" size="sm" />
                               <span className="text-[10px] uppercase tracking-widest font-bold">Uploading securely...</span>
                            </div>
                         ) : referenceImage ? (
                            <div className="relative w-full h-full min-h-[300px] group">
                               <img src={referenceImage} alt="Reference" className="absolute inset-0 w-full h-full object-contain opacity-90 transition-opacity group-hover:opacity-60" />
                               
                               <div className="absolute top-6 left-6 flex items-center gap-2 bg-canvas/95 backdrop-blur-md px-4 py-2 border border-emerald-600/20 shadow-xl rounded-sm">
                                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span className="text-[10px] uppercase tracking-widest text-emerald-700 font-extrabold">Verified</span>
                               </div>

                               <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-ink/40 backdrop-blur-[2px]">
                                  <span className="bg-canvas text-ink px-8 py-3 text-[11px] font-bold uppercase tracking-widest shadow-2xl border border-ink/10">Replace Artwork</span>
                               </div>
                            </div>
                         ) : (
                           <div className="flex flex-col items-center gap-6 py-12 px-6">
                             <div className="w-16 h-16 rounded-full bg-ink/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                <svg className="w-8 h-8 text-ink/40 group-hover:text-ink/60 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                             </div>
                             
                             <div className="text-center space-y-2">
                               <p className="font-serif text-xl sm:text-2xl tracking-tight">Upload your reference material</p>
                               <p className="text-[10px] uppercase tracking-[0.3em] opacity-40 font-bold">Higher resolution provides better fidelity</p>
                             </div>

                             <span className="bg-ink text-canvas px-10 py-4 text-[11px] font-bold uppercase tracking-widest hover:translate-y-[-2px] active:translate-y-0 transition-all shadow-xl shadow-ink/20">
                               Select File
                             </span>
                           </div>
                         )}
                      </label>
                    </div>

                    <div className="p-8 sm:p-10 bg-ink text-canvas flex flex-col gap-3 mt-4 shadow-2xl relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-8 opacity-10 font-serif text-[120px] leading-none select-none pointer-events-none group-hover:translate-x-4 transition-transform duration-1000">₹</div>
                       <p className="text-[10px] uppercase tracking-[0.3em] opacity-40 font-bold">Investment Estimate</p>
                       <div className="flex items-baseline gap-2 font-serif text-canvas leading-none">
                         <span className="text-2xl sm:text-3xl opacity-40 font-sans">₹</span>
                         <span className="text-5xl sm:text-7xl font-bold tracking-tighter">
                           {price.toLocaleString()}
                         </span>
                         <span className="text-sm sm:text-base opacity-20 font-sans ml-1">.00</span>
                       </div>
                       <span className="text-[10px] sm:text-xs opacity-50 mt-4 font-sans leading-relaxed max-w-sm uppercase tracking-widest font-medium">Estimated for '{artworkType}' base complexity + commission fee.</span>
                    </div>
                 </div>
               </motion.div>
             )}

             {currentStep === 3 && (
               <motion.div key="step3" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
                 <div className="flex flex-col gap-10 text-center py-4">
                    <h2 className="font-serif text-3xl sm:text-4xl tracking-tight text-ink">Checkout Securely</h2>
                    
                    <div className="p-8 sm:p-14 bg-white border border-ink/5 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] flex flex-col gap-10 items-center relative overflow-hidden group rounded-xl">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500/20 via-emerald-500 to-emerald-500/20" />
                        
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping opacity-20 scale-150" />
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-500/5 flex items-center justify-center relative shadow-inner">
                                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-600 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                        </div>

                        <div className="space-y-10 w-full">
                            <div className="space-y-3 pointer-events-none">
                                <p className="text-[10px] sm:text-xs uppercase tracking-[0.4em] opacity-40 font-extrabold text-emerald-800">Verified Secure Merchant</p>
                                <p className="text-sm sm:text-base font-serif italic text-ink/70">Proceed to finalizing your exclusive commission</p>
                            </div>

                            {/* Coupon Section */}
                            <div className="w-full max-w-sm mx-auto p-4 sm:p-6 bg-gray-50/50 border border-ink/5 rounded-2xl">
                                {!appliedCoupon ? (
                                    <div className="flex gap-3">
                                        <div className="relative flex-1">
                                            <input 
                                                type="text" 
                                                placeholder="OFFER CODE" 
                                                value={couponInput}
                                                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                                className="w-full bg-transparent border-b border-ink/10 py-2.5 outline-none focus:border-ink transition-all font-mono text-xs sm:text-sm tracking-[0.2em] placeholder:font-sans placeholder:tracking-normal font-bold"
                                            />
                                            {isValidatingCoupon && (
                                                <div className="absolute right-0 bottom-2.5">
                                                    <ArtLoader variant="inline" size="sm" />
                                                </div>
                                            )}
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={handleApplyCoupon}
                                            disabled={!couponInput || isValidatingCoupon}
                                            className="px-6 py-2.5 bg-ink text-canvas text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-30 rounded-lg shadow-lg"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between bg-emerald-50 px-5 py-4 border border-emerald-100 rounded-xl">
                                        <div className="flex items-center gap-4 text-left">
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <div>
                                                <span className="text-[xs] sm:text-sm font-mono tracking-widest text-emerald-800 font-extrabold">{appliedCoupon.code}</span>
                                                <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold">Saved ₹{appliedCoupon.discountAmount}</p>
                                            </div>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={removeCoupon}
                                            className="text-[10px] uppercase tracking-widest text-rose-500 hover:text-rose-700 font-bold transition-colors underline underline-offset-4"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="py-10 border-y border-ink/5 flex flex-col items-center gap-2 relative">
                                {appliedCoupon && (
                                    <span className="text-xs sm:text-sm opacity-30 line-through font-mono tracking-wider font-bold">₹{originalPrice.toLocaleString()}.00</span>
                                )}
                                <div className="flex items-baseline justify-center gap-2 font-serif text-ink leading-none">
                                  <span className="text-3xl sm:text-4xl opacity-40 font-sans">₹</span>
                                  <p className="text-7xl sm:text-8xl font-bold tracking-tighter">
                                    {price.toLocaleString()}
                                  </p>
                                  <span className="text-lg sm:text-xl opacity-20 font-sans ml-1">.00</span>
                                </div>
                                <p className="text-[10px] sm:text-xs uppercase tracking-[0.4em] opacity-40 mt-6 font-extrabold">
                                    {appliedCoupon ? `REWARD APPLIED: -₹${appliedCoupon.discountAmount}` : 'Official Acquisition Total'}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 px-8 py-3 bg-ink/[0.02] border border-ink/5 rounded-full pointer-events-none">
                            <div className="flex gap-2 items-center">
                                <div className="w-1 h-1 rounded-full bg-green-500/60" />
                                <span className="text-[9px] uppercase tracking-widest opacity-50">Instant Verification</span>
                            </div>
                            <div className="flex gap-2 items-center">
                                <div className="w-1 h-1 rounded-full bg-green-500/60" />
                                <span className="text-[9px] uppercase tracking-widest opacity-50">SSL Encrypted</span>
                            </div>
                        </div>
                    </div>

                    <p className="text-[10px] opacity-60 max-w-sm mx-auto">
                        By clicking "Pay & Finalize", you'll be redirected to a secure Razorpay checkout to complete your commission.
                    </p>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>

            <div className="flex justify-between items-center mt-16 pt-10 border-t border-ink/10">
               <button 
                 type="button"
                 onClick={prevStep}
                 className={`text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] transition-all cursor-pointer flex items-center gap-2 group ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'opacity-40 hover:opacity-100 hover:translate-x-[-4px]'}`}
               >
                 <svg className="w-3.5 h-3.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                 Previous
               </button>
 
               {currentStep < 3 ? (
                 <button 
                   type="button"
                   onClick={attemptNextStep}
                   className="px-12 py-5 sm:px-16 sm:py-6 bg-ink text-canvas text-[11px] sm:text-xs font-bold uppercase tracking-[0.3em] hover:translate-y-[-4px] active:translate-y-0 transition-all shadow-2xl shadow-ink/20 rounded-sm group flex items-center gap-3"
                 >
                   Continue
                   <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                 </button>
               ) : (
                 <div className="flex flex-col items-end gap-3">
                   <button 
                     type="submit"
                     disabled={isSubmitting || uploadingImage}
                     className={`px-12 py-5 sm:px-16 sm:py-6 text-canvas text-[11px] sm:text-xs font-bold uppercase tracking-[0.3em] transition-all shadow-2xl flex gap-4 items-center justify-center rounded-sm min-w-[240px]
                     ${isSubmitting || uploadingImage ? 'bg-ink/50 cursor-not-allowed' : 'bg-ink hover:translate-y-[-4px] shadow-emerald-500/10 cursor-pointer'}`}
                   >
                      {isSubmitting ? (
                         <div className="flex items-center gap-3">
                             <ArtLoader variant="inline" size="sm" className="text-canvas" />
                             <span>Authorizing...</span>
                         </div>
                      ) : 'Secure Payment'}
                   </button>
                 </div>
               )}
            </div>
        </form>
    </div>
  );
}
