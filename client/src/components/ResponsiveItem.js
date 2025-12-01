import React from 'react';
import { ChevronRight, CheckCircle, XCircle } from 'lucide-react';

const ResponsiveItem = ({ 
  title, 
  subtitle, 
  tertiary, 
  tags, 
  format, // "E-Book", "CD", etc.
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
        {/* Title */}
        <h3 className="text-base md:text-lg font-bold text-gray-900 leading-snug mb-0.5" title={title}>
          {title || "Untitled"}
        </h3>
        
        {/* Author */}
        <p className="text-gray-500 text-sm truncate">{subtitle || "Unknown"}</p>
        
        {/* Metadata Row (Badge + Publisher) */}
        <div className="flex items-center gap-2 mt-1.5 min-h-[20px]">
            {/* Format Badge (Only renders if format exists) */}
            {format && (
                <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 uppercase tracking-wider shadow-sm">
                    {format}
                </span>
            )}

            {/* Publisher Text 
                FIX: We use a Template Literal to conditionally add the border classes.
                The border-l (pipe) is ONLY added if 'format' exists. 
            */}
            {tertiary && (
              <span className={`text-xs text-gray-400 font-mono hidden md:block truncate ${format ? 'border-l border-gray-300 pl-2 ml-0.5' : ''}`}>
                {tertiary}
              </span>
            )}
        </div>
        
        {/* Structured Tag Badges */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map((tag, idx) => (
              <span 
                key={idx} 
                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wide"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 2. Responsive Stats Row */}
      <div className="flex items-center gap-2 md:gap-6 shrink-0 w-full md:w-auto mt-1 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
        
        {stats.map((stat, idx) => {
          const isLast = idx === stats.length - 1;
          
          return (
            <div 
              key={idx} 
              className={`${isLast ? 'flex-1 min-w-0' : 'shrink-0'} flex md:flex-col md:items-center md:justify-center md:w-28`}
            >
               <div className="md:hidden sr-only">{stat.label}</div>
               
               <span className={`
                 inline-flex items-center gap-1.5 px-2 py-1 md:px-0 md:py-0 
                 rounded-md text-xs md:text-sm font-medium text-gray-600 
                 bg-gray-50 border border-gray-200 md:bg-transparent md:border-0 
                 w-full md:w-auto
                 ${isLast ? 'justify-start' : 'justify-center'}
               `}>
                  {stat.icon && <stat.icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                  <span className="truncate">{stat.value}</span>
               </span>
               {stat.subLabel && <span className="hidden md:block text-[10px] text-gray-400 uppercase tracking-wider font-bold mt-1">{stat.subLabel}</span>}
            </div>
          );
        })}

        {status && (
          <div className={`shrink-0 md:w-28 flex items-center justify-end md:justify-center gap-1.5 text-xs md:text-sm font-semibold py-1 rounded-md ${status.isPositive ? 'text-green-600' : 'text-red-500'}`}>
             {status.isPositive ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
             <span className="hidden md:inline">{status.label}</span>
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