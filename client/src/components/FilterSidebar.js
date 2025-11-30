import React from 'react';
import { Filter, Check, MapPin } from 'lucide-react';

const FilterGroup = ({ title, options, selected, onChange }) => {
  if (!options || options.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
        {title}
      </h3>
      <div className="space-y-2">
        {options.map((opt) => {
          const isSelected = selected.includes(opt);
          return (
            <label 
              key={opt} 
              className={`flex items-center gap-2 cursor-pointer group text-sm ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}
            >
              <div 
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0
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
              <span className="truncate leading-snug">{opt}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

const FilterSidebar = ({ facets, selectedFilters, onFilterChange }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
        <Filter className="w-4 h-4 text-blue-600" />
        <h2 className="font-bold text-gray-800">Filters</h2>
      </div>

      {/* Availability Filter */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Status</h3>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${selectedFilters.availableOnly ? 'bg-green-600 border-green-600' : 'bg-white border-gray-300'}`}>
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

      {/* Metadata Filters */}
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

      {/* Location Section */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-blue-600" />
          <h2 className="font-bold text-gray-800 text-sm">Location Details</h2>
        </div>

        <FilterGroup 
          title="Floor" 
          options={facets.floors} 
          selected={selectedFilters.floors}
          onChange={(val) => onFilterChange('floors', val)}
        />

        <FilterGroup 
          title="Rack Number" 
          options={facets.racks} 
          selected={selectedFilters.racks}
          onChange={(val) => onFilterChange('racks', val)}
        />

        <FilterGroup 
          title="Column" 
          options={facets.cols} 
          selected={selectedFilters.cols}
          onChange={(val) => onFilterChange('cols', val)}
        />
      </div>
    </div>
  );
};

export default FilterSidebar;