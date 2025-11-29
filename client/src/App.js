import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Search, BookOpen, MapPin, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';

// Simple debounce hook to prevent API spamming
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

  const debouncedSearch = useDebounce(searchTerm, 500); // Wait 500ms after typing stops

  const fetchBooks = useCallback(async (searchQuery, pageNum) => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5001/api/books`, {
        params: { search: searchQuery, page: pageNum, limit: 18 }
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

  // Effect: Fetch when search term changes (reset to page 1)
  useEffect(() => {
    setPage(1);
    fetchBooks(debouncedSearch, 1);
  }, [debouncedSearch, fetchBooks]);

  // Effect: Fetch when page changes
  useEffect(() => {
    fetchBooks(debouncedSearch, page);
  }, [page, fetchBooks, debouncedSearch]); // Added debouncedSearch here to keep state consistent

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="text-blue-600 w-8 h-8" />
              <h1 className="text-2xl font-bold text-gray-900">Project X Library</h1>
            </div>
            
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input 
                type="text"
                placeholder="Search Title, Author..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-4 text-sm text-gray-500 flex justify-between items-center">
           <span>Found {totalResults} books</span>
           <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">Page {page} of {totalPages}</span>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {books.map((book, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100 flex flex-col">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 leading-tight mb-2 line-clamp-2">
                    {book.Title || "Untitled"}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">{book.Author || "Unknown"}</p>
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center justify-between">
                       <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">CALL</span>
                       <span>{book.CallNo}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                  <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
                    <MapPin className="w-3 h-3" /> {book.Shelf || "N/A"}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${book.Status?.includes('Available') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {book.Status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        <div className="mt-8 flex justify-center gap-4">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <button 
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;