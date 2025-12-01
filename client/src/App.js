import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Search, Menu } from 'lucide-react';
import { useBooks } from './hooks/useBooks';

// Components
import FilterSidebar from './components/FilterSidebar';
import BookList from './components/BookList';
import BookDetail from './components/BookDetail';

const HomePage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { 
    books, loading, search, setSearch, 
    filters, setFilters, page, setPage, meta 
  } = useBooks();

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to page 1 on filter change
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen items-start max-w-7xl mx-auto px-4 gap-8 pt-6">
      
      {/* Sidebar - Passed Dynamic Facets from API */}
      <FilterSidebar 
        facets={meta.facets} 
        selectedFilters={filters} 
        onFilterChange={handleFilterChange}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 w-full min-w-0">
        {/* Header / Search Bar */}
        <div className="sticky top-0 bg-gray-50 pt-2 pb-6 z-10">
          <div className="flex items-center gap-3 mb-4 md:mb-6">
             <button 
               className="md:hidden p-2 bg-white border border-gray-200 rounded-lg"
               onClick={() => setSidebarOpen(true)}
             >
               <Menu className="w-5 h-5 text-gray-600" />
             </button>
             <h1 className="text-2xl font-bold text-gray-900">Library Catalog</h1>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by title, author, or ISBN..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Results Area */}
        <div className="min-h-[60vh]">
            <div className="mb-4 text-sm text-gray-500 flex justify-between items-center">
                <span>Found {meta.total || 0} results</span>
                <span className="bg-gray-200 px-2 py-1 rounded text-xs font-bold text-gray-600">Page {page}</span>
            </div>
            
            <BookList books={books} loading={loading} />
        </div>

        {/* Pagination Controls */}
        {!loading && books.length > 0 && (
          <div className="flex justify-center gap-4 py-8">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <button 
              disabled={page >= meta.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/book/:id" element={<BookDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;