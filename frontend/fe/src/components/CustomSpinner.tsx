import React from 'react';

interface CustomSpinnerProps {
  className?: string;
}

export const CustomSpinner: React.FC<CustomSpinnerProps> = ({ className = 'w-8 h-8' }) => {
  return (
    <div className={className}>
      <svg fill="none" height="100%" viewBox="0 0 400 240" width="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter height="140%" id="glow" width="140%" x="-20%" y="-20%">
            <feGaussianBlur result="blur" stdDeviation="6"></feGaussianBlur>
            <feComposite in="SourceGraphic" in2="blur" operator="over"></feComposite>
          </filter>
          <filter height="160%" id="intense-glow" width="160%" x="-30%" y="-30%">
            <feGaussianBlur result="blur" stdDeviation="12"></feGaussianBlur>
            <feMerge>
              <feMergeNode in="blur"></feMergeNode>
              <feMergeNode in="SourceGraphic"></feMergeNode>
            </feMerge>
          </filter>
          <linearGradient id="glowGrad" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#FF5F00" stopOpacity="0.9"></stop>
            <stop offset="50%" stopColor="#FF8A00" stopOpacity="1"></stop>
            <stop offset="100%" stopColor="#FF3D00" stopOpacity="0.9"></stop>
          </linearGradient>
          <linearGradient id="headGlow" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF"></stop>
            <stop offset="60%" stopColor="#FFB366"></stop>
            <stop offset="100%" stopColor="#FF5F00"></stop>
          </linearGradient>
        </defs>
        <style>
          {`
            .infinity-track-subtle {
              stroke: #FF5F00;
              stroke-opacity: 0.15;
              stroke-width: 22;
              stroke-linecap: round;
              stroke-linejoin: round;
            }

            .infinity-track-glow {
              stroke: #FF5F00;
              stroke-opacity: 0.08;
              stroke-width: 38;
              stroke-linecap: round;
              stroke-linejoin: round;
              filter: blur(8px);
            }

            .infinity-active-pulse {
              stroke: url(#glowGrad);
              stroke-width: 22;
              stroke-linecap: round;
              stroke-linejoin: round;
              stroke-dasharray: 230 710;
              animation: traceLoop 2.2s cubic-bezier(0.42, 0, 0.58, 1) infinite;
              filter: drop-shadow(0 0 10px rgba(255, 95, 0, 0.65));
            }

            .infinity-lead-core {
              stroke: #FFFFFF;
              stroke-width: 14;
              stroke-linecap: round;
              stroke-dasharray: 60 880;
              animation: traceLoop 2.2s cubic-bezier(0.42, 0, 0.58, 1) infinite;
              animation-delay: -0.04s;
              filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.9));
            }

            @keyframes traceLoop {
              0% {
                stroke-dashoffset: 0;
              }
              100% {
                stroke-dashoffset: -940;
              }
            }
          `}
        </style>
        <path className="infinity-track-glow" d="M 200,120 C 240,65 330,65 330,120 C 330,175 240,175 200,120 C 160,65 70,65 70,120 C 70,175 160,175 200,120 Z"></path>
        <path className="infinity-track-subtle" d="M 200,120 C 240,65 330,65 330,120 C 330,175 240,175 200,120 C 160,65 70,65 70,120 C 70,175 160,175 200,120 Z"></path>
        <path className="infinity-active-pulse" d="M 200,120 C 240,65 330,65 330,120 C 330,175 240,175 200,120 C 160,65 70,65 70,120 C 70,175 160,175 200,120 Z"></path>
        <path className="infinity-lead-core" d="M 200,120 C 240,65 330,65 330,120 C 330,175 240,175 200,120 C 160,65 70,65 70,120 C 70,175 160,175 200,120 Z"></path>
      </svg>
    </div>
  );
};
