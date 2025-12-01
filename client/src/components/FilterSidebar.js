import React from 'react';
import { Filter, X } from 'lucide-react';

const FilterSidebar = ({ facets = {}, selectedFilters, onFilterChange, isOpen, onClose }) => {
  // Safe defaults if facets are still loading
  const floors = facets.floors || [];
  const categories = facets.categories || [];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed md:sticky top-0 md:top-24 left-0 h-full md:h-[calc(100vh-8rem)]
        w-64 bg-white md:bg-transparent z-30 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        border-r md:border-none border-gray-200 p-6 overflow-y-auto
      `}>
        
        <div className="flex justify-between items-center mb-6 md:hidden">
          <h2 className="text-xl font-bold text-gray-800">Filters</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section: Floor */}
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center">
            <Filter className="w-3 h-3 mr-2" />
            Floor Level
          </h3>
          <div className="space-y-2">
            {floors.map((floor) => (
              <label key={floor} className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedFilters.floor === floor}
                  onChange={() => onFilterChange('floor', selectedFilters.floor === floor ? '' : floor)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className={`text-sm ${selectedFilters.floor === floor ? 'text-indigo-600 font-medium' : 'text-gray-600 group-hover:text-gray-900'}`}>
                  Floor {floor}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Section: Category */}
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Top Categories
          </h3>
          <div className="space-y-2">
            {categories.map((cat) => (
              <label key={cat} className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedFilters.category === cat}
                  onChange={() => onFilterChange('category', selectedFilters.category === cat ? '' : cat)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900 truncate" title={cat}>
                  {cat}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Reset Button */}
        {(selectedFilters.floor || selectedFilters.category) && (
          <button
            onClick={() => {
              onFilterChange('floor', '');
              onFilterChange('category', '');
            }}
            className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-lg transition-colors"
          >
            Clear All Filters
          </button>
        )}
      </aside>
    </>
  );
};

export default FilterSidebar;