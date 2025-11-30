import React from 'react';
import { MapPin, ChevronRight, Book, Layers } from 'lucide-react';

const BookList = ({ books, onBookClick }) => {
  return (
    <div className="space-y-4">
      {books.map((group, index) => (
        <div 
          key={index} 
          onClick={() => onBookClick(group)}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all flex justify-between items-center group"
        >
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                {group.Title || "Untitled"}
              </h3>
              {/* Badge showing how many versions/copies exist */}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                <Layers className="w-3 h-3" />
                {group.totalCopies} versions
              </span>
            </div>
            
            <p className="text-gray-600 text-sm">{group.Author || "Unknown Author"}</p>
            
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
               <span>{group.Pub}</span>
            </div>
          </div>

          <div className="pl-4">
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default BookList;