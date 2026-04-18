import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full bg-canvas border-t border-ink/5 pt-20 pb-12 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 mb-16">
          <div className="col-span-2">
            <h2 className="font-serif text-2xl tracking-tight mb-4 text-ink">The Virtual Canvas</h2>
            <p className="text-xs uppercase tracking-[0.3em] font-extrabold text-ink/30 mb-6">Bridging Vision & Fine Art</p>
            <p className="text-sm text-ink/50 max-w-sm leading-relaxed mb-8">
              A premium studio dedicated to specialized master artistry, where digital vision meets classical techniques.
            </p>
            <div className="flex gap-6">
              <a href="https://www.instagram.com/art_by_ankiit?igsh=cTl4amJiajhnYnJj" target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full border border-ink/10 flex items-center justify-center group-hover:bg-ink group-hover:text-white transition-all duration-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </div>
                <span className="text-[10px] uppercase tracking-widest font-extrabold opacity-40 group-hover:opacity-100 transition-opacity">Instagram</span>
              </a>
              <a href="https://youtube.com/@artbyankiit?si=ln2thWN4Z5aSF2oY" target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full border border-ink/10 flex items-center justify-center group-hover:bg-ink group-hover:text-white transition-all duration-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>
                </div>
                <span className="text-[10px] uppercase tracking-widest font-extrabold opacity-40 group-hover:opacity-100 transition-opacity">YouTube</span>
              </a>
              <a href="https://whatsapp.com/channel/0029VbBOESkEAKWIxItclO10" target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full border border-ink/10 flex items-center justify-center group-hover:bg-ink group-hover:text-white transition-all duration-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                </div>
                <span className="text-[10px] uppercase tracking-widest font-extrabold opacity-40 group-hover:opacity-100 transition-opacity">WhatsApp</span>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] uppercase tracking-[0.3em] font-extrabold text-ink mb-8">Studio Insights</h3>
            <ul className="space-y-4">
              <li><Link href="/gallery" className="text-xs text-ink/40 hover:text-ink hover:translate-x-1 transition-all inline-block font-bold uppercase tracking-widest">Our Gallery</Link></li>
              <li><Link href="/process" className="text-xs text-ink/40 hover:text-ink hover:translate-x-1 transition-all inline-block font-bold uppercase tracking-widest">Mastery Process</Link></li>
              <li><Link href="/about" className="text-xs text-ink/40 hover:text-ink hover:translate-x-1 transition-all inline-block font-bold uppercase tracking-widest">Founding Vision</Link></li>
              <li><Link href="/contact" className="text-xs text-ink/40 hover:text-ink hover:translate-x-1 transition-all inline-block font-bold uppercase tracking-widest">Contact Studio</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[10px] uppercase tracking-[0.3em] font-extrabold text-ink mb-8">Governance</h3>
            <ul className="space-y-4">
              <li><Link href="/privacy-policy" className="text-xs text-ink/40 hover:text-ink hover:translate-x-1 transition-all inline-block font-bold uppercase tracking-widest">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-xs text-ink/40 hover:text-ink hover:translate-x-1 transition-all inline-block font-bold uppercase tracking-widest">Terms of Service</Link></li>
              <li><Link href="/refund-policy" className="text-xs text-ink/40 hover:text-ink hover:translate-x-1 transition-all inline-block font-bold uppercase tracking-widest">Refund Protocol</Link></li>
              <li><Link href="/shipping-policy" className="text-xs text-ink/40 hover:text-ink hover:translate-x-1 transition-all inline-block font-bold uppercase tracking-widest">Global Logistics</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-ink/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] uppercase tracking-widest font-extrabold text-ink/20">
          <p>&copy; {new Date().getFullYear()} The Virtual Canvas. Built for Integrity.</p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p>Certified Mastery Protocol Active</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
