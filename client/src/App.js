import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Search, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import BookList from './components/BookList';
import BookDetail from './components/BookDetail';

// Debounce Hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

function App() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  
  // Selection State
  const [selectedBookGroup, setSelectedBookGroup] = useState(null);

  const debouncedSearch = useDebounce(searchTerm, 500);

  const fetchBooks = useCallback(async (searchQuery, pageNum) => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5001/api/books`, {
        params: { search: searchQuery, page: pageNum, limit: 10 } // Lower limit for list view
      });
      setBooks(res.data.data);
      setTotalPages(res.data.meta.totalPages);
      setTotalResults(res.data.meta.totalResults);
    } catch (err) {
      console.error("Failed to fetch books", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset to page 1 on new search
  useEffect(() => {
    setPage(1);
    fetchBooks(debouncedSearch, 1);
  }, [debouncedSearch, fetchBooks]);

  // Fetch on page change
  useEffect(() => {
    fetchBooks(debouncedSearch, page);
  }, [page, fetchBooks, debouncedSearch]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-20">
      {/* Sticky Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setSelectedBookGroup(null)}
            >
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <BookOpen className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Project X Library</h1>
            </div>
            
            {/* Only show search if not in detail view */}
            {!selectedBookGroup && (
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text"
                  placeholder="Search by Title or Author..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        
        {selectedBookGroup ? (
          // --- Detail View ---
          <BookDetail 
            bookGroup={selectedBookGroup} 
            onBack={() => setSelectedBookGroup(null)} 
          />
        ) : (
          // --- List View ---
          <>
            <div className="mb-6 flex justify-between items-end">
               <div>
                 <h2 className="text-2xl font-bold text-gray-900">Library Catalog</h2>
                 <p className="text-gray-500 text-sm mt-1">Showing {books.length} distinct titles from {totalResults} total</p>
               </div>
               <span className="text-xs font-medium bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                 Page {page} of {totalPages}
               </span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                <p className="text-gray-400 animate-pulse">Searching catalog...</p>
              </div>
            ) : (
              <BookList 
                books={books} 
                onBookClick={setSelectedBookGroup} 
              />
            )}

            {/* Pagination */}
            {!loading && books.length > 0 && (
              <div className="mt-10 flex justify-center gap-3">
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm font-medium text-gray-700"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <button 
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm font-medium text-gray-700"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;