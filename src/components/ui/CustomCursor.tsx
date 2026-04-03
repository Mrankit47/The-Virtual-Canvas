'use client';

import { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';
import { useUIStore } from '@/store/useUIStore';

export function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cursorType = useUIStore((state) => state.cursorType);

  // Smooth springs for cursor trailing effect
  const cursorX = useSpring(mousePosition.x, { stiffness: 500, damping: 28, mass: 0.5 });
  const cursorY = useSpring(mousePosition.y, { stiffness: 500, damping: 28, mass: 0.5 });

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, [cursorX, cursorY]);

  const variants = {
    default: {
      height: 16,
      width: 16,
      backgroundColor: 'transparent',
      border: '1.5px solid #fff',
      mixBlendMode: 'difference' as any,
      x: '-50%',
      y: '-50%',
    },
    hover: {
      height: 64,
      width: 64,
      backgroundColor: '#fff',
      border: 'none',
      mixBlendMode: 'difference' as any,
      x: '-50%',
      y: '-50%',
    },
    pencil: {
      height: 12,
      width: 12,
      backgroundColor: '#fff',
      mixBlendMode: 'difference' as any,
      x: '-50%',
      y: '-50%',
    }
  };

  return (
    <motion.div
      className="fixed top-0 left-0 rounded-full pointer-events-none z-[9999] hidden md:block"
      style={{ left: cursorX, top: cursorY }}
      variants={variants}
      animate={cursorType}
      transition={{ type: 'tween', ease: 'backOut', duration: 0.3 }}
    />
  );
}
