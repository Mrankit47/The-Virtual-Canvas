import { ReactNode } from 'react';
import { SmoothScrollProvider } from '@/components/layout/SmoothScrollProvider';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CustomCursor } from '@/components/ui/CustomCursor';
import { ToastProvider } from '@/components/ui/ToastProvider';
import Lightbox from '@/components/gallery/Lightbox';

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="w-full min-h-screen flex flex-col md:cursor-none overflow-x-hidden">
      <SmoothScrollProvider>
        <CustomCursor />
        <Navbar />
        <main className="flex-grow w-full flex flex-col">
          {children}
        </main>
        <Footer />
        <ToastProvider />
        <Lightbox />
      </SmoothScrollProvider>
    </div>
  );
}
