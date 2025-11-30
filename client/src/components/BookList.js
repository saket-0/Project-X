import React from 'react';
import { MapPin, ChevronRight, Layers, CheckCircle, XCircle } from 'lucide-react';

const BookList = ({ books, onBookClick }) => {
  return (
    <div className="space-y-3">
      {books.map((group, index) => {
        const isAvailable = group.Status && group.Status.toLowerCase().includes('available');
        
        return (
          <div 
            key={index} 
            onClick={() => onBookClick(group)}
            // Changed p-5 to p-6 to increase height/breathing room
            className="group bg-white rounded-xl border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-blue-400 transition-all duration-200 ease-in-out"
          >
            <div className="flex items-center gap-4">
              
              {/* 1. INFO COLUMN (Fluid Width) */}
              <div className="flex-1 min-w-0"> 
                <h3 className="text-lg font-bold text-gray-900 truncate pr-4" title={group.Title}>
                  {group.Title || "Untitled Book"}
                </h3>
                <p className="text-gray-500 text-sm truncate">{group.Author || "Unknown Author"}</p>
                <div className="text-xs text-gray-400 mt-1 font-mono">
                  {group.Pub || "Publisher N/A"}
                </div>
              </div>

              {/* 2. METADATA COLUMNS (Fixed Widths for Alignment) */}
              <div className="hidden md:flex items-center gap-4 shrink-0">
                
                {/* COPIES */}
                <div className="w-28 flex justify-center">
                   <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200 whitespace-nowrap">
                    <Layers className="w-3.5 h-3.5" />
                    {group.totalCopies} Copies
                  </span>
                </div>

                {/* LOCATION */}
                <div className="w-36 flex justify-center">
                   <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 whitespace-nowrap w-full justify-center">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {group.Shelf || "N/A"}
                  </span>
                </div>

                {/* STATUS */}
                <div className={`w-28 flex items-center justify-end gap-1.5 text-sm font-semibold ${isAvailable ? 'text-green-600' : 'text-red-500'}`}>
                   {isAvailable ? (
                     <>
                       <CheckCircle className="w-4 h-4" />
                       <span>Available</span>
                     </>
                   ) : (
                     <>
                       <XCircle className="w-4 h-4" />
                       <span>Out</span>
                     </>
                   )}
                </div>
              </div>

              {/* 3. ARROW */}
              <div className="pl-2 text-gray-300 group-hover:text-blue-500 transition-colors">
                <ChevronRight className="w-6 h-6" />
              </div>

            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BookList;