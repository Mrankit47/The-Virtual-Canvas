'use client';

import { PageTransition } from '@/components/layout/PageTransition';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { Loader2, ArrowUpRight, Send } from 'lucide-react';
import { useState } from 'react';
import { useUIStore } from '@/store/useUIStore';
import JsonLd from '@/components/seo/JsonLd';

const contactSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ContactPage",
      "@id": "https://thevirtualcanvas.com/contact#webpage",
      "url": "https://thevirtualcanvas.com/contact",
      "name": "Contact Studio | The Virtual Canvas",
      "description": "Start a dialogue for custom artwork commissions, collaborations, or business inquiries with The Virtual Canvas studio.",
      "isPartOf": {
        "@id": "https://thevirtualcanvas.com/#website"
      },
      "breadcrumb": {
        "@id": "https://thevirtualcanvas.com/contact/#breadcrumb"
      }
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://thevirtualcanvas.com/contact/#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://thevirtualcanvas.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Contact",
          "item": "https://thevirtualcanvas.com/contact"
        }
      ]
    }
  ]
};

interface ContactFormValues {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function ContactPage() {
  const { addToast } = useUIStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactFormValues>();

  const onSubmit = async (data: ContactFormValues) => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Transmission failure');
      }

      addToast('Message safely transmitted to our studio. We will reach out shortly.', 'success');
      reset();
    } catch (err: any) {
      addToast(err.message || 'Failed to transmit message. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <JsonLd schema={contactSchema} />
      <main className="min-h-screen w-full relative pt-24 md:pt-36 bg-canvas selection:bg-ink selection:text-canvas">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20 grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-32 items-start pb-32 md:pb-48">
          
          {/* ── Left Column: Narrative ────────────────────────────────────── */}
          <div className="sticky top-36">
            <header className="mb-12 md:mb-16">
              <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tighter leading-none text-ink mb-12">
                Start a <br /> Dialogue
              </h1>
              <p className="font-sans text-xs md:text-sm uppercase tracking-[0.4em] opacity-40 font-bold max-w-sm leading-relaxed">
                FOR COMMISSIONS, COLLABORATIONS, OR GENERAL INQUIRIES.
              </p>
            </header>

            <div className="relative w-full aspect-square md:aspect-[16/10] overflow-hidden rounded-sm mb-12">
              <Image 
                src="/images/contact-studio.png" 
                alt="Studio Atmosphere" 
                fill 
                className="object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-ink/5" />
            </div>

            <div className="space-y-8">
               <div>
                  <h3 className="font-sans text-[10px] uppercase font-extrabold tracking-[0.3em] opacity-30 mb-4">Official Channels</h3>
                  <div className="flex flex-wrap gap-4">
                     <a href="https://www.instagram.com/art_by_ankiit" target="_blank" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:text-ink/60 transition-colors">
                        Instagram <ArrowUpRight size={14} />
                     </a>
                     <a href="https://whatsapp.com/channel/0029VbBOESkEAKWIxItclO10" target="_blank" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:text-ink/60 transition-colors">
                        WhatsApp <ArrowUpRight size={14} />
                     </a>
                     <a href="https://youtube.com/@artbyankiit" target="_blank" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:text-ink/60 transition-colors">
                        YouTube <ArrowUpRight size={14} />
                     </a>
                  </div>
               </div>
               
               <div className="pt-8 border-t border-ink/5">
                  <p className="font-serif text-lg italic opacity-40 leading-relaxed max-w-xs">
                    "Every masterpiece begins with a simple conversation."
                  </p>
               </div>
            </div>
          </div>

          {/* ── Right Column: Form ────────────────────────────────────────── */}
          <div className="w-full bg-white/40 backdrop-blur-md p-8 md:p-12 lg:p-16 border border-ink/5 rounded-sm shadow-2xl relative">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] font-serif text-[120px] leading-none select-none pointer-events-none">@</div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 relative z-10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="relative group">
                     <span className="absolute -top-2 left-0 text-[10px] font-extrabold uppercase tracking-widest opacity-30">Full Name</span>
                     <input 
                       {...register('name', { required: 'Name is required' })}
                       type="text" 
                       placeholder="e.g. Elena Vane"
                       className="w-full bg-transparent border-b border-ink/10 py-4 outline-none focus:border-ink transition-all font-sans text-sm md:text-base placeholder:opacity-20"
                     />
                     {errors.name && <p className="text-[10px] text-rose-500 mt-2 font-bold uppercase tracking-widest">{errors.name.message}</p>}
                  </div>
                  <div className="relative group">
                     <span className="absolute -top-2 left-0 text-[10px] font-extrabold uppercase tracking-widest opacity-30">Email Address</span>
                     <input 
                       {...register('email', { 
                          required: 'Email is required',
                          pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' }
                       })}
                       type="email" 
                       placeholder="vane@studio.co"
                       className="w-full bg-transparent border-b border-ink/10 py-4 outline-none focus:border-ink transition-all font-sans text-sm md:text-base placeholder:opacity-20"
                     />
                     {errors.email && <p className="text-[10px] text-rose-500 mt-2 font-bold uppercase tracking-widest">{errors.email.message}</p>}
                  </div>
               </div>

               <div className="relative group">
                  <span className="absolute -top-2 left-0 text-[10px] font-extrabold uppercase tracking-widest opacity-30">Subject of Inquiry</span>
                  <select 
                    {...register('subject')}
                    className="w-full bg-transparent border-b border-ink/10 py-4 outline-none focus:border-ink transition-all font-sans text-sm md:text-base appearance-none cursor-pointer"
                  >
                     <option value="commission">Custom Commission Request</option>
                     <option value="collaboration">Artist Collaboration</option>
                     <option value="business">Business Partnership</option>
                     <option value="support">Order Support</option>
                     <option value="other">Other Inquiry</option>
                  </select>
               </div>

               <div className="relative group">
                  <span className="absolute -top-2 left-0 text-[10px] font-extrabold uppercase tracking-widest opacity-30">Message</span>
                  <textarea 
                    {...register('message', { required: 'Message body is required' })}
                    rows={6}
                    placeholder="Describe your vision or inquiry in detail..."
                    className="w-full bg-transparent border-b border-ink/10 py-4 outline-none focus:border-ink transition-all font-sans text-sm md:text-base resize-none placeholder:opacity-20"
                  />
                  {errors.message && <p className="text-[10px] text-rose-500 mt-2 font-bold uppercase tracking-widest">{errors.message.message}</p>}
               </div>

               <button 
                 type="submit"
                 disabled={isSubmitting}
                 className="group relative flex items-center justify-center gap-4 w-full py-6 bg-ink text-canvas font-sans text-xs uppercase tracking-[0.3em] font-bold overflow-hidden transition-all hover:shadow-2xl active:scale-[0.98] disabled:opacity-50"
               >
                 <span className="relative z-10 transition-colors duration-500 group-hover:text-ink">
                   {isSubmitting ? 'Transmitting...' : 'Send Message'}
                 </span>
                 <Send size={14} className="relative z-10 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                 <div className="absolute inset-0 bg-canvas scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                 {isSubmitting && <Loader2 className="animate-spin" size={16} />}
               </button>
            </form>

            <div className="mt-12 p-6 border border-ink/5 bg-ink/[0.02] flex items-center gap-4">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-40">Direct protocol active. Typical response: 24-48 hours.</p>
            </div>
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
