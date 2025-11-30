import React from 'react';
import { Filter, Check } from 'lucide-react';

const FilterGroup = ({ title, options, selected, onChange }) => {
  if (!options || options.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
        {title}
      </h3>
      <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
        {options.map((opt) => {
          const isSelected = selected.includes(opt);
          return (
            <label 
              key={opt} 
              className={`flex items-center gap-2 cursor-pointer group text-sm ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}
            >
              <div 
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors
                  ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300 group-hover:border-blue-400'}`}
              >
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </div>
              <input 
                type="checkbox" 
                className="hidden"
                checked={isSelected}
                onChange={() => onChange(opt)}
              />
              <span className="truncate">{opt}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

const FilterSidebar = ({ facets, selectedFilters, onFilterChange }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 h-fit sticky top-24">
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
        <Filter className="w-4 h-4 text-blue-600" />
        <h2 className="font-bold text-gray-800">Filters</h2>
      </div>

      {/* Availability Filter (Static) */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Status</h3>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedFilters.availableOnly ? 'bg-green-600 border-green-600' : 'bg-white border-gray-300'}`}>
            {selectedFilters.availableOnly && <Check className="w-3 h-3 text-white" />}
          </div>
          <input 
            type="checkbox" 
            className="hidden"
            checked={selectedFilters.availableOnly}
            onChange={() => onFilterChange('availableOnly', !selectedFilters.availableOnly)}
          />
          <span>Show Available Only</span>
        </label>
      </div>

      {/* Dynamic Filters */}
      <FilterGroup 
        title="Authors" 
        options={facets.authors} 
        selected={selectedFilters.authors}
        onChange={(val) => onFilterChange('authors', val)}
      />
      
      <FilterGroup 
        title="Publications" 
        options={facets.pubs} 
        selected={selectedFilters.pubs}
        onChange={(val) => onFilterChange('pubs', val)}
      />

      <FilterGroup 
        title="Locations" 
        options={facets.shelves} 
        selected={selectedFilters.shelves}
        onChange={(val) => onFilterChange('shelves', val)}
      />
    </div>
  );
};

export default FilterSidebar;