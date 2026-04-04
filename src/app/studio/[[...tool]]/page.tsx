'use client';

import { NextStudio } from 'next-sanity/studio';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import config from '../../../../sanity.config';
import ArtLoader from '@/components/ui/ArtLoader';

export default function StudioPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // If not admin, redirect to home or dashboard
    if (status === 'unauthenticated' || (status === 'authenticated' && (session?.user as any)?.role !== 'admin')) {
        router.push('/');
    }
  }, [status, session, router]);

  // Loading or non-admin check
  if (status === 'loading') {
    return (
        <div className="h-screen w-full flex items-center justify-center bg-white">
            <ArtLoader size="lg" />
        </div>
    );
  }

  // Final check to prevent flicker of Studio before redirect
  if ((session?.user as any)?.role !== 'admin') {
    return null;
  }

  return <NextStudio config={config} />;
}
