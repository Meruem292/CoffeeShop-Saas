import { useRef, useEffect, useCallback, useState } from 'react';
import { gsap } from 'gsap';
import './MagicBento.css';

interface MagicBentoProps {
  children?: React.ReactNode;
  textAutoHide?: boolean;
  enableStars?: boolean;
  enableSpotlight?: boolean;
  enableBorderGlow?: boolean;
  enableTilt?: boolean;
  enableMagnetism?: boolean;
  clickEffect?: boolean;
  spotlightRadius?: number;
  particleCount?: number;
  glowColor?: string;
  disableAnimations?: boolean;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export default function MagicBento({
  children,
  textAutoHide = true,
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  enableTilt = false,
  enableMagnetism = false,
  clickEffect = true,
  spotlightRadius = 300,
  particleCount = 12,
  glowColor = '132, 0, 255',
  disableAnimations = false,
  className = '',
  onClick,
  style
}: MagicBentoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const borderGlowRef = useRef<HTMLDivElement>(null);
  const starsRef = useRef<HTMLDivElement>(null);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    if (enableSpotlight && spotlightRef.current) {
      gsap.to(spotlightRef.current, {
        x: x - spotlightRadius / 2,
        y: y - spotlightRadius / 2,
        duration: 0.3,
        ease: 'power2.out'
      });
    }

    if (enableBorderGlow && borderGlowRef.current) {
      const angle = Math.atan2(y - rect.height / 2, x - rect.width / 2) * (180 / Math.PI);
      gsap.to(borderGlowRef.current, {
        opacity: 1,
        '--glow-angle': `${angle}deg`,
        '--glow-x': `${x}px`,
        '--glow-y': `${y}px`,
        duration: 0.3
      });
    }
  }, [enableSpotlight, enableBorderGlow, spotlightRadius]);

  const handleMouseLeave = useCallback(() => {
    if (enableSpotlight && spotlightRef.current) {
      gsap.to(spotlightRef.current, { opacity: 0, duration: 0.5 });
    }
    if (enableBorderGlow && borderGlowRef.current) {
      gsap.to(borderGlowRef.current, { opacity: 0, duration: 0.5 });
    }
  }, [enableSpotlight, enableBorderGlow]);

  const handleMouseEnter = useCallback(() => {
    if (enableSpotlight && spotlightRef.current) {
      gsap.to(spotlightRef.current, { opacity: 1, duration: 0.3 });
    }
  }, [enableSpotlight]);

  useEffect(() => {
    if (enableStars && starsRef.current) {
      const stars = Array.from({ length: particleCount }).map(() => {
        const star = document.createElement('div');
        star.className = 'magic-bento-star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.setProperty('--star-size', `${Math.random() * 2 + 1}px`);
        star.style.setProperty('--star-duration', `${Math.random() * 3 + 2}s`);
        star.style.setProperty('--star-delay', `${Math.random() * 5}s`);
        return star;
      });
      stars.forEach(s => starsRef.current?.appendChild(s));
      return () => stars.forEach(s => s.remove());
    }
  }, [enableStars, particleCount]);

  return (
    <div
      ref={containerRef}
      className={`magic-bento-container ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{ ...style, '--glow-color': glowColor } as React.CSSProperties}
    >
      {enableSpotlight && (
        <div
          ref={spotlightRef}
          className="magic-bento-spotlight"
          style={{ width: spotlightRadius, height: spotlightRadius }}
        />
      )}
      {enableBorderGlow && <div ref={borderGlowRef} className="magic-bento-border-glow" />}
      {enableStars && <div ref={starsRef} className="magic-bento-stars" />}
      <div className="magic-bento-content">
        {children}
      </div>
    </div>
  );
}
