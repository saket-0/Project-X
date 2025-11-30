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
      className="group bg-white rounded-xl border border-gray-200 p-4 md:p-6 cursor-pointer hover:shadow-md hover:border-blue-400 transition-all duration-200 ease-in-out flex flex-col md:flex-row gap-3 md:gap-4 md:items-center relative"
    >
      {/* 1. Main Content Section */}
      <div className="flex-1 min-w-0 pr-6 md:pr-0"> 
        <h3 className="text-base md:text-lg font-bold text-gray-900 leading-snug mb-0.5" title={title}>
          {title || "Untitled"}
        </h3>
        <p className="text-gray-500 text-sm truncate">{subtitle || "Unknown"}</p>
        
        {tertiary && (
          <div className="text-xs text-gray-400 mt-0.5 font-mono hidden md:block">{tertiary}</div>
        )}
      </div>

      {/* 2. Responsive Stats Row (Smart Flex) */}
      <div className="flex items-center gap-3 md:gap-6 shrink-0 w-full md:w-auto mt-1 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
        
        {stats.map((stat, idx) => (
          <div 
            key={idx} 
            // AUTOMATIC LOGIC:
            // If it's the last item (usually Location), give it flex-1 to fill space.
            // If it's an earlier item (Copies), keep it compact (shrink-0).
            className={`${idx === stats.length - 1 ? 'flex-1 min-w-0' : 'shrink-0'} flex md:flex-col md:items-center md:justify-center md:w-28`}
          >
             <div className="md:hidden sr-only">{stat.label}</div>
             
             <span className="inline-flex items-center gap-1.5 px-2 py-1 md:px-0 md:py-0 rounded-md text-xs md:text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 md:bg-transparent md:border-0 w-full md:w-auto justify-center">
                {stat.icon && <stat.icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                <span className="truncate">{stat.value}</span>
             </span>
             {stat.subLabel && <span className="hidden md:block text-[10px] text-gray-400 uppercase tracking-wider font-bold mt-1">{stat.subLabel}</span>}
          </div>
        ))}

        {/* Status Badge */}
        {status && (
          <div className={`shrink-0 md:w-28 flex items-center justify-center gap-1.5 text-xs md:text-sm font-semibold py-1 rounded-md ${status.isPositive ? 'bg-green-50 text-green-600 md:bg-transparent' : 'bg-red-50 text-red-500 md:bg-transparent'}`}>
             {status.isPositive ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
             <span className="hidden md:inline">{status.label}</span>
             {/* Mobile only icon fallback if needed, or keep text */}
             <span className="md:hidden">{status.label}</span>
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