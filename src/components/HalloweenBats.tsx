import React, { useEffect, useRef } from 'react';

interface HalloweenBatsProps {
  enabled?: boolean;
  batCount?: number;
  batSize?: number;
  glowColor?: string;
  glowIntensity?: number;
  speedMultiplier?: number;
  roamRadius?: number;
  zIndex?: number;
}

const BODY_PATH = "M4.16,2c0,0,0.38-0.52,0.85-1.17c0.69-0.95,1.41-0.79,1.7-0.46c0.42,0.48,0.2,1.45-0.12,2.56 C6.27,4.04,7.62,5.81,7.24,6.84c-0.38,1.03-1.28,1.27-0.9,2.78C6.7,11.03,7.8,10.56,9,13.01v52.33c-0.03,0.03-0.07,0.07-0.11,0.11 c-3.02,4.22-6.71,6.65-7.29,8.88c-0.64,2.46-0.7,3.57-1.6,3.57L0,0.81C2.88,0.81,4.16,2,4.16,2z";
const WING_PATH = "M0,13.01c1.13,0.77,2.43,1.46,3.68,1.66c3.22,0.53,16.63,0.31,24.21-2.16c7.63-2.48,13.63-7.25,15.71-7.46 c0.17-0.02,0.19-2.08,1.39-2.08c0.01,0,0.01,0,0.02,0v48.92c-0.73,0-6.77-6.62-18.38-3.05c-12.32,3.79-15.67,5.37-15.88,7.06 c-0.21,1.69,1.54,2.45-0.1,3.72c-1.23,0.95-1.77-0.97-3.43-1.08c-1.66-0.11-1.82,1.62-4.99,4.65C1.41,63.98,0.67,64.69,0,65.33 L0,13.01z";
const WING_TIP_PATH = "M0,2.97c1.11,0.03,0.96,2.16,1.4,2.19c6.04,0.4,13.41,2.5,19.81,6.76c7.47,4.97,19.09,14.8,18.78,15.33 c-0.31,0.53-4.88-0.53-7.68,3.07c-2.8,3.59-2.59,6.24-3.22,6.66c-0.62,0.42-7.9-3.7-14.42,1.14C5.15,45.19,0.73,51.88,0,51.88 L0,2.97z";

export const HalloweenBats: React.FC<HalloweenBatsProps> = ({
  enabled = true,
  batCount = 7,
  batSize = 1.0,
  glowColor = '#ffffff',
  glowIntensity = 1.0,
  speedMultiplier = 1.0,
  roamRadius = 1.0,
  zIndex = 1
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const rootEl = containerRef.current;
    if (!rootEl) return;

    const mousePos = {
      isInited: false,
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.5
    };

    const handleMouseMove = (event: MouseEvent) => {
      mousePos.isInited = true;
      mousePos.x = event.clientX;
      mousePos.y = event.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const batWrappers = rootEl.querySelectorAll<HTMLElement>('.batWrapper');
    if (!batWrappers.length) return;

    interface BatInstance {
      wrapper: HTMLElement;
      batEl: HTMLElement;
      wings: NodeListOf<HTMLElement>;
      x: number;
      y: number;
      heading: number;
      speed: number;
      turnRate: number;
      tiltX: number;
      tiltY: number;
      height3D: number;
      scale: number;
      flapCounter: number;
    }

    const bats: BatInstance[] = [];

    batWrappers.forEach((wrapper, index) => {
      const batEl = wrapper.querySelector('.bat') as HTMLElement;
      const wings = wrapper.querySelectorAll('.batWing') as NodeListOf<HTMLElement>;

      // Spread initial positions broadly across the entire screen
      const initX = (0.05 + (0.90 * (index + 0.5)) / batWrappers.length) * window.innerWidth + (Math.random() - 0.5) * 140;
      const initY = (0.10 + 0.80 * Math.random()) * window.innerHeight;
      const heading = Math.random() * Math.PI * 2;
      const speed = (1.5 + Math.random() * 2.2) * (speedMultiplier || 1.0);
      const scale = (0.8 + Math.random() * 0.5) * (batSize || 1.0);
      const height3D = Math.random() * 240 - 120;
      const tiltX = -20 + Math.random() * 40;
      const tiltY = -20 + Math.random() * 40;

      if (batEl) {
        batEl.style.transform = `scale3d(${scale}, ${scale}, ${scale}) rotateY(${tiltY}deg)`;
      }

      const flightDeg = (heading * 180) / Math.PI + 90;
      wrapper.style.transform = `translate3d(${initX}px, ${initY}px, ${height3D}px) rotateZ(${flightDeg}deg) rotateX(${tiltX}deg)`;
      wrapper.style.opacity = '1';

      bats.push({
        wrapper,
        batEl,
        wings,
        x: Math.max(40, Math.min(window.innerWidth - 40, initX)),
        y: Math.max(40, Math.min(window.innerHeight - 40, initY)),
        heading,
        speed,
        turnRate: (Math.random() - 0.5) * 0.08,
        tiltX,
        tiltY,
        height3D,
        scale,
        flapCounter: Math.round(10 + Math.random() * 80)
      });
    });

    const roam = Math.max(0.2, roamRadius || 1.0);
    const speedMult = Math.max(0.2, speedMultiplier || 1.0);

    const intervalId = setInterval(() => {
      const width = window.innerWidth || 1200;
      const height = window.innerHeight || 800;
      const margin = 70;

      bats.forEach((bat) => {
        // Natural wandering steering across the screen
        bat.turnRate += (Math.random() - 0.5) * 0.04;
        bat.turnRate = Math.max(-0.09, Math.min(0.09, bat.turnRate));
        bat.heading += bat.turnRate;

        // Smooth boundary avoidance to stay on screen while exploring everywhere
        if (bat.x < margin) {
          bat.heading += 0.06;
        } else if (bat.x > width - margin) {
          bat.heading += 0.06;
        }
        if (bat.y < margin) {
          bat.heading += 0.06;
        } else if (bat.y > height - margin) {
          bat.heading += 0.06;
        }

        // Mouse influence: gently steer near cursor
        if (mousePos.isInited) {
          const dx = mousePos.x - bat.x;
          const dy = mousePos.y - bat.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 260 * 260 && distSq > 100) {
            const angleToMouse = Math.atan2(dy, dx);
            const diff = angleToMouse - bat.heading;
            bat.heading += Math.sign(Math.sin(diff)) * 0.035;
          }
        }

        // Advance position across full screen space
        const currentSpeed = bat.speed * speedMult * roam;
        bat.x += Math.cos(bat.heading) * currentSpeed;
        bat.y += Math.sin(bat.heading) * currentSpeed;

        // Keep inside bounds
        bat.x = Math.max(20, Math.min(width - 20, bat.x));
        bat.y = Math.max(20, Math.min(height - 20, bat.y));

        // Compute 3D heading tilt
        const flightDeg = (bat.heading * 180) / Math.PI + 90;
        bat.wrapper.style.transform = `translate3d(${bat.x}px, ${bat.y}px, ${bat.height3D}px) rotateZ(${flightDeg}deg) rotateX(${bat.tiltX}deg)`;

        // Wing flapping alternation
        bat.flapCounter--;
        if (bat.flapCounter <= 0) {
          bat.flapCounter = Math.round(15 + Math.random() * 70);
          bat.wings.forEach((wing) => {
            wing.classList.toggle('flying');
            wing.classList.toggle('floating');
          });
        }
      });
    }, 25);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(intervalId);
    };
  }, [enabled, batCount, batSize, speedMultiplier, roamRadius]);

  if (!enabled) return null;

  const validGlowColor = glowColor || '#ffffff';
  const intensity = Math.max(0.1, glowIntensity !== undefined ? glowIntensity : 1.0);
  const flapDuration = Math.max(160, Math.round(280 / (speedMultiplier || 1.0)));

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 pointer-events-none select-none overflow-hidden"
      style={{ zIndex }}
    >
      <div className="batsSpaceContainer w-full h-full relative [perspective:900px] [transform-style:preserve-3d]">
        {Array.from({ length: batCount }).map((_, idx) => (
          <div key={idx} className="batWrapper absolute left-0 top-0 [transform-style:preserve-3d] will-change-transform opacity-0 transition-opacity duration-300">
            <div className="bat [transform-style:preserve-3d]">
              {/* Left Side */}
              <div className="batBody batBody--left batPart">
                <svg viewBox="0 0 9 78" className="bat-svg">
                  <path d={BODY_PATH} />
                </svg>
                <div className="batWing batPart floating">
                  <svg viewBox="0 0 45 78" className="bat-svg">
                    <path d={WING_PATH} />
                  </svg>
                  <div className="batWingTip batPart">
                    <svg viewBox="0 0 40 78" className="bat-svg">
                      <path d={WING_TIP_PATH} />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Right Side */}
              <div className="batBody batPart">
                <svg viewBox="0 0 9 78" className="bat-svg">
                  <path d={BODY_PATH} />
                </svg>
                <div className="batWing batPart floating">
                  <svg viewBox="0 0 45 78" className="bat-svg">
                    <path d={WING_PATH} />
                  </svg>
                  <div className="batWingTip batPart">
                    <svg viewBox="0 0 40 78" className="bat-svg">
                      <path d={WING_TIP_PATH} />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .batPart {
          position: absolute;
          left: 0px;
          top: 0px;
          transform-style: preserve-3d;
          transform-origin: left center;
        }

        .batBody {
          position: absolute;
          top: -16px;
          left: -2px;
        }

        .batBody > svg {
          width: 5px;
          height: 34px;
        }

        .batBody--left {
          transform: scaleX(-1);
          left: 2px;
        }

        .batWing {
          left: 4px;
          transform: rotateY(-35deg);
        }

        .batWing > svg {
          width: 25px;
          height: 34px;
        }

        .batWingTip {
          left: 24px;
          transform: rotateY(25deg);
        }

        .batWingTip svg {
          width: 23px;
          height: 34px;
        }

        .flying {
          animation: batFly ${flapDuration}ms infinite ease-in-out;
        }

        @keyframes batFly {
          0% { transform: rotateY(-52deg); }
          50% { transform: rotateY(42deg); }
          100% { transform: rotateY(-52deg); }
        }

        .floating {
          animation: batFloat 550ms ease-out;
        }

        @keyframes batFloat {
          0% { transform: rotateY(0deg); }
          30% { transform: rotateY(-45deg); }
          100% { transform: rotateY(-35deg); }
        }

        /* DARK MODE: Pitch-black bat with vivid luminous outline and radiant aura */
        .bat-svg path {
          fill: #060911;
          stroke: ${validGlowColor};
          stroke-width: ${1.3 * Math.min(2.2, Math.max(0.7, intensity))}px;
          stroke-opacity: ${Math.min(1.0, 0.9 * intensity)};
          paint-order: fill stroke;
        }

        .bat-svg {
          filter: drop-shadow(0 0 ${2.5 * intensity}px ${validGlowColor}) drop-shadow(0 0 ${8 * intensity}px ${validGlowColor});
        }

        /* LIGHT MODE: Crisp black bat silhouette with soft shadow and clear presence */
        html.light .bat-svg path,
        html:not(.dark) .bat-svg path {
          fill: #0b0f19;
          stroke: ${validGlowColor !== '#ffffff' ? validGlowColor : 'rgba(0,0,0,0.5)'};
          stroke-width: 0.9px;
          stroke-opacity: 0.85;
          paint-order: fill stroke;
        }

        html.light .bat-svg,
        html:not(.dark) .bat-svg {
          filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.45));
        }
      `}</style>
    </div>
  );
};
