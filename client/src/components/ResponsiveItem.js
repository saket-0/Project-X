import React from 'react';
import { MapPin, Calendar, Book } from 'lucide-react';

const ResponsiveItem = ({ data, onClick }) => {
  // Determine badge style based on status
  const getStatusStyle = (color) => {
    switch (color) {
      case 'green': return 'bg-green-100 text-green-800 border-green-200';
      case 'orange': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'red': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div 
      onClick={onClick}
      className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-indigo-300 transition-all duration-200 cursor-pointer flex flex-col md:flex-row gap-4 items-start md:items-center"
    >
      {/* Icon / Thumbnail Placeholder */}
      <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
        <Book className="w-6 h-6" />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
            {data.callNumber}
          </span>
          {data.tags && data.tags.includes('New Arrival') && (
            <span className="text-[10px] font-bold uppercase tracking-wide text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              New
            </span>
          )}
        </div>
        
        <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1 truncate group-hover:text-indigo-600 transition-colors">
          {data.title}
        </h3>
        
        <p className="text-sm text-gray-500">
          by <span className="font-medium text-gray-700">{data.author}</span>
          <span className="mx-2">•</span>
          {data.publisher}
        </p>
      </div>

      {/* Meta & Status (Right Side) */}
      <div className="flex flex-row md:flex-col items-center md:items-end gap-3 md:gap-1 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-none border-gray-100">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(data.statusColor)}`}>
          {data.derivedStatus}
        </span>
        
        <div className="flex items-center text-xs text-gray-500 font-medium mt-1">
          <MapPin className="w-3 h-3 mr-1" />
          {data.locationDisplay}
        </div>
      </div>
    </div>
  );
};

export default ResponsiveItem;