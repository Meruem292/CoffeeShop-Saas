import React from 'react';

interface PumpkinCapProps {
  className?: string;
  variant?: 'card' | 'banner' | 'compact';
}

export const PumpkinCap: React.FC<PumpkinCapProps> = ({ className = '', variant = 'card' }) => {
  const isBanner = variant === 'banner';
  const size = isBanner ? 34 : variant === 'compact' ? 22 : 28;

  return (
    <div 
      className={`absolute ${isBanner ? 'top-1.5 right-3' : 'top-1 right-2'} pointer-events-none z-20 select-none overflow-visible ${className}`}
      aria-hidden="true"
    >
      <div className="relative flex items-center justify-end">
        {/* Curled vine leaf accent spreading along the rim */}
        <svg 
          width={isBanner ? "64" : "44"} 
          height="16" 
          viewBox="0 0 64 16" 
          fill="none" 
          className="absolute right-4 top-2 pointer-events-none opacity-90 filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
        >
          {/* Curling green vine */}
          <path 
            d="M62,8 Q44,2 26,9 Q12,14 2,7" 
            stroke="#22c55e" 
            strokeWidth="1.8" 
            strokeLinecap="round" 
            fill="none"
          />
          {/* Mini vine leaf 1 */}
          <path 
            d="M36,6 C34,2 28,3 27,6 C28,9 33,9 36,6 Z" 
            fill="#16a34a"
          />
          {/* Mini vine leaf 2 */}
          <path 
            d="M16,10 C14,7 10,8 9,10 C10,12 14,13 16,10 Z" 
            fill="#15803d"
          />
          {/* Little tendril spiral */}
          <path 
            d="M4,7 Q0,9 2,12 Q5,13 4,10" 
            stroke="#22c55e" 
            strokeWidth="1.2" 
            strokeLinecap="round" 
            fill="none"
          />
        </svg>

        {/* Cute Peek-a-boo Pumpkin Character */}
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 36 36" 
          className="relative z-10 transition-transform hover:scale-110 duration-300 filter drop-shadow-[0_3px_6px_rgba(0,0,0,0.5)]"
        >
          {/* Green Stem */}
          <path 
            d="M17,10 Q18,4 23,3 Q22,7 19,10 Z" 
            fill="#15803d" 
            stroke="#14532d" 
            strokeWidth="0.6"
          />

          {/* Left Pumpkin Rib Bulb */}
          <ellipse 
            cx="13" 
            cy="21" 
            rx="7.5" 
            ry="9.5" 
            fill="#ea580c" 
          />
          {/* Right Pumpkin Rib Bulb */}
          <ellipse 
            cx="23" 
            cy="21" 
            rx="7.5" 
            ry="9.5" 
            fill="#ea580c" 
          />
          {/* Center Main Pumpkin Bulb with warm gradient */}
          <ellipse 
            cx="18" 
            cy="21" 
            rx="8" 
            ry="10" 
            fill="#f97316" 
          />

          {/* Top highlight shine */}
          <path 
            d="M13,14 Q18,12 23,14" 
            stroke="#fdba74" 
            strokeWidth="1.2" 
            strokeLinecap="round" 
            fill="none" 
            opacity="0.8"
          />

          {/* Cute Jack-o'-lantern Face */}
          {/* Left Eye: cute smiling arc / triangle */}
          <path 
            d="M13.5,17.5 Q15,16 16,18.5 Z" 
            fill="#451a03" 
            className="filter drop-shadow-[0_0_2px_#fbbf24]"
          />
          {/* Right Eye: cute smiling arc / triangle */}
          <path 
            d="M22.5,17.5 Q21,16 20,18.5 Z" 
            fill="#451a03" 
            className="filter drop-shadow-[0_0_2px_#fbbf24]"
          />
          {/* Cute Nose */}
          <polygon 
            points="18,19 17,21 19,21" 
            fill="#451a03" 
          />
          {/* Cute Smiling Toothy Mouth */}
          <path 
            d="M13,23.5 Q18,28 23,23.5 Q21,25 18,25 Q15,25 13,23.5 Z" 
            fill="#451a03" 
            className="filter drop-shadow-[0_0_3px_#fbbf24]"
          />
          {/* Little tooth */}
          <rect 
            x="17.2" 
            y="23.5" 
            width="1.6" 
            height="1.4" 
            fill="#fbbf24" 
          />
        </svg>
      </div>
    </div>
  );
};
