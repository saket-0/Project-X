import React from 'react';
import { ArrowLeft, MapPin, CheckCircle, XCircle, BookOpen, Hash } from 'lucide-react';

const BookDetail = ({ bookGroup, onBack }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Navigation Header */}
      <button 
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Search
      </button>

      {/* Main Title Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{bookGroup.Title}</h1>
            <p className="text-xl text-gray-600">{bookGroup.Author}</p>
            <div className="mt-4 text-sm text-gray-500 flex gap-4">
               <span>Publisher: {bookGroup.Pub || 'N/A'}</span>
               <span>Total Copies: {bookGroup.totalCopies}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Versions Table */}
      <h3 className="text-lg font-bold text-gray-900 mb-4 px-1">Available Versions & Copies</h3>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
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
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      variant.Status?.includes('Available') 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {variant.Status?.includes('Available') ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {variant.Status || 'Unknown'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BookDetail;