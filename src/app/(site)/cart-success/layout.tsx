import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Order Confirmed',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CartSuccessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
