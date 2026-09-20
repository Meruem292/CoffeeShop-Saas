import React from 'react';

interface SnowCapProps {
  className?: string;
  variant?: 'card' | 'banner' | 'compact';
}

export const SnowCap: React.FC<SnowCapProps> = ({ className = '', variant = 'card' }) => {
  if (variant === 'banner') {
    return (
      <div 
        className={`absolute -top-0.5 left-0 right-0 pointer-events-none z-30 select-none overflow-visible ${className}`}
        aria-hidden="true"
      >
        {/* Frosted top rim ice line */}
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-sky-200/80 via-white to-sky-200/80 shadow-[0_0_14px_rgba(255,255,255,1)] rounded-t-3xl" />

        {/* Wide Banner Snow Drift SVG */}
        <svg 
          viewBox="0 0 600 24" 
          preserveAspectRatio="none" 
          className="w-full h-5 sm:h-6 drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]"
        >
          {/* Shaded bottom snow depth */}
          <path 
            d="M0,0 L600,0 L600,6 Q580,10 560,5 Q540,16 515,8 Q490,3 470,8 Q445,20 420,10 Q395,3 375,8 Q350,18 325,9 Q300,3 280,8 Q255,20 230,10 Q205,3 185,8 Q160,18 135,9 Q110,3 90,8 Q65,18 40,9 Q20,3 0,6 Z" 
            fill="#94a3b8" 
            opacity="0.6"
          />
          {/* Main White Snow Mound */}
          <path 
            d="M0,0 L600,0 L600,5 Q580,8 560,4 Q540,14 515,6 Q490,2 470,6 Q445,17 420,8 Q395,2 375,6 Q350,15 325,7 Q300,2 280,6 Q255,17 230,8 Q205,2 185,6 Q160,15 135,7 Q110,2 90,6 Q65,15 40,7 Q20,2 0,5 Z" 
            fill="#FFFFFF" 
          />
          {/* Icicle drips */}
          <path d="M42,5 Q44,18 46,18 Q48,18 50,5 Z" fill="#FFFFFF" />
          <path d="M138,5 Q140,20 143,20 Q146,20 148,5 Z" fill="#FFFFFF" />
          <path d="M232,5 Q234,18 236,18 Q238,18 240,5 Z" fill="#FFFFFF" />
          <path d="M328,5 Q330,22 333,22 Q336,22 338,5 Z" fill="#FFFFFF" />
          <path d="M422,5 Q424,19 426,19 Q428,19 430,5 Z" fill="#FFFFFF" />
          <path d="M518,5 Q520,21 523,21 Q526,21 528,5 Z" fill="#FFFFFF" />
        </svg>

        {/* Sparkle crystals */}
        <div className="absolute top-1 left-[12%] w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_3px_rgba(255,255,255,1)] animate-pulse" />
        <div className="absolute top-0.5 left-[38%] w-1 h-1 bg-cyan-200 rounded-full shadow-[0_0_6px_2px_rgba(186,230,253,1)]" />
        <div className="absolute top-1 left-[64%] w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_3px_rgba(255,255,255,1)] animate-pulse" />
        <div className="absolute top-0.5 left-[88%] w-1 h-1 bg-cyan-200 rounded-full shadow-[0_0_6px_2px_rgba(186,230,253,1)]" />
      </div>
    );
  }

  // Default 'card' & 'compact' variants
  return (
    <div 
      className={`absolute -top-0.5 left-0 right-0 pointer-events-none z-30 select-none overflow-visible ${className}`}
      aria-hidden="true"
    >
      {/* Frosted top rim ice line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sky-200/70 via-white to-sky-200/70 shadow-[0_0_12px_rgba(255,255,255,1)] rounded-t-2xl" />

      {/* Organic Snow Drift Contour SVG */}
      <svg 
        viewBox="0 0 200 22" 
        preserveAspectRatio="none" 
        className={`w-full ${variant === 'compact' ? 'h-3.5' : 'h-4 sm:h-5'} drop-shadow-[0_3px_6px_rgba(0,0,0,0.65)]`}
      >
        {/* Soft ice shadow / depth layer */}
        <path 
          d="M0,0 L200,0 L200,6 Q188,10 176,5 Q162,18 145,9 Q132,3 120,8 Q104,22 86,11 Q72,3 60,8 Q44,20 28,10 Q15,3 0,6 Z" 
          fill="#94a3b8" 
          opacity="0.6"
        />
        
        {/* Pure Snow Mounds */}
        <path 
          d="M0,0 L200,0 L200,5 Q188,8 176,4 Q162,15 145,7 Q132,2 120,6 Q104,18 86,9 Q72,2 60,6 Q44,16 28,8 Q15,2 0,5 Z" 
          fill="#FFFFFF" 
        />

        {/* Small hanging icicle drops */}
        <path d="M30,5 Q32,17 34,17 Q36,17 38,5 Z" fill="#FFFFFF" />
        <path d="M88,6 Q90,20 93,20 Q96,20 98,6 Z" fill="#FFFFFF" />
        <path d="M148,5 Q150,17 152,17 Q154,17 156,5 Z" fill="#FFFFFF" />
      </svg>

      {/* Glistening Snow Sparkle Crystals */}
      <div className="absolute top-0.5 right-4 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_3px_rgba(255,255,255,1)] animate-pulse" />
      <div className="absolute top-1 left-5 w-1 h-1 bg-cyan-200 rounded-full shadow-[0_0_6px_2px_rgba(186,230,253,1)]" />
      <div className="absolute top-0.5 left-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_6px_2px_rgba(255,255,255,0.9)]" />
    </div>
  );
};
