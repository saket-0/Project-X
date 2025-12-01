import React from 'react';
import { ChevronRight, CheckCircle, XCircle } from 'lucide-react';

// --- HELPER: Smart Highlight Component ---
const Highlight = ({ text, term, matches, enabled }) => {
  if (!text) return null;
  if (!enabled) return text;

  try {
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let regex;

    // 1. Priority: Use Backend "Smart Matches" (e.g. "Python" when you typed "pythen")
    if (matches && matches.length > 0) {
        // Create regex for ANY of the matched tokens: (python|java|etc)
        const pattern = matches.map(m => escapeRegex(m)).join('|');
        regex = new RegExp(`(${pattern})`, 'gi');
    } 
    // 2. Fallback: Use raw search term
    else if (term && term.trim().length >= 2) {
        regex = new RegExp(`(${escapeRegex(term)})`, 'gi');
    } 
    else {
        return text;
    }
    
    // Split and Highlight
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, i) => 
          regex.test(part) ? (
            <mark key={i} className="bg-yellow-200 text-gray-900 rounded-sm px-0.5 mx-px font-semibold no-underline">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  } catch (e) {
    return text; // Fail graceful
  }
};

const ResponsiveItem = ({ 
  title, 
  subtitle, 
  tertiary, 
  tags, 
  format, 
  stats = [], 
  status,     
  onClick,
  highlightTerm,   
  highlightEnabled,
  matchedWords = [] // <--- New Prop
}) => {
  
  // Helper to pass common props
  const renderHighlight = (txt) => (
      <Highlight 
          text={txt} 
          term={highlightTerm} 
          matches={matchedWords} 
          enabled={highlightEnabled} 
      />
  );

  return (
    <div 
      onClick={onClick}
      className="group bg-white rounded-xl border border-gray-200 p-4 md:p-6 cursor-pointer hover:shadow-md hover:border-blue-400 transition-all duration-200 ease-in-out flex flex-col md:flex-row gap-3 md:gap-4 md:items-center relative"
    >
      <div className="flex-1 min-w-0 pr-6 md:pr-0"> 
        <h3 className="text-base md:text-lg font-bold text-gray-900 leading-snug mb-0.5" title={title}>
          {renderHighlight(title || "Untitled")}
        </h3>
        
        <p className="text-gray-500 text-sm truncate">
           {renderHighlight(subtitle || "Unknown")}
        </p>
        
        <div className="flex items-center gap-2 mt-1.5 min-h-[20px]">
            {format && (
                <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 uppercase tracking-wider shadow-sm">
                    {format}
                </span>
            )}

            {tertiary && (
              <span className={`text-xs text-gray-400 font-mono hidden md:block truncate ${format ? 'border-l border-gray-300 pl-2 ml-0.5' : ''}`}>
                {renderHighlight(tertiary)}
              </span>
            )}
        </div>
        
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map((tag, idx) => (
              <span 
                key={idx} 
                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wide"
              >
                {renderHighlight(tag)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stats Row (Unchanged) */}
      <div className="flex items-center gap-2 md:gap-6 shrink-0 w-full md:w-auto mt-1 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
        {stats.map((stat, idx) => {
          const isLast = idx === stats.length - 1;
          return (
            <div key={idx} className={`${isLast ? 'flex-1 min-w-0' : 'shrink-0'} flex md:flex-col md:items-center md:justify-center md:w-28`}>
               <div className="md:hidden sr-only">{stat.label}</div>
               <span className={`inline-flex items-center gap-1.5 px-2 py-1 md:px-0 md:py-0 rounded-md text-xs md:text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 md:bg-transparent md:border-0 w-full md:w-auto ${isLast ? 'justify-start' : 'justify-center'}`}>
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