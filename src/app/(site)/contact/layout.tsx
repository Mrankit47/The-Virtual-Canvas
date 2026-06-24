import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Contact Studio',
  description: 'Start a dialogue for custom artwork commissions, collaborations, or business inquiries with The Virtual Canvas studio.',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
