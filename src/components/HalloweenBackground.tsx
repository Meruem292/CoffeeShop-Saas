import React from 'react';

interface HalloweenBackgroundProps {
  enabled?: boolean;
}

export const HalloweenBackground: React.FC<HalloweenBackgroundProps> = ({ enabled = true }) => {
  if (!enabled) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden select-none">
      <style>{`
        @keyframes halloween-fly {
          0% { transform: translateX(-100vw); }
          100% { transform: translateX(100vw); }
        }

        @keyframes halloween-smoke {
          0% { transform: translateX(100vw); }
          100% { transform: translateX(-100vw); }
        }

        .hw-moon {
          position: absolute;
          top: 15px;
          right: 5%;
          width: 75px;
          height: 75px;
          border-radius: 50%;
          background: #f2f2ea;
          box-shadow: 0px -4px 30px 0px #fbeb36, 0px 0px 20px 0px #ffb347;
          filter: blur(1px);
          opacity: 0.45;
          z-index: 1;
        }

        .hw-clouds {
          position: absolute;
          top: 4%;
          left: -15%;
          width: 300px;
          height: 8px;
          background: #f2f2ea;
          box-shadow: 0px -4px 25px 0px #f2f2ea;
          filter: blur(16px);
          opacity: 0.25;
          animation: halloween-fly 30s linear infinite;
        }

        .hw-cloud2 { left: 30%; top: 8%; width: 70px; }
        .hw-cloud3 { left: 60%; top: 12%; width: 90px; }

        .hw-smoke {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 40px;
          box-shadow: 0px -6px 36px 0px rgba(180, 140, 200, 0.2);
          filter: blur(20px);
          opacity: 0.25;
          animation: halloween-smoke 35s linear infinite;
        }

        .hw-tree-silhouette {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 110px;
          background: linear-gradient(to top, rgba(13, 11, 48, 0.4) 0%, transparent 100%);
          opacity: 0.35;
          pointer-events: none;
        }

        .hw-tree {
          position: absolute;
          bottom: -10px;
          width: 220px;
          height: 110px;
          background: rgba(13, 11, 48, 0.6);
          opacity: 0.3;
          clip-path: polygon(
            0% 100%, 5% 70%, 12% 40%, 19% 20%, 25% 15%, 21% 10%, 25% 15%, 33% 15%, 
            25% 18%, 21% 25%, 29% 31%, 23% 38%, 37% 49%, 53% 44%, 61% 38%, 63% 32%, 
            65% 22%, 71% 16%, 68% 24%, 71% 28%, 64% 38%, 76% 32%, 87% 25%, 93% 25%, 
            84% 29%, 79% 33%, 75% 36%, 80% 43%, 70% 44%, 56% 47%, 48% 51%, 66% 59%, 
            76% 60%, 75% 70%, 67% 64%, 48% 56%, 23% 57%, 17% 70%, 12% 83%, 0% 100%
          );
        }

        .hw-tree-left { left: -20px; transform: scale(1.1); }
        .hw-tree-right { right: -20px; left: auto; transform: scaleX(-1) scale(1.1); }
      `}</style>

      {/* Moon */}
      <div className="hw-moon" />

      {/* Soft Floating Clouds */}
      <div className="hw-clouds" />
      <div className="hw-clouds hw-cloud2" />
      <div className="hw-clouds hw-cloud3" />

      {/* Low Subtle Bottom Trees */}
      <div className="hw-tree-silhouette" />
      <div className="hw-tree hw-tree-left" />
      <div className="hw-tree hw-tree-right" />

      {/* Creeping Fog */}
      <div className="hw-smoke" />
    </div>
  );
};
