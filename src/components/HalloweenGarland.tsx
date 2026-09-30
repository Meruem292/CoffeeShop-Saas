import React from 'react';

interface HalloweenGarlandProps {
  enabled?: boolean;
  className?: string;
}

export const HalloweenGarland: React.FC<HalloweenGarlandProps> = ({ enabled = true, className = '' }) => {
  if (!enabled) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 h-16 pointer-events-none z-[1] overflow-visible select-none ${className}`}>
      <style>{`
        @keyframes hw-swing {
          0% { transform: rotate(8deg); }
          50% { transform: rotate(-5deg); }
          100% { transform: rotate(8deg); }
        }

        .hw-garland-line {
          border-top: 2px solid #8c5407;
          width: 100%;
          position: relative;
          height: 44px;
          margin-top: 0px;
        }

        .hw-stem {
          position: absolute;
          top: -10px;
          left: 14px;
          width: 2.5px;
          height: 18px;
          border-radius: 1px;
          background-color: #194d14;
        }

        .hw-pumpkin {
          position: absolute;
          top: 6px;
          width: 32px;
          height: 28px;
          border-radius: 36px;
          background: #e02604;
          transform-origin: 50% 0;
          box-shadow: inset 0 0px 12px #964203, 0 0 12px 1px #d23805, 0px 4px 8px #862400, 0px 2px 3px #ffc039 inset;
        }

        .hw-pumpkin::before {
          content: "";
          position: absolute;
          width: 26px;
          height: 28px;
          left: -6px;
          border-radius: 40px;
          background: #e02604;
          box-shadow: inset 0 0px 12px #964203, 0 0 10px 1px #d23805, 0px 4px 8px #862400;
        }

        .hw-pumpkin::after {
          content: "";
          position: absolute;
          width: 26px;
          height: 28px;
          left: 0px;
          border-radius: 40px;
          background: #e02604;
          box-shadow: inset 0 0px 12px #964203, 0px 4px 8px #862400;
        }

        .hw-heart {
          position: absolute;
          top: 0;
          left: 10px;
          z-index: 3;
          width: 8px;
          height: 28px;
          border-radius: 50%;
          background: #e02604;
          box-shadow: inset 0 0px 12px #964203, 0px 4px 8px #862400;
        }

        .hw-eye {
          position: absolute;
          top: 7px;
          left: 5px;
          height: 5px;
          width: 4px;
          z-index: 10;
          background-color: orange;
          box-shadow: inset 10px 0 5px black;
          border: 1px solid red;
          clip-path: polygon(0% 98%, 100% 99%, 52.9% 4.9%);
        }

        .hw-eye-right {
          left: 16px;
        }

        .hw-rounded-eyes {
          position: absolute;
          z-index: 10;
          top: 64px;
          left: 11px;
        }

        .hw-rounded-eyes:before,
        .hw-rounded-eyes:after {
          content: "";
          position: absolute;
          width: 5px;
          height: 6px;
          background-color: orange;
          box-shadow: inset 1px 0 2px black;
          border-bottom: 1.5px solid #ff5722;
          border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
        }

        .hw-rounded-eyes:before { top: -56px; left: -5px; transform: rotate(20deg); }
        .hw-rounded-eyes:after { top: -58px; left: 8px; transform: rotate(-20deg); }

        .hw-baby-eyes:before,
        .hw-baby-eyes:after {
          width: 4px;
          height: 4px;
          top: -58px;
        }

        .hw-mean-mouth {
          position: absolute;
          width: 65%;
          height: 20px;
          left: 4px;
          top: 7px;
          z-index: 10;
          background: black;
          clip-path: polygon(14% 64%, 25% 79%, 32% 74%, 41% 89%, 50% 80%, 54% 87%, 60% 78%, 66% 83%, 73% 72%, 78% 78%, 88% 57%, 78% 69%, 73% 66%, 66% 76%, 59% 69%, 54% 77%, 47% 69%, 43% 76%, 34% 64%, 26% 70%);
        }

        .hw-rounded-mouth {
          position: absolute;
          width: 20px;
          height: 16px;
          left: 3px;
          top: 10px;
          background: black;
          z-index: 10;
          clip-path: polygon(10% 75%, 25% 90%, 40% 95%, 60% 95%, 75% 91%, 90% 75%, 62% 88%, 37% 88%);
        }

        .hw-bb-mouth {
          position: absolute;
          width: 15px;
          height: 4px;
          left: 5px;
          top: 16px;
          z-index: 10;
          border-bottom: 3.5px solid black;
          border-radius: 50%;
        }

        .hw-pumpkin:nth-child(1) { left: 3%; animation: hw-swing 0.8s ease-in-out infinite alternate; }
        .hw-pumpkin:nth-child(2) { left: 15%; animation: hw-swing 1s ease-in-out infinite alternate; }
        .hw-pumpkin:nth-child(3) { left: 27%; animation: hw-swing 1.6s ease-in-out infinite alternate; }
        .hw-pumpkin:nth-child(4) { left: 39%; animation: hw-swing 1s ease-in-out infinite alternate; }
        .hw-pumpkin:nth-child(5) { left: 51%; animation: hw-swing 1.2s ease-in-out infinite alternate; }
        .hw-pumpkin:nth-child(6) { left: 63%; animation: hw-swing 1.6s ease-in-out infinite alternate; }
        .hw-pumpkin:nth-child(7) { left: 75%; animation: hw-swing 1s ease-in-out infinite alternate; }
        .hw-pumpkin:nth-child(8) { left: 87%; animation: hw-swing 1.3s ease-in-out infinite alternate; }
      `}</style>

      <div className="hw-garland-line">
        <div className="hw-pumpkin">
          <div className="hw-stem" />
          <div className="hw-heart" />
          <div className="hw-rounded-eyes" />
          <div className="hw-rounded-eyes" />
          <div className="hw-mean-mouth" />
        </div>

        <div className="hw-pumpkin">
          <div className="hw-stem" />
          <div className="hw-heart" />
          <div className="hw-eye" />
          <div className="hw-eye hw-eye-right" />
          <div className="hw-bb-mouth" />
        </div>

        <div className="hw-pumpkin">
          <div className="hw-stem" />
          <div className="hw-heart" />
          <div className="hw-rounded-eyes hw-baby-eyes" />
          <div className="hw-rounded-eyes hw-baby-eyes" />
          <div className="hw-mean-mouth" />
        </div>

        <div className="hw-pumpkin">
          <div className="hw-stem" />
          <div className="hw-heart" />
          <div className="hw-rounded-eyes" />
          <div className="hw-rounded-eyes" />
          <div className="hw-rounded-mouth" />
        </div>

        <div className="hw-pumpkin">
          <div className="hw-stem" />
          <div className="hw-heart" />
          <div className="hw-eye" />
          <div className="hw-eye hw-eye-right" />
          <div className="hw-bb-mouth" />
        </div>

        <div className="hw-pumpkin">
          <div className="hw-stem" />
          <div className="hw-heart" />
          <div className="hw-rounded-eyes" />
          <div className="hw-rounded-eyes" />
          <div className="hw-mean-mouth" />
        </div>

        <div className="hw-pumpkin">
          <div className="hw-stem" />
          <div className="hw-heart" />
          <div className="hw-eye" />
          <div className="hw-eye hw-eye-right" />
          <div className="hw-bb-mouth" />
        </div>

        <div className="hw-pumpkin">
          <div className="hw-stem" />
          <div className="hw-heart" />
          <div className="hw-rounded-eyes hw-baby-eyes" />
          <div className="hw-rounded-eyes hw-baby-eyes" />
          <div className="hw-mean-mouth" />
        </div>
      </div>
    </div>
  );
};
