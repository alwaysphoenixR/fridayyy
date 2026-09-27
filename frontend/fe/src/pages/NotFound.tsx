import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';

export const NotFound: React.FC = () => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleNodeClick = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] font-sans text-[#1a1c1c] antialiased selection:bg-[#fe5f00] selection:text-white flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#f9f9f9]/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-20 max-w-[1440px] mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <Logo className="h-8 w-auto" />
              <span className="text-[12px] font-bold text-[#747878] tracking-wider uppercase hidden sm:inline-block border-l border-black/[0.06] pl-3 h-4 flex items-center mt-1.5">
                Second Brain
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to="/dashboard"
              className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-[#141414] text-white text-[12px] font-bold hover:bg-black transition-all duration-200 shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </header>
      
      <main className="w-full pt-20 bg-[#f9f9f9] flex-1 flex">
        <div className="flex flex-col w-full relative overflow-hidden select-none flex-1">
          {/* Ambient Atmospheric Horizon & Glow Mesh */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[360px] bg-gradient-to-b from-[#fe5f00]/10 via-[#fe5f00]/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>
          <div className="absolute top-1/3 -right-48 w-96 h-96 bg-black/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
          <div className="absolute bottom-10 -left-40 w-96 h-96 bg-[#ffb599]/20 rounded-full blur-[100px] pointer-events-none -z-10"></div>
          
          <div className="max-w-[1440px] w-full mx-auto px-8 py-10 flex flex-col justify-center items-center flex-1">
            <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-6">
              
              {/* 404 Numeric with Pebble Node */}
              <div className="relative flex items-center justify-center select-none tracking-tighter leading-none font-bold">
                <span className="text-[130px] sm:text-[180px] md:text-[230px] lg:text-[260px] font-extrabold text-[#141414] tracking-tighter leading-none select-none drop-shadow-sm transition-transform hover:-translate-x-1 duration-300">
                  4
                </span>
                
                <div 
                  className={`relative group mx-2 sm:mx-4 md:mx-6 cursor-pointer transition-all duration-500 ease-out hover:scale-105 ${isAnimating ? 'scale-110 -rotate-6' : ''}`}
                  onClick={handleNodeClick}
                >
                  <div className="absolute inset-0 rounded-[44%_56%_62%_38%/48%_44%_56%_52%] bg-[#fe5f00]/20 blur-xl group-hover:bg-[#fe5f00]/35 transition-colors"></div>
                  <svg className="w-24 h-36 sm:w-36 sm:h-52 md:w-48 md:h-64 lg:w-56 lg:h-72 drop-shadow-[0_16px_36px_rgba(0,0,0,0.18)] transition-all duration-700 group-hover:rotate-3" fill="none" viewBox="0 0 180 240" xmlns="http://www.w3.org/2000/svg">
                    <path d="M72 12C122 8 168 38 174 94C180 150 162 210 114 230C66 250 18 214 6 156C-6 98 22 16 72 12Z" fill="#141414"></path>
                    <path d="M72 16C116 12 156 42 162 90C168 138 152 192 110 210" opacity="0.1" stroke="white" strokeLinecap="round" strokeWidth="4"></path>
                    <path className="transition-all duration-500 group-hover:stroke-[#fe5f00]" d="M90 48C74 62 106 76 90 92C74 108 106 122 90 138" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="8"></path>
                    <path d="M64 166C78 188 108 188 124 168" stroke="white" strokeLinecap="round" strokeWidth="8"></path>
                    <circle cx="68" cy="62" fill="white" r="4.5"></circle>
                    <circle cx="118" cy="74" fill="white" r="4.5"></circle>
                  </svg>
                  <div className="absolute -top-1 -right-1 sm:top-2 sm:right-2 flex items-center justify-center">
                    <span className="relative flex h-5 w-5 sm:h-6 sm:w-6">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fe5f00] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-5 w-5 sm:h-6 sm:w-6 bg-[#fe5f00] shadow-md items-center justify-center text-white">
                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                      </span>
                    </span>
                  </div>
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap bg-[#2f3131] text-[#f1f1f1] font-bold text-[11px] px-3 py-1 rounded-full shadow-lg">
                    Click to emit synapsis ping
                  </div>
                </div>
                
                <span className="text-[130px] sm:text-[180px] md:text-[230px] lg:text-[260px] font-extrabold text-[#141414] tracking-tighter leading-none select-none drop-shadow-sm transition-transform hover:translate-x-1 duration-300">
                  4
                </span>
              </div>

              {/* Centered Editorial Text Block */}
              <div className="mt-8 flex flex-col items-center">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#141414] tracking-tight leading-tight mb-2">
                  Oops! Memory not found
                </h1>
                <p className="text-[15px] text-[#444748] max-w-lg mx-auto leading-relaxed mb-6 mt-4">
                  The thought vector or page you're looking for hasn't been indexed in your Second Brain yet, or might have dissolved into another neural cluster.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
                  <Link 
                    to="/"
                    className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-transparent border-2 border-[#141414] text-[#141414] text-[13px] font-bold hover:bg-[#141414] hover:text-white transition-all duration-200"
                  >
                    Return Home
                  </Link>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
