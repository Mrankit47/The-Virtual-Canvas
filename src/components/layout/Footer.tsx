import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full mt-auto py-12 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-4 text-xs uppercase tracking-widest text-gray-500 bg-canvas border-t border-ink/10">
      <div className="text-center md:text-left order-3 md:order-1">
        <p>&copy; {new Date().getFullYear()} The Virtual Canvas. All rights reserved.</p>
      </div>

      <div className="flex flex-wrap justify-center gap-6 md:gap-8 order-1 md:order-2">
        <a 
          href="https://www.instagram.com/art_by_ankiit?igsh=cTl4amJiajhnYnJj" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-black transition-all flex items-center gap-1.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
          </svg>
          Instagram
        </a>
        <a 
          href="https://youtube.com/@artbyankiit?si=ln2thWN4Z5aSF2oY" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-black transition-all flex items-center gap-1.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
            <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/>
            <path d="m10 15 5-3-5-3z"/>
          </svg>
          YouTube
        </a>
        <a 
          href="https://whatsapp.com/channel/0029VbBOESkEAKWIxItclO10" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-black transition-all flex items-center gap-1.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
          </svg>
          WhatsApp
        </a>
      </div>

      <div className="flex flex-wrap justify-center gap-6 md:gap-8 order-2 md:order-3">
        <Link 
          href="/privacy-policy" 
          className="hover:text-black transition-all"
        >
          Privacy
        </Link>
        <Link 
          href="/terms" 
          className="hover:text-black transition-all"
        >
          Terms
        </Link>
        <Link 
          href="/refund-policy" 
          className="hover:text-black transition-all"
        >
          Refund
        </Link>
        <Link 
          href="/shipping-policy" 
          className="hover:text-black transition-all"
        >
          Shipping
        </Link>
      </div>
    </footer>
  );
}
