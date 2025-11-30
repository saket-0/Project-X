import React from 'react';
import { Filter, Check, MapPin, User, Book, Layers, Grid3X3, X } from 'lucide-react';

// Sub-component for individual filter groups (Authors, Floors, etc.)
const FilterGroup = ({ title, options, selected, onChange, icon: Icon, variant = 'list' }) => {
  if (!options || options.length === 0) return null;

  const isGrid = variant === 'grid';

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className="w-3.5 h-3.5 text-blue-600" />}
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
          {title}
        </h3>
      </div>
      
      {isGrid ? (
        /* Grid Layout for Rack Numbers */
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => {
            const isSelected = selected.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => onChange(opt)}
                className={`
                  w-11 h-9 text-xs font-medium rounded border transition-all
                  flex items-center justify-center flex-shrink-0
                  ${isSelected 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                    : 'bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'}
                `}
                title={`Rack ${opt}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      ) : (
        /* List Layout for Authors, Floors, etc. */
        <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 pr-1">
          {options.map((opt) => {
            const isSelected = selected.includes(opt);
            return (
              <label 
                key={opt} 
                className={`flex items-center gap-3 cursor-pointer group text-sm transition-all ${isSelected ? 'text-blue-700 font-medium' : 'text-gray-600'}`}
              >
                <div 
                  className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all flex-shrink-0
                    ${isSelected ? 'bg-blue-600 border-blue-600 scale-110' : 'bg-white border-gray-300 group-hover:border-blue-400'}`}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden"
                  checked={isSelected}
                  onChange={() => onChange(opt)}
                />
                <span className="truncate leading-snug">{opt}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};

const FilterSidebar = ({ facets, selectedFilters, onFilterChange, onClearFilters }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 min-h-full">
      
      {/* Header with Clear Button */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <h2 className="font-bold text-gray-900">Filters</h2>
        </div>
        
        <button 
          onClick={onClearFilters}
          className="group flex items-center gap-1 px-2 py-1 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all text-xs font-medium"
          title="Reset all filters"
        >
          <X className="w-3 h-3 group-hover:rotate-90 transition-transform" />
          <span>Clear</span>
        </button>
      </div>

      {/* Availability Filter */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Status</h3>
        <label className="flex items-center gap-3 cursor-pointer text-sm text-gray-700 group">
          <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all flex-shrink-0 ${selectedFilters.availableOnly ? 'bg-green-600 border-green-600' : 'bg-white border-gray-300 group-hover:border-green-500'}`}>
            {selectedFilters.availableOnly && <Check className="w-3 h-3 text-white" />}
          </div>
          <input 
            type="checkbox" 
            className="hidden"
            checked={selectedFilters.availableOnly}
            onChange={() => onFilterChange('availableOnly', !selectedFilters.availableOnly)}
          />
          <span className={selectedFilters.availableOnly ? "text-green-700 font-medium" : ""}>
            Available Books Only
          </span>
        </label>
      </div>

      {/* Location Section */}
      <div className="mb-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-blue-600" />
          <h2 className="font-bold text-gray-800 text-sm">Location</h2>
        </div>

        <FilterGroup 
          title="Floor" 
          options={facets.floors} 
          selected={selectedFilters.floors}
          onChange={(val) => onFilterChange('floors', val)}
          icon={Layers}
          variant="list"
        />

        <FilterGroup 
          title="Rack Number" 
          options={facets.racks} 
          selected={selectedFilters.racks}
          onChange={(val) => onFilterChange('racks', val)}
          variant="grid" 
          icon={Grid3X3}
        />
      </div>

      {/* Metadata Section */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Book className="w-4 h-4 text-blue-600" />
          <h2 className="font-bold text-gray-800 text-sm">Details</h2>
        </div>

        <FilterGroup 
          title="Authors" 
          options={facets.authors} 
          selected={selectedFilters.authors}
          onChange={(val) => onFilterChange('authors', val)}
          icon={User}
        />
        
        <FilterGroup 
          title="Publications" 
          options={facets.pubs} 
          selected={selectedFilters.pubs}
          onChange={(val) => onFilterChange('pubs', val)}
        />
      </div>
    </div>
  );
};

export default FilterSidebar;