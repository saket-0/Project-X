import React, { useState, useEffect, useCallback, useRef } from 'react'; // Added useRef
import axios from 'axios';
import { Search, BookOpen, SlidersHorizontal, ServerCrash, X, Settings2, RotateCcw } from 'lucide-react'; 
import BookList from './components/BookList';
import BookDetail from './components/BookDetail';
import FilterSidebar from './components/FilterSidebar';
import Pagination from './components/Pagination'; 

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';

function App() {
  const [books, setBooks] = useState([]);
  const [facets, setFacets] = useState({ authors: [], pubs: [], floors: [], racks: [], cols: [], accessionTypes: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [limit, setLimit] = useState(50);
  
  // Advanced Search State
  const [searchOptions, setSearchOptions] = useState({
    fields: {
        title: true,
        author: true,
        publisher: false,
        tags: false
    },
    exact: false
  });
  const [showSearchOpts, setShowSearchOpts] = useState(false);
  
  // --- NEW: Ref for Click Outside Detection ---
  const searchContainerRef = useRef(null);

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  
  const [filters, setFilters] = useState({
    availableOnly: false,
    authors: [],
    pubs: [],
    floors: [], 
    racks: [],  
    cols: [],
    accessionTypes: []
  });

  const debouncedSearch = useDebounce(searchTerm, 500);

  // --- NEW: Effect to handle clicking outside ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If the menu is open AND the click is NOT inside the container, close it
      if (showSearchOpts && searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearchOpts(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchOpts]);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const activeFields = Object.keys(searchOptions.fields)
         .filter(key => searchOptions.fields[key])
         .join(',');

      const params = {
        page: page,
        limit: limit,
        search: debouncedSearch,
        searchFields: activeFields || 'title,author',
        exactMatch: searchOptions.exact,
        availableOnly: filters.availableOnly,
        authors: filters.authors,
        pubs: filters.pubs,
        floors: filters.floors,
        racks: filters.racks,
        cols: filters.cols,
        accessionTypes: filters.accessionTypes
      };

      const res = await axios.get(`${API_BASE}/api/books`, { params });
      
      setBooks(res.data.data || []);
      
      if (res.data.facets) {
          setFacets(prevFacets => {
            const nextFacets = { ...res.data.facets };
            if (filters.authors.length > 0) nextFacets.authors = prevFacets.authors;
            if (filters.pubs.length > 0) nextFacets.pubs = prevFacets.pubs;
            if (filters.floors.length > 0) nextFacets.floors = prevFacets.floors;
            if (filters.accessionTypes.length > 0) nextFacets.accessionTypes = prevFacets.accessionTypes;
            return nextFacets;
          });
      }
      
      setTotalPages(res.data.meta.totalPages || 0);
      setTotalResults(res.data.meta.totalResults || 0);
    } catch (err) {
      console.error("Failed to fetch books", err);
      setError("Could not connect to Library Server.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, filters, limit, searchOptions]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters, limit, searchOptions]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleFilterChange = (category, value) => {
    if (category === 'availableOnly') {
      setFilters(prev => ({ ...prev, availableOnly: value }));
    } else {
      setFilters(prev => {
        const current = prev[category] || [];
        const updated = current.includes(value)
          ? current.filter(item => item !== value)
          : [...current, value];
        return { ...prev, [category]: updated };
      });
    }
  };

  const clearFilters = () => {
    setFilters({ availableOnly: false, authors: [], pubs: [], floors: [], racks: [], cols: [], accessionTypes: [] });
  };

  const clearSearch = () => {
    setSearchTerm('');
    setPage(1);
  };
  
  const toggleField = (field) => {
      setSearchOptions(prev => ({
          ...prev,
          fields: {
              ...prev.fields,
              [field]: !prev.fields[field]
          }
      }));
  };

  const resetSearchOptions = () => {
      setSearchOptions({
        fields: { title: true, author: true, publisher: false, tags: false },
        exact: false
      });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-20 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setSelectedBook(null)}
            >
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <BookOpen className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Project X Library</h1>
            </div>
            
            {!selectedBook && (
              // ATTACHED REF HERE
              <div 
                ref={searchContainerRef}
                className="relative flex flex-col w-full md:w-auto"
              >
                <div className="flex gap-3 w-full md:w-auto">
                    <button 
                        className="md:hidden p-2.5 bg-gray-100 rounded-xl hover:bg-gray-200"
                        onClick={() => setShowMobileFilters(!showMobileFilters)}
                    >
                        <SlidersHorizontal className="w-5 h-5 text-gray-600" />
                    </button>
                    
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                            type="text"
                            placeholder="Search..."
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-all"><X className="w-4 h-4" /></button>
                        )}
                    </div>
                    
                    <button 
                        onClick={() => setShowSearchOpts(!showSearchOpts)}
                        className={`p-2.5 rounded-xl border transition-all ${showSearchOpts ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                        title="Search Settings"
                    >
                        <Settings2 className="w-5 h-5" />
                    </button>
                </div>

                {showSearchOpts && (
                    <div className="absolute top-full right-0 mt-2 z-50 w-full md:w-auto md:min-w-max bg-white border border-gray-200 rounded-lg p-3 shadow-xl text-sm flex flex-col md:flex-row md:items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-600 text-xs uppercase tracking-wide">Search In:</span>
                            <div className="flex flex-wrap gap-2">
                                {['title', 'author', 'publisher', 'tags'].map(field => (
                                    <button
                                        key={field}
                                        onClick={() => toggleField(field)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                                            searchOptions.fields[field] 
                                                ? 'bg-blue-100 text-blue-700 border-blue-200' 
                                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        {field.charAt(0).toUpperCase() + field.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="w-px h-4 bg-gray-200 hidden md:block"></div>

                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input 
                                    type="checkbox" 
                                    checked={searchOptions.exact}
                                    onChange={(e) => setSearchOptions(prev => ({ ...prev, exact: e.target.checked }))}
                                    className="accent-blue-600 w-4 h-4"
                                />
                                <span className="text-gray-700">Exact Match</span>
                            </label>

                            <button 
                                onClick={resetSearchOptions}
                                className="flex items-center gap-1 text-gray-400 hover:text-red-500 text-xs font-medium ml-auto md:ml-0"
                            >
                                <RotateCcw className="w-3 h-3" /> Reset
                            </button>
                        </div>
                    </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {error ? (
           <div className="flex flex-col items-center justify-center py-20 text-center">
             <ServerCrash className="w-16 h-16 text-red-400 mb-4" />
             <h3 className="text-xl font-bold text-gray-900">System Error</h3>
             <p className="text-gray-500 mt-2">{error}</p>
             <button onClick={() => window.location.reload()} className="mt-4 text-blue-600 hover:underline">Reload</button>
           </div>
        ) : selectedBook ? (
          <BookDetail book={selectedBook} onBack={() => setSelectedBook(null)} />
        ) : (
          <div className="flex flex-col md:flex-row gap-8 items-start relative">
            <aside className={`w-full md:w-64 flex-shrink-0 sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent ${showMobileFilters ? 'block' : 'hidden md:block'}`}>
              <FilterSidebar 
                facets={facets} 
                selectedFilters={filters} 
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
              />
            </aside>
            <div className="flex-1 w-full min-w-0">
              <div className="mb-6 flex flex-col sm:flex-row justify-between items-end gap-4">
                 <div>
                   <h2 className="text-2xl font-bold text-gray-900">Library Catalog</h2>
                   <p className="text-gray-500 text-sm mt-1">
                     Showing {totalResults} results 
                     {searchTerm && ` for "${searchTerm}"`}
                   </p>
                 </div>
                 <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 font-medium whitespace-nowrap">Rows per page:</label>
                    <select 
                      value={limit} 
                      onChange={(e) => setLimit(Number(e.target.value))}
                      className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none cursor-pointer hover:border-blue-400 transition-colors"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                 </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                  <p className="text-gray-400 animate-pulse">Scanning Shelves...</p>
                </div>
              ) : (
                <>
                  <BookList books={books} onBookClick={setSelectedBook} />
                  {books.length > 0 && (
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;