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
import { client } from '@/sanity/client';
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
        body: JSON.stringify(data),
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
            <div id="receipt-container" className="w-full bg-[#fcfcfc] text-ink p-12 md:p-20 border border-ink/10 shadow-2xl relative overflow-hidden mb-12 group rounded-sm">
               {/* Elegant Background Noise / Texture */}
               <div className="absolute inset-0 bg-ink opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
               <div className="absolute top-0 left-0 w-full h-2 bg-ink"></div>

               {/* TVC MONOGRAM WATERMARK */}
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
                 <span className="font-serif text-[240px] tracking-tighter text-ink opacity-[0.02] select-none">TVC</span>
               </div>

               {/* HEADER */}
               <div className="text-center mb-12 relative z-10 border-b border-ink/10 pb-12 flex flex-col items-center">
                 <div className="w-16 h-16 border border-ink/20 flex items-center justify-center mb-6 bg-white/50 backdrop-blur-sm shadow-sm">
                   <span className="font-serif text-2xl tracking-[0.1em] text-ink opacity-80">TVC</span>
                 </div>
                 <h1 className="font-serif text-3xl md:text-5xl tracking-[0.2em] mb-4 text-ink uppercase">The Virtual Canvas</h1>
                 <p className="font-sans text-[10px] md:text-xs uppercase tracking-[0.4em] opacity-50">Official Order Receipt</p>
               </div>

               {/* BODY: 2 COLUMN GRID */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 relative z-10 text-left">
                 
                 {/* LEFT: DETAILS */}
                 <div className="flex flex-col gap-8">
                   {/* ORDER SUMMARY */}
                   <div>
                     <p className="text-[9px] uppercase tracking-widest opacity-40 mb-3">Order Information</p>
                     <div className="flex gap-4 items-center mb-2">
                       <span className="font-mono text-sm tracking-tight text-ink bg-[#f5f5f5] px-3 py-1 border border-ink/10">{orderDetails?.id || orderId}</span>
                       <span className="font-sans text-[9px] uppercase tracking-widest text-green-600 bg-green-100 px-3 py-1 rounded-full font-bold">Paid</span>
                     </div>
                     <p className="font-mono text-[10px] opacity-60 mt-3">
                        {new Date(orderDetails?.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                     </p>
                   </div>
                   
                   {/* CUSTOMER DETAILS */}
                   <div>
                     <p className="text-[9px] uppercase tracking-widest opacity-40 mb-3">Billed To</p>
                     <p className="font-serif text-xl md:text-2xl tracking-tight capitalize text-ink mb-1">{receiptData.customerName}</p>
                     <p className="font-sans text-xs opacity-70 tracking-wide text-ink">{receiptData.email}</p>
                   </div>

                   {/* ARTWORK DETAILS */}
                   <div>
                     <p className="text-[9px] uppercase tracking-widest opacity-40 mb-3">Commission Type</p>
                     <p className="font-sans text-xs uppercase tracking-widest text-ink font-medium">{receiptData.artworkType}</p>
                   </div>
                 </div>

                 {/* RIGHT: PAYMENT SECTION & QR */}
                 <div className="flex flex-col justify-between items-start md:items-end border-t md:border-t-0 md:border-l border-ink/10 pt-8 md:pt-0 md:pl-12">
                   
                   <div className="w-full flex flex-col items-start md:items-end mb-12 md:mb-0">
                     <p className="text-[9px] uppercase tracking-widest opacity-40 mb-3">Global Tracking QR</p>
                     <div className="p-2 border border-ink/10 bg-white shadow-sm inline-block">
                        <QRCodeSVG 
                          value={`${typeof window !== 'undefined' ? window.location.origin : ''}/track-order?id=${orderDetails?.id || orderId}`} 
                          size={70} 
                          bgColor="#ffffff" 
                          fgColor="#000000" 
                        />
                     </div>
                     <p className="text-[8px] uppercase tracking-[0.2em] opacity-40 mt-3 text-center md:text-right">Scan to Track Order</p>
                   </div>

                   <div className="w-full text-left md:text-right mt-auto">
                     <p className="text-[9px] uppercase tracking-widest opacity-40 mb-3">Total Investment</p>
                     <p className="font-sans font-semibold text-5xl md:text-6xl text-ink leading-none">₹{receiptData.price}.00</p>
                     <p className="text-[10px] uppercase tracking-widest opacity-40 mt-3">Paid via Razorpay Secure Network</p>
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

            <div className="w-full max-w-2xl px-6 flex flex-col md:flex-row gap-4 items-center justify-center mt-6">
              <button 
                onClick={() => window.location.href = `/track-order?id=${orderDetails?.id}`}
                className="w-full md:w-auto px-8 py-4 bg-transparent border border-ink/20 text-ink text-[10px] md:text-xs uppercase tracking-widest hover:bg-ink/5 transition-colors duration-300"
              >
                Track Status
              </button>
              <button 
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="w-full md:w-auto px-8 py-4 bg-ink text-canvas text-[10px] md:text-xs uppercase tracking-widest hover:opacity-90 transition-opacity duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isDownloading ? (
                  <>
                    <ArtLoader variant="inline" size="sm" className="mr-2 text-canvas" />
                    Drafting PDF...
                  </>
                ) : (
                  'Download PDF'
                )}
              </button>
            </div>
          </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-3xl bg-ink/5 p-8 md:p-16 border border-ink/10 relative overflow-hidden shadow-lg">
           <div className="flex justify-between mb-12 relative w-full px-2">
             <div className="absolute top-1/2 left-0 w-full h-[1px] bg-ink/10 -z-10" />
             {[1, 2, 3].map((step) => (
               <div key={step} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-serif transition-colors duration-500 bg-canvas border ${currentStep >= step ? 'border-ink text-ink shadow-sm' : 'border-ink/20 text-ink/40'}`}>
                 {step}
               </div>
             ))}
           </div>

           <AnimatePresence mode="wait">
             {currentStep === 1 && (
               <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                 <div className="flex flex-col gap-6">
                    <h2 className="font-serif text-2xl tracking-tight">1. Your Vision</h2>
                    
                    <div className="flex flex-col gap-1">
                      <input {...register('customerName')} type="text" placeholder="Full Name" className="w-full bg-transparent border-b border-ink/20 py-3 outline-none focus:border-ink transition-colors font-sans text-sm placeholder:capitalize" />
                      {errors.customerName && <span className="text-red-500 text-[10px] uppercase tracking-widest">{errors.customerName.message}</span>}
                    </div>

                    <div className="flex flex-col gap-1">
                      <input {...register('email')} type="email" placeholder="Email Address" className="w-full bg-transparent border-b border-ink/20 py-3 outline-none focus:border-ink transition-colors font-sans text-sm" />
                      {errors.email && <span className="text-red-500 text-[10px] uppercase tracking-widest">{errors.email.message}</span>}
                    </div>

                    <div className="flex flex-col gap-1">
                      <input {...register('phone')} type="tel" placeholder="Phone Number" className="w-full bg-transparent border-b border-ink/20 py-3 outline-none focus:border-ink transition-colors font-sans text-sm" />
                      {errors.phone && <span className="text-red-500 text-[10px] uppercase tracking-widest">{errors.phone.message}</span>}
                    </div>

                    <div className="flex flex-col gap-1">
                      <select {...register('artworkType')} className="w-full bg-transparent border-b border-ink/20 py-3 outline-none focus:border-ink transition-colors font-sans text-sm opacity-70 cursor-pointer">
                        <option value="">{isLoadingStyles ? 'Loading Artwork Types...' : 'Select Artwork Type'}</option>
                        {artStyles.map((style) => (
                          <option key={style._id} value={style.title}>
                            {style.title} (Starting ₹{style.basePrice})
                          </option>
                        ))}
                      </select>
                      {errors.artworkType && <span className="text-red-500 text-[10px] uppercase tracking-widest">{errors.artworkType.message}</span>}
                    </div>

                    <div className="flex flex-col gap-1">
                      <textarea 
                        {...register('description')} 
                        placeholder="Please describe your vision in deep detail... (Optional)" 
                        rows={1} 
                        className="w-full bg-transparent border-b border-ink/20 py-4 outline-none focus:border-ink transition-all font-sans text-sm leading-relaxed resize-none overflow-hidden" 
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = target.scrollHeight + 'px';
                        }}
                      />
                      {errors.description && <span className="text-red-500 text-[10px] uppercase tracking-widest">{errors.description.message}</span>}
                    </div>
                 </div>
               </motion.div>
             )}

             {currentStep === 2 && (
               <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                 <div className="flex flex-col gap-6">
                    <h2 className="font-serif text-2xl tracking-tight">2. Reference Material & Pricing</h2>
                    
                    <div className="relative w-full group">
                      <label className="w-full border border-dashed border-ink/20 h-64 flex flex-col items-center justify-center text-sm opacity-80 hover:opacity-100 hover:border-ink transition-all cursor-pointer bg-canvas/50 overflow-hidden relative shadow-inner group">
                         <input type="file" onChange={(e) => uploadToCloudinary(e, 'referenceImage')} accept="image/*" className="hidden" />
                         
                         {uploadingImage ? (
                            <div className="flex flex-col items-center gap-2">
                               <ArtLoader variant="inline" size="sm" />
                               <span className="text-[10px] uppercase tracking-widest font-medium">Uploading securely...</span>
                            </div>
                         ) : referenceImage ? (
                            <div className="relative w-full h-full group">
                               <img src={referenceImage} alt="Reference" className="w-full h-full object-contain opacity-90 transition-opacity group-hover:opacity-60" />
                               
                               <div className="absolute top-4 left-4 flex items-center gap-2 bg-canvas/90 backdrop-blur-sm px-3 py-1.5 border border-green-600/20 shadow-sm rounded-sm">
                                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span className="text-[9px] uppercase tracking-widest text-green-700 font-bold">Verified</span>
                               </div>

                               <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-ink/30">
                                  <span className="bg-canvas text-ink px-6 py-2 text-[10px] uppercase tracking-widest shadow-xl font-medium border border-ink/10">Change Reference</span>
                               </div>
                            </div>
                         ) : (
                           <div className="flex flex-col items-center gap-4 py-8">
                             <svg className="w-12 h-12 text-ink/20 group-hover:text-ink/40 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                             </svg>
                             
                             <div className="text-center px-4">
                               <p className="font-serif text-lg md:text-xl tracking-tight mb-2">Drag & Drop your reference here</p>
                               <p className="text-[10px] uppercase tracking-widest opacity-40">Max 5MB (JPG, PNG)</p>
                             </div>

                             <span className="bg-ink text-canvas px-8 py-3 text-[10px] uppercase tracking-widest hover:opacity-90 transition-opacity mt-2">
                               Upload Reference
                             </span>
                           </div>
                         )}
                      </label>
                      
                      <AnimatePresence>
                        {showUploadSuccess && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[9px] uppercase tracking-widest px-3 py-1 rounded-full shadow-lg z-20 pointer-events-none"
                          >
                            Image Uploaded Successfully ✓
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="p-8 bg-ink text-canvas flex flex-col gap-2 mt-4 shadow-xl">
                       <span className="text-[9px] uppercase tracking-[0.2em] opacity-70 text-green-300">Quoted Price</span>
                       <span className="font-sans font-medium text-5xl md:text-6xl tracking-tight">₹{price}.00</span>
                       <span className="text-[10px] opacity-50 mt-2 font-sans leading-relaxed">System estimated based on '{artworkType}' base complexity.</span>
                    </div>
                 </div>
               </motion.div>
             )}

             {currentStep === 3 && (
               <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                 <div className="flex flex-col gap-8 text-center py-6">
                    <h2 className="font-serif text-3xl tracking-tight text-ink">3. Secure Payment</h2>
                    
                    <div className="p-10 md:p-14 bg-white border border-ink/5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] flex flex-col gap-8 items-center relative overflow-hidden group">
                        {/* Elegant Background Accent */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500/20 to-transparent" />
                        
                        {/* Premium Shield Icon with Pulse */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping opacity-20 scale-150" />
                            <div className="w-20 h-20 rounded-full bg-green-500/5 flex items-center justify-center relative shadow-inner">
                                <svg className="w-10 h-10 text-green-600 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                        </div>

                        <div className="space-y-8 w-full">
                            <div className="space-y-2 pointer-events-none">
                                <p className="text-[10px] uppercase tracking-[0.3em] opacity-40 font-medium">Transaction Secure via Razorpay</p>
                                <p className="text-sm font-serif italic text-ink/60">Finalizing Commission Details</p>
                            </div>

                            <div className="py-8 border-y border-ink/5 flex flex-col items-center gap-2">
                                <p className="text-[11px] uppercase tracking-[0.2em] opacity-50">You are about to pay</p>
                                <p className="font-sans font-bold text-6xl md:text-7xl tracking-tighter text-ink leading-none">₹{price}.00</p>
                                <p className="text-[10px] opacity-40 lowercase tracking-[0.2em] mt-2 italic">Official Art Acquisition Fee</p>
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

           <div className="flex justify-between mt-12 pt-8 border-t border-ink/10">
              <button 
                type="button"
                onClick={prevStep}
                className={`text-[10px] uppercase tracking-widest transition-opacity cursor-pointer ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'opacity-60 hover:opacity-100'}`}
              >
                Back
              </button>

              {currentStep < 3 ? (
                <button 
                  type="button"
                  onClick={attemptNextStep}
                  className="px-10 py-4 bg-ink text-canvas text-[10px] uppercase tracking-widest hover:bg-ink/80 transition-colors shadow-lg cursor-pointer"
                >
                  Continue
                </button>
              ) : (
                <div className="flex flex-col items-end gap-3">
                  <button 
                    type="submit"
                    disabled={isSubmitting || uploadingImage}
                    className={`px-10 py-4 text-canvas text-[10px] uppercase tracking-widest transition-colors shadow-lg flex gap-2 items-center justify-center min-w-[200px]
                    ${isSubmitting || uploadingImage ? 'bg-ink/50 cursor-not-allowed' : 'bg-ink hover:bg-ink/90 cursor-pointer'}`}
                  >
                     {isSubmitting ? (
                        <div className="flex items-center gap-2">
                            <ArtLoader variant="inline" size="sm" className="text-canvas" />
                            <span>Processing...</span>
                        </div>
                     ) : 'Pay & Finalize Order'}
                  </button>
                </div>
              )}
           </div>
        </form>
    </div>
  );
}
