'use client';

import React, { useState, useEffect } from 'react';
import ArtLoader from '@/components/ui/ArtLoader';

const LoaderWrapper = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Dynamic loading: Hide loader when page is ready
    const handleLoad = () => {
      setIsLoading(false);
    };


    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      // Fallback if load event takes too long
      const fallback = setTimeout(handleLoad, 3000);
      return () => {
        window.removeEventListener('load', handleLoad);
        clearTimeout(fallback);
      };
    }
  }, []);

  return (
    <>
      <ArtLoader isVisible={isLoading} variant="fullscreen" size="lg" />
      <div 
        className={`transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
      >
        {children}
      </div>
    </>
  );
};

export default LoaderWrapper;
