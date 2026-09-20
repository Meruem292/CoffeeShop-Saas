import React, { useEffect, useRef } from 'react';

interface SnowBackgroundProps {
  enabled?: boolean;
  speedMultiplier?: number;
  flakeCount?: number;
  zIndex?: number;
}

interface Flake {
  char: string;
  x: number;
  y: number;
  vx: number; // Current horizontal velocity (driven by global air physics)
  size: number;
  v: number; // Individual fall speed with random variation
  mass: number; // Air resistance / inertia factor (0.7 to 1.3)
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  blur: number;
}

export const SnowBackground: React.FC<SnowBackgroundProps> = ({
  enabled = true,
  speedMultiplier = 1.0,
  flakeCount = 50,
  zIndex = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let ww = (canvas.width = window.innerWidth);
    let wh = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      ww = canvas.width = window.innerWidth;
      wh = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const unicodeFlakes = ['\u2744', '\u2745', '\u2746']; // ❄, ❅, ❆

    const sizes = [
      { r: 1.0, minSize: 12, maxSize: 24, baseV: 0.8, blur: 0, mass: 0.7 },
      { r: 0.6, minSize: 24, maxSize: 42, baseV: 2.2, blur: 1.5, mass: 0.9 },
      { r: 0.2, minSize: 42, maxSize: 65, baseV: 4.2, blur: 3, mass: 1.1 },
      { r: 0.1, minSize: 65, maxSize: 100, baseV: 6.8, blur: 6, mass: 1.3 },
    ];

    // Global air wind dynamics
    let globalWindTarget = 0.5; // Current target wind velocity
    let currentGlobalWind = 0.5; // Smoothly interpolated global air velocity
    let lastWindShift = Date.now();

    const createFlake = (initial = false): Flake => {
      const r = Math.random();
      let selected = sizes[0];
      for (let i = sizes.length - 1; i >= 0; i--) {
        if (r < sizes[i].r) {
          selected = sizes[i];
          break;
        }
      }

      const size = selected.minSize + Math.floor(Math.random() * (selected.maxSize - selected.minSize));
      
      // Introduce unique individual vertical speed variance (60% to 140% of base layer speed)
      const individualSpeedVariance = 0.6 + Math.random() * 0.8;
      const v = selected.baseV * individualSpeedVariance;

      const x = -150 + Math.random() * (ww + 300);
      const y = initial ? Math.random() * wh : -120;
      const char = unicodeFlakes[Math.floor(Math.random() * unicodeFlakes.length)];

      return {
        char,
        x,
        y,
        vx: currentGlobalWind,
        size,
        v,
        mass: selected.mass + (Math.random() - 0.5) * 0.3,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.015,
        opacity: 0.4 + Math.random() * 0.55,
        blur: selected.blur,
      };
    };

    const flakes: Flake[] = [];
    const count = Math.min(Math.max(flakeCount, 10), 160);
    for (let i = 0; i < count; i++) {
      flakes.push(createFlake(true));
    }

    let startTime = Date.now();

    const render = () => {
      ctx.clearRect(0, 0, ww, wh);

      const now = Date.now();
      const timeSec = (now - startTime) / 1000;

      // Atmospheric Wind Shifts: Periodically change global wind direction smoothly
      if (now - lastWindShift > 4000 + Math.random() * 3000) {
        // Pick new wind target between -1.8 (blowing left) and +1.8 (blowing right)
        globalWindTarget = (-1.8 + Math.random() * 3.6);
        lastWindShift = now;
      }

      // Smoothly accelerate global air mass towards wind target
      currentGlobalWind += (globalWindTarget - currentGlobalWind) * 0.008;

      // Add a subtle uniform atmospheric wave sway (applies to ALL flakes equally)
      const globalAirWave = Math.sin(timeSec * 0.6) * 0.7;
      const effectiveAirWind = currentGlobalWind + globalAirWave;

      // Speed multiplier scaling
      const currentSpeed = Math.max(0.01, speedMultiplier);
      const horizontalVelocityScale = Math.max(currentSpeed, 0.2); // Keeps horizontal wind responsive at low speeds

      for (let i = 0; i < flakes.length; i++) {
        const flake = flakes[i];

        // Air drag physics: Flake horizontal velocity smoothly accelerates towards unified effective air wind
        const dragRate = 0.04 / flake.mass;
        flake.vx += (effectiveAirWind - flake.vx) * dragRate;

        // Apply velocities - each flake falls at its unique v
        flake.y += flake.v * currentSpeed;
        flake.x += flake.vx * horizontalVelocityScale;

        // Rotation is driven by wind speed and flake direction
        flake.rotation += (flake.rotationSpeed + flake.vx * 0.003) * horizontalVelocityScale;

        // Screen edge wrapping
        if (flake.x > ww + 200) flake.x = -150;
        else if (flake.x < -200) flake.x = ww + 150;

        // Bottom boundary reset
        if (flake.y > wh + 120) {
          flakes[i] = createFlake(false);
          continue;
        }

        // Render Snowflake Glyph
        ctx.save();
        ctx.translate(flake.x, flake.y);
        ctx.rotate(flake.rotation);
        ctx.font = `${flake.size}px "Segoe UI Symbol", "Apple Color Emoji", sans-serif`;
        ctx.fillStyle = `rgba(240, 246, 255, ${flake.opacity})`;

        if (flake.blur > 0) {
          ctx.shadowColor = 'rgba(255, 255, 255, 0.85)';
          ctx.shadowBlur = flake.blur;
        } else {
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
        }

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(flake.char, 0, 0);
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [enabled, speedMultiplier, flakeCount]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none transition-opacity duration-500"
      style={{ opacity: 0.85, zIndex }}
    />
  );
};
