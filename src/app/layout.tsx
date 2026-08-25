import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { ReactNode } from 'react';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair-display' });

export const metadata: Metadata = {
  title: {
    template: '%s | The Virtual Canvas',
    default: 'The Virtual Canvas | Fine Art Portfolio',
  },
  description: 'Premium digital art portfolio and custom artwork ordering platform by a professional artist.',
  openGraph: {
    title: 'The Virtual Canvas',
    description: 'Explore the gallery and commission custom artwork.',
    url: 'https://thevirtualcanvas.com',
    siteName: 'The Virtual Canvas',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Virtual Canvas',
    description: 'Digital Art Exhibition & Ordering Platform',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
};

import { NextAuthProvider } from '@/components/layout/NextAuthProvider';
import { CartProvider } from '@/context/CartContext';
import SessionTimeout from '@/components/auth/SessionTimeout';
import Script from 'next/script';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-TR9X9N5PMY"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-TR9X9N5PMY');
          `}
        </Script>
      </head>
      <body className="antialiased w-full min-h-screen flex flex-col bg-canvas text-ink selection:bg-ink selection:text-canvas text-sm md:text-base font-sans overflow-x-hidden">
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
          <NextAuthProvider>
            <CartProvider>
              <SessionTimeout />
              {children}
            </CartProvider>
          </NextAuthProvider>
      </body>
    </html>
  );
}
