import React from 'react';
import { MapPin, ChevronRight, Book, Layers, CheckCircle, XCircle } from 'lucide-react';

const BookList = ({ books, onBookClick }) => {
  return (
    <div className="space-y-4">
      {books.map((group, index) => {
        const isAvailable = group.Status && group.Status.includes('Available');
        
        return (
          <div 
            key={index} 
            onClick={() => onBookClick(group)}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all flex justify-between items-center group"
          >
            {/* LEFT SIDE: Book Info */}
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-1">
                  {group.Title || "Untitled"}
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                  <Layers className="w-3 h-3" />
                  {group.totalCopies} {group.totalCopies === 1 ? 'copy' : 'copies'}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-1">{group.Author || "Unknown Author"}</p>
              <p className="text-xs text-gray-400">{group.Pub}</p>
            </div>

            {/* RIGHT SIDE: Location & Status (The "Best" Copy) */}
            <div className="flex flex-col items-end gap-2 min-w-[140px]">
              {/* Location Badge */}
              <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200">
                 <MapPin className="w-4 h-4 text-blue-500" />
                 <span>{group.Shelf || "N/A"}</span>
              </div>

              {/* Status Indicator */}
              <div className={`flex items-center gap-1 text-xs font-medium ${isAvailable ? 'text-green-600' : 'text-red-500'}`}>
                {isAvailable ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {isAvailable ? 'Available' : 'Checked Out'}
              </div>
            </div>

            <div className="pl-4 text-gray-300 group-hover:text-blue-500 transition-colors">
              <ChevronRight className="w-6 h-6" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BookList;