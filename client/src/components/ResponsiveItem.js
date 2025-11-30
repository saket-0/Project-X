import React from 'react';
import { ChevronRight, CheckCircle, XCircle } from 'lucide-react';

const ResponsiveItem = ({ 
  title, 
  subtitle, 
  tertiary, 
  stats = [], 
  status,     
  onClick 
}) => {
  return (
    <div 
      onClick={onClick}
      // CHANGE 1: Reduced padding from p-5 to p-4 for mobile
      className="group bg-white rounded-xl border border-gray-200 p-4 md:p-6 cursor-pointer hover:shadow-md hover:border-blue-400 transition-all duration-200 ease-in-out flex flex-col md:flex-row gap-3 md:gap-4 md:items-center relative"
    >
      {/* 1. Main Content Section */}
      <div className="flex-1 min-w-0 pr-6 md:pr-0"> 
        {/* CHANGE 2: Title is now text-base on mobile, text-lg on desktop */}
        <h3 className="text-base md:text-lg font-bold text-gray-900 leading-snug mb-0.5" title={title}>
          {title || "Untitled"}
        </h3>
        <p className="text-gray-500 text-sm truncate">{subtitle || "Unknown"}</p>
        
        {/* Optional: Publisher text */}
        {tertiary && (
          <div className="text-xs text-gray-400 mt-0.5 font-mono hidden md:block">{tertiary}</div>
        )}
      </div>

      {/* 2. Responsive Stats Grid */}
      <div className="grid grid-cols-2 gap-2 md:flex md:items-center md:gap-6 shrink-0 w-full md:w-auto mt-1 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
        
        {stats.map((stat, idx) => (
          <div key={idx} className="flex md:flex-col md:items-center md:justify-center md:w-28">
             <div className="md:hidden sr-only">{stat.label}</div>
             
             {/* CHANGE 3: Stats text is now text-xs on mobile */}
             <span className="inline-flex items-center gap-1.5 px-2 py-1 md:px-0 md:py-0 rounded-md text-xs md:text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 md:bg-transparent md:border-0 w-full md:w-auto justify-center">
                {stat.icon && <stat.icon className="w-3.5 h-3.5 text-gray-400" />}
                {stat.value}
             </span>
             {stat.subLabel && <span className="hidden md:block text-[10px] text-gray-400 uppercase tracking-wider font-bold mt-1">{stat.subLabel}</span>}
          </div>
        ))}

        {/* Status Badge */}
        {status && (
          <div className={`col-span-2 md:col-span-auto md:w-28 flex items-center justify-center gap-1.5 text-xs md:text-sm font-semibold py-1 rounded-md ${status.isPositive ? 'bg-green-50 text-green-600 md:bg-transparent' : 'bg-red-50 text-red-500 md:bg-transparent'}`}>
             {status.isPositive ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
             <span>{status.label}</span>
          </div>
        )}
      </div>

      <div className="absolute top-4 right-4 md:static md:pl-2 text-gray-300 group-hover:text-blue-500 transition-colors">
        <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
      </div>
    </div>
  );
};

export default ResponsiveItem;