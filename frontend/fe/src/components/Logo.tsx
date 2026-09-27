import React from 'react';

interface LogoProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export const Logo: React.FC<LogoProps> = ({ className = '', width = 340, height = 110 }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 340 110" 
      width={width} 
      height={height}
      className={className}
    >
      <defs>
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800;900&display=swap');
            .brand-title {
              font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
              font-weight: 800;
              font-size: 80px;
              letter-spacing: -0.04em;
              fill: #141414;
            }
          `}
        </style>
      </defs>
      <text x="12" y="80" className="brand-title">friday</text>
    </svg>
  );
};
