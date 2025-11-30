import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Search, BookOpen, SlidersHorizontal, ServerCrash, X } from 'lucide-react'; // Added 'X'
import BookList from './components/BookList';
import BookDetail from './components/BookDetail';
import FilterSidebar from './components/FilterSidebar';
import Pagination from './components/Pagination'; // Import the new component

// Simple Debounce Hook
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
  // Data State
  const [books, setBooks] = useState([]);
  const [facets, setFacets] = useState({ authors: [], pubs: [], floors: [], racks: [], cols: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Pagination & Search State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  
  // UI State
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  
  // Filter State
  const [filters, setFilters] = useState({
    availableOnly: false,
    authors: [],
    pubs: [],
    floors: [], 
    racks: [],  
    cols: []    
  });

  const debouncedSearch = useDebounce(searchTerm, 500);

  // --- FETCH LOGIC ---
  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: page,
        limit: 50,
        search: debouncedSearch,
        availableOnly: filters.availableOnly,
        authors: filters.authors,
        pubs: filters.pubs,
        floors: filters.floors,
        racks: filters.racks,
        cols: filters.cols
      };

      const res = await axios.get(`${API_BASE}/api/books`, { params });
      
      setBooks(res.data.data || []);
      
      // --- FIX APPLIED HERE ---
      // We implement "Sticky Facets": If a filter category is active, we ignore 
      // the narrowed list from the server and keep the previous full list.
      if (res.data.facets) {
          setFacets(prevFacets => {
            const nextFacets = { ...res.data.facets };

            // Fix for Authors
            if (filters.authors.length > 0) nextFacets.authors = prevFacets.authors;
            
            // Fix for Publications (pubs)
            if (filters.pubs.length > 0) nextFacets.pubs = prevFacets.pubs;
            
            // Fix for Location filters (Floors, Racks, Cols)
            if (filters.floors.length > 0) nextFacets.floors = prevFacets.floors;
            if (filters.racks.length > 0) nextFacets.racks = prevFacets.racks;
            if (filters.cols.length > 0) nextFacets.cols = prevFacets.cols;

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
  }, [debouncedSearch, page, filters]); 

  // --- EFFECTS ---
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // --- HANDLERS ---
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
    setFilters({ availableOnly: false, authors: [], pubs: [], floors: [], racks: [], cols: [] });
  };

  // New: Clear Search Handler
  const clearSearch = () => {
    setSearchTerm('');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-20">
      {/* Header */}
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
              <div className="flex gap-3 w-full md:w-auto">
                <button 
                  className="md:hidden p-2.5 bg-gray-100 rounded-xl hover:bg-gray-200"
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                >
                  <SlidersHorizontal className="w-5 h-5 text-gray-600" />
                </button>
                
                {/* SEARCH BAR WITH CLEAR BUTTON */}
                <div className="relative w-full md:w-96 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text"
                    placeholder="Search by Title, Author..."
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button 
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
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
          <BookDetail 
            book={selectedBook} 
            onBack={() => setSelectedBook(null)} 
          />
        ) : (
          <div className="flex flex-col md:flex-row gap-8 items-start relative">
            
            <aside className={`
              w-full md:w-64 flex-shrink-0 sticky top-24 h-[calc(100vh-8rem)] 
              overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent
              ${showMobileFilters ? 'block' : 'hidden md:block'}
            `}>
              <FilterSidebar 
                facets={facets} 
                selectedFilters={filters} 
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
              />
            </aside>

            <div className="flex-1 w-full min-w-0">
              <div className="mb-6 flex justify-between items-end">
                 <div>
                   <h2 className="text-2xl font-bold text-gray-900">Library Catalog</h2>
                   <p className="text-gray-500 text-sm mt-1">
                     Showing {totalResults} results 
                     {searchTerm && ` for "${searchTerm}"`}
                   </p>
                 </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                  <p className="text-gray-400 animate-pulse">Scanning Shelves...</p>
                </div>
              ) : (
                <>
                  <BookList 
                    books={books} 
                    onBookClick={setSelectedBook} 
                  />
                  
                  {/* NEW PAGINATION COMPONENT */}
                  {books.length > 0 && (
                    <Pagination 
                      currentPage={page}
                      totalPages={totalPages}
                      onPageChange={(p) => setPage(p)}
                    />
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