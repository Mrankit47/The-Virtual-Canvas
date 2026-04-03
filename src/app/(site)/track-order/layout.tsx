import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Track Your Order | The Virtual Canvas',
  description: 'Track your custom artwork order status in real-time at The Virtual Canvas.',
};

export default function TrackOrderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
