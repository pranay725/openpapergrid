'use client';

import React from 'react';

// Logo Option 1: Neural Network Grid
const Logo1 = () => (
  <div className="group cursor-pointer relative">
    <div className="w-11 h-11 relative">
      <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-0.5">
        {/* Corners - representing nodes */}
        <div className="bg-blue-600 rounded-full scale-75 transition-all duration-300 group-hover:scale-100 group-hover:bg-blue-700"></div>
        <div className="bg-gray-300 rounded-sm transition-all duration-300 group-hover:bg-blue-200"></div>
        <div className="bg-gray-300 rounded-sm transition-all duration-300 group-hover:bg-blue-200"></div>
        <div className="bg-blue-600 rounded-full scale-75 transition-all duration-300 group-hover:scale-100 group-hover:bg-blue-700"></div>
        
        {/* Row 2 */}
        <div className="bg-gray-300 rounded-sm transition-all duration-300 group-hover:bg-blue-200"></div>
        <div className="bg-blue-500 rounded-sm transition-all duration-300 group-hover:bg-blue-600 group-hover:shadow-sm"></div>
        <div className="bg-blue-500 rounded-sm transition-all duration-300 group-hover:bg-blue-600 group-hover:shadow-sm"></div>
        <div className="bg-gray-300 rounded-sm transition-all duration-300 group-hover:bg-blue-200"></div>
        
        {/* Row 3 */}
        <div className="bg-gray-300 rounded-sm transition-all duration-300 group-hover:bg-blue-200"></div>
        <div className="bg-blue-500 rounded-sm transition-all duration-300 group-hover:bg-blue-600 group-hover:shadow-sm"></div>
        <div className="bg-blue-500 rounded-sm transition-all duration-300 group-hover:bg-blue-600 group-hover:shadow-sm"></div>
        <div className="bg-gray-300 rounded-sm transition-all duration-300 group-hover:bg-blue-200"></div>
        
        {/* Bottom - representing nodes */}
        <div className="bg-blue-600 rounded-full scale-75 transition-all duration-300 group-hover:scale-100 group-hover:bg-blue-700"></div>
        <div className="bg-gray-300 rounded-sm transition-all duration-300 group-hover:bg-blue-200"></div>
        <div className="bg-gray-300 rounded-sm transition-all duration-300 group-hover:bg-blue-200"></div>
        <div className="bg-blue-600 rounded-full scale-75 transition-all duration-300 group-hover:scale-100 group-hover:bg-blue-700"></div>
      </div>
      
      {/* Connecting lines */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[18%] left-[18%] w-[64%] h-0.5 bg-blue-400/30 transition-all duration-300 group-hover:bg-blue-400/60"></div>
        <div className="absolute top-[18%] left-[18%] h-[64%] w-0.5 bg-blue-400/30 transition-all duration-300 group-hover:bg-blue-400/60"></div>
        <div className="absolute bottom-[18%] left-[18%] w-[64%] h-0.5 bg-blue-400/30 transition-all duration-300 group-hover:bg-blue-400/60"></div>
        <div className="absolute top-[18%] right-[18%] h-[64%] w-0.5 bg-blue-400/30 transition-all duration-300 group-hover:bg-blue-400/60"></div>
      </div>
    </div>
    <div className="absolute -inset-1 bg-blue-600/0 rounded-lg transition-all duration-300 group-hover:bg-blue-600/10 group-hover:animate-pulse -z-10"></div>
  </div>
);

// Logo Option 2: Hexagonal Data Core
const Logo2 = () => (
  <div className="group cursor-pointer relative">
    <div className="w-10 h-10 relative flex items-center justify-center">
      {/* Central hexagon */}
      <div className="absolute w-6 h-6 bg-blue-600 rotate-45 transition-all duration-500 group-hover:rotate-90 group-hover:bg-blue-700"></div>
      
      {/* Four corner dots */}
      <div className="absolute -top-0.5 -left-0.5 w-3 h-3 bg-blue-500 rounded-full transition-all duration-300 group-hover:scale-110 group-hover:bg-blue-600"></div>
      <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-gray-300 rounded-full transition-all duration-300 group-hover:scale-110 group-hover:bg-blue-400"></div>
      <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 bg-gray-300 rounded-full transition-all duration-300 group-hover:scale-110 group-hover:bg-blue-400"></div>
      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full transition-all duration-300 group-hover:scale-110 group-hover:bg-blue-600"></div>
      
      {/* Inner grid pattern */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="grid grid-cols-2 grid-rows-2 gap-0.5 w-4 h-4 rotate-45 transition-all duration-500 group-hover:rotate-0">
          <div className="bg-white/80 rounded-sm"></div>
          <div className="bg-white/40 rounded-sm"></div>
          <div className="bg-white/40 rounded-sm"></div>
          <div className="bg-white/80 rounded-sm"></div>
        </div>
      </div>
      
      {/* Orbiting elements */}
      <div className="absolute inset-0 transition-all duration-700">
        <div className="absolute top-1/2 left-0 w-1.5 h-1.5 bg-blue-400 rounded-full -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-300"></div>
        <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-blue-400 rounded-full -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-300 delay-100"></div>
        <div className="absolute top-1/2 right-0 w-1.5 h-1.5 bg-blue-400 rounded-full -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-300 delay-200"></div>
        <div className="absolute bottom-0 left-1/2 w-1.5 h-1.5 bg-blue-400 rounded-full -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-300 delay-300"></div>
      </div>
    </div>
  </div>
);

// Logo Option 3: Flowing Data Grid (Current)
const Logo3 = () => (
  <div className="group cursor-pointer relative w-10 h-10">
    <div className="absolute inset-0">
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-px">
        {/* Top row - data input */}
        <div className="bg-gradient-to-br from-blue-400 to-blue-500 opacity-40 group-hover:opacity-70 transition-all duration-500"></div>
        <div className="bg-gradient-to-b from-blue-500 to-blue-600 opacity-60 group-hover:opacity-90 transition-all duration-500 delay-75"></div>
        <div className="bg-gradient-to-bl from-blue-400 to-blue-500 opacity-40 group-hover:opacity-70 transition-all duration-500 delay-150"></div>
        
        {/* Middle row - processing */}
        <div className="bg-gradient-to-r from-gray-300 to-blue-400 opacity-50 group-hover:opacity-80 transition-all duration-500 delay-100"></div>
        <div className="bg-blue-600 group-hover:bg-blue-700 transition-all duration-300 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>
        <div className="bg-gradient-to-l from-gray-300 to-blue-400 opacity-50 group-hover:opacity-80 transition-all duration-500 delay-100"></div>
        
        {/* Bottom row - data output */}
        <div className="bg-gradient-to-tr from-blue-500 to-blue-400 opacity-40 group-hover:opacity-70 transition-all duration-500 delay-150"></div>
        <div className="bg-gradient-to-t from-blue-600 to-blue-500 opacity-60 group-hover:opacity-90 transition-all duration-500 delay-75"></div>
        <div className="bg-gradient-to-tl from-blue-500 to-blue-400 opacity-40 group-hover:opacity-70 transition-all duration-500"></div>
      </div>
      
      {/* Flow indicators */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-blue-400 via-white to-blue-400 opacity-0 group-hover:opacity-60 transition-opacity duration-700 -translate-x-1/2"></div>
        <div className="absolute left-0 top-1/2 w-full h-px bg-gradient-to-r from-blue-400 via-white to-blue-400 opacity-0 group-hover:opacity-60 transition-opacity duration-700 -translate-y-1/2"></div>
      </div>
      
      {/* Corner accents */}
      <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-blue-600 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
      <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-blue-600 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
      <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-blue-600 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
      <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-blue-600 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
    </div>
  </div>
);

// Main Logo component - shows all options or selected one
export const Logo = ({ showComparison = false, selected = 3 }: { showComparison?: boolean; selected?: number }) => {
  if (showComparison) {
    return (
      <div className="flex items-center gap-8 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <Logo1 />
          <p className="text-xs mt-2 text-gray-600">Option 1: Neural Grid</p>
        </div>
        <div className="text-center">
          <Logo2 />
          <p className="text-xs mt-2 text-gray-600">Option 2: Data Core</p>
        </div>
        <div className="text-center">
          <Logo3 />
          <p className="text-xs mt-2 text-gray-600">Option 3: Flow Grid</p>
        </div>
      </div>
    );
  }
  
  // Return selected logo
  switch (selected) {
    case 1:
      return <Logo1 />;
    case 2:
      return <Logo2 />;
    case 3:
    default:
      return <Logo3 />;
  }
};
