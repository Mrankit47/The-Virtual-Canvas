'use client';

import React, { Component, ReactNode } from 'react';
import { ImageIcon } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Error Boundary that catches InvalidCharacterError from React's createElement.
 * This prevents a single broken image from crashing the entire page.
 */
export class ImageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Catch the specific createElement error caused by invalid tag names
    if (
      error.name === 'InvalidCharacterError' ||
      error.message?.includes('createElement') ||
      error.message?.includes('tag name')
    ) {
      return { hasError: true };
    }
    // Re-throw unrelated errors
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ImageErrorBoundary] Caught invalid element render:', error.message);
    console.error('[ImageErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="w-full h-full bg-ink/5 flex items-center justify-center rounded-lg min-h-[80px]">
          <ImageIcon className="text-ink/10" size={24} />
        </div>
      );
    }

    return this.props.children;
  }
}
