'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Runtime Application Error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <h2 className="font-serif text-3xl md:text-4xl tracking-tighter mb-4 text-[#2a1111]">Art Temporarily Unavailable</h2>
      <p className="text-sm opacity-60 mb-8 max-w-md">
        We encountered an error loading this section of the gallery. Our servers might be experiencing a brief hiccup.
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-3 border border-ink text-xs uppercase tracking-widest hover:bg-ink hover:text-canvas transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
