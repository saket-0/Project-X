import React from 'react';
import { ArrowLeft, MapPin, CheckCircle, XCircle, BookOpen } from 'lucide-react';

const BookDetail = ({ bookGroup, onBack }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Navigation Header */}
      <button 
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-medium p-2 -ml-2 rounded-lg active:bg-gray-100 text-sm md:text-base"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Search
      </button>

      {/* Main Title Section - Compact Mobile Sizing */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 md:p-8 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start gap-3 md:gap-6">
          <div className="p-2.5 md:p-4 bg-blue-100 rounded-lg text-blue-600 w-fit">
            <BookOpen className="w-6 h-6 md:w-10 md:h-10" />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-1 leading-snug">{bookGroup.Title}</h1>
            <p className="text-base md:text-xl text-gray-600 mb-3">{bookGroup.Author}</p>
            <div className="flex flex-wrap gap-2 text-xs md:text-sm text-gray-500">
               <span className="bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">Publisher: {bookGroup.Pub || 'N/A'}</span>
               <span className="bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">Total Copies: {bookGroup.totalCopies}</span>
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 px-1">Available Versions & Copies</h3>

      {/* --- DESKTOP VIEW: Table (Hidden on Mobile) --- */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-medium text-gray-900">Call No</th>
                <th className="px-6 py-4 font-medium text-gray-900">Location / Shelf</th>
                <th className="px-6 py-4 font-medium text-gray-900">Accession Type</th>
                <th className="px-6 py-4 font-medium text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookGroup.variants.map((variant, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-blue-600">{variant.CallNo || 'N/A'}</td>
                  <td className="px-6 py-4 text-gray-600 flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    {variant.Shelf || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{variant.Type || 'Standard'}</td>
                  <td className="px-6 py-4">
                     <StatusBadge status={variant.Status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MOBILE VIEW: Cards (Visible only on Mobile) --- */}
      <div className="md:hidden space-y-3">
        {bookGroup.variants.map((variant, idx) => (
          <div key={idx} className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3">
            {/* Top Row: Call Number & Status */}
            <div className="flex justify-between items-start">
               <div>
                  <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Call Number</div>
                  <div className="font-mono text-blue-600 font-medium text-base">{variant.CallNo || 'N/A'}</div>
               </div>
               <StatusBadge status={variant.Status} />
            </div>
            
            {/* Bottom Row: SMART FLEX LAYOUT
              - Changed from 'grid' to 'flex'
              - 'flex-1' on Location makes it greedy (takes all space)
              - 'shrink-0' on Type makes it compact (takes only needed space)
            */}
            <div className="flex gap-4 pt-2 border-t border-gray-100">
               <div className="flex-1 min-w-0">
                 <div className="text-[10px] text-gray-400 mb-0.5">Shelf Location</div>
                 <div className="text-sm text-gray-700 flex items-center gap-1">
                   <MapPin className="w-3 h-3 text-gray-400 shrink-0" /> 
                   <span className="truncate">{variant.Shelf || 'N/A'}</span>
                 </div>
               </div>
               <div className="shrink-0">
                 <div className="text-[10px] text-gray-400 mb-0.5 text-right">Type</div>
                 <div className="text-sm text-gray-700">{variant.Type || 'Standard'}</div>
               </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

// Helper Component for Status Badge
const StatusBadge = ({ status }) => {
  const isAvailable = status?.includes('Available');
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${
      isAvailable 
        ? 'bg-green-50 text-green-700 border-green-200' 
        : 'bg-red-50 text-red-700 border-red-200'
    }`}>
      {isAvailable ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
      {status || 'Unknown'}
    </span>
  );
};

export default BookDetail;