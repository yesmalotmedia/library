'use client';
import { useState, useEffect, useCallback } from 'react';

const BREAKPOINTS = { mobile: 640, tablet: 1024 };

export default function useResponsive() {
  const [width, setWidth] = useState(1200);

  useEffect(() => {
    setWidth(window.innerWidth);
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const isMobile  = width < BREAKPOINTS.mobile;
  const isTablet  = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
  const isDesktop = width >= BREAKPOINTS.tablet;

  // responsive(desktop, tablet, mobile)
  const responsive = useCallback((desk, tab, mob) => {
    if (isMobile)  return mob  ?? tab  ?? desk;
    if (isTablet)  return tab  ?? desk;
    return desk;
  }, [isMobile, isTablet]);

  return { width, isMobile, isTablet, isDesktop, responsive };
}
