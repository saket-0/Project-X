import React, { useState, useMemo } from 'react';
import { Search, BookOpen, ChevronLeft, ChevronRight, SlidersHorizontal, ServerCrash } from 'lucide-react';
import BookList from './components/BookList';
import BookDetail from './components/BookDetail';
import FilterSidebar from './components/FilterSidebar';
import { useBooks } from './hooks/useBooks'; // Import the new hook

// Simple Debounce for Input
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

function App() {
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
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

  // USE THE HOOK - Pass search and filters to the backend!
  const { books, loading, error, pagination, goToPage } = useBooks(debouncedSearch, filters);

  // Facet Logic
  // Ideally, facets should also come from the API (e.g. /api/facets). 
  // For now, we derive them from the CURRENT books to keep the UI working without a new API endpoint.
  // Note: This will only show filters for books currently visible. 
  const facets = useMemo(() => {
    const authors = new Set();
    const pubs = new Set();
    const floors = new Set();
    const racks = new Set();

    books.forEach(b => {
      if(b.author) authors.add(b.author);
      if(b.publisher) pubs.add(b.publisher);
      // Use the pre-parsed location from the server!
      if (b.parsedLocation) {
        floors.add(b.parsedLocation.floorLabel); 
        racks.add(b.parsedLocation.rack);        
      }
    });

    return {
      authors: Array.from(authors).sort(),
      pubs: Array.from(pubs).sort(),
      floors: Array.from(floors).sort(),
      racks: Array.from(racks).sort((a, b) => a - b),
      cols: [] // Simplified for now
    };
  }, [books]);

  const handleFilterChange = (category, value) => {
    setFilters(prev => {
      if (category === 'availableOnly') return { ...prev, availableOnly: value };
      
      const current = prev[category];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
  };

  const clearFilters = () => {
    setFilters({ availableOnly: false, authors: [], pubs: [], floors: [], racks: [], cols: [] });
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
                
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    type="text"
                    placeholder="Search by Title, Author or Topic..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
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
            <h3 className="text-xl font-bold text-gray-900">Connection Error</h3>
            <p className="text-gray-500 mt-2 max-w-md">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry Connection
            </button>
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
                     Showing {books.length} results 
                     {searchTerm && ` for "${searchTerm}"`}
                   </p>
                 </div>
                 <span className="text-xs font-medium bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                   Page {pagination.page} of {pagination.totalPages || 1}
                 </span>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                  <p className="text-gray-400 animate-pulse">Scanning Shelves...</p>
                </div>
              ) : (
                <BookList 
                  books={books} 
                  onBookClick={setSelectedBook} 
                />
              )}

              {!loading && books.length > 0 && (
                <div className="mt-10 flex justify-center gap-3">
                  <button 
                    disabled={pagination.page === 1}
                    onClick={() => goToPage(pagination.page - 1)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm font-medium text-gray-700"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <button 
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => goToPage(pagination.page + 1)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm font-medium text-gray-700"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;