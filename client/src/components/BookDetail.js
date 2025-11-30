import React from 'react';
import { ArrowLeft, MapPin, CheckCircle, XCircle, BookOpen, Tag, Info, Calendar } from 'lucide-react';

const BookDetail = ({ book, onBack }) => {
  // 1. DATA NORMALIZATION
  const title = book.title || book.Title;
  const author = book.author || book.Author;
  const publisher = book.publisher || book.Pub;
  const status = book.status || book.Status || 'Unknown';
  const callNo = book.callNumber || book.CallNo || 'N/A';
  const shelf = book.shelf || book.Shelf || book.location || 'N/A';
  
  // Smart Data
  const description = book.description;
  const tags = book.tags || [];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Navigation Header */}
      <button 
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-medium p-2 -ml-2 rounded-lg active:bg-gray-100 text-sm md:text-base"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Search
      </button>

      {/* Main Title Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 md:p-8 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start gap-3 md:gap-6">
          <div className="p-3 bg-blue-100 rounded-xl text-blue-600 w-fit shrink-0">
            <BookOpen className="w-8 h-8 md:w-12 md:h-12" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2 leading-tight">{title}</h1>
            <p className="text-lg md:text-xl text-gray-600 font-medium mb-4">{author}</p>
            
            <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-6">
               {publisher && (
                 <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                   <Calendar className="w-4 h-4" />
                   {publisher}
                 </span>
               )}
               <StatusBadge status={status} />
            </div>

            {/* --- SMART TAGS --- */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, i) => (
                  <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 capitalize">
                    <Tag className="w-3 h-3 mr-1.5 opacity-60" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* --- SMART DESCRIPTION --- */}
        {description && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3 uppercase tracking-wide">
              <Info className="w-4 h-4 text-blue-500" /> About this book
            </h4>
            <p className="text-gray-600 leading-relaxed max-w-4xl text-sm md:text-base">
              {description}
            </p>
          </div>
        )}
      </div>

      <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 px-1">Shelf Location & Availability</h3>

      {/* Location Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-medium text-gray-900">Call Number</th>
                  <th className="px-6 py-4 font-medium text-gray-900">Shelf Location</th>
                  <th className="px-6 py-4 font-medium text-gray-900 text-right">Current Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-6 py-4 font-mono text-blue-600 font-medium text-base">{callNo}</td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {shelf}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <StatusBadge status={status} />
                    </td>
                  </tr>
              </tbody>
            </table>
          </div>
      </div>
    </div>
  );
};

// Helper Component
const StatusBadge = ({ status }) => {
  const safeStatus = status || 'Unknown';
  const isAvailable = safeStatus.toLowerCase().includes('available');
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
      isAvailable 
        ? 'bg-green-50 text-green-700 border-green-200' 
        : 'bg-red-50 text-red-700 border-red-200'
    }`}>
      {isAvailable ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
      {safeStatus}
    </span>
  );
};

export default BookDetail;