import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center space-x-4 py-8 mt-4 border-t border-gray-100">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        <ChevronLeft className="w-4 h-4 mr-2" />
        Previous
      </button>

      <div className="hidden md:flex items-center space-x-2">
        <span className="px-3 py-1 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-md">
          Page {currentPage}
        </span>
        <span className="text-gray-400">of</span>
        <span className="text-sm text-gray-600">{totalPages}</span>
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        Next
        <ChevronRight className="w-4 h-4 ml-2" />
      </button>
    </div>
  );
};

export default Pagination;