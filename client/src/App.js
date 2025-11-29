import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, BookOpen, MapPin, CheckCircle, XCircle } from 'lucide-react';

function App() {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch data from our Node.js server
  useEffect(() => {
    axios.get('http://localhost:5000/api/books')
      .then(response => {
        setBooks(response.data.data);
        setFilteredBooks(response.data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching books", err);
        setLoading(false);
      });
  }, []);

  // Handle Search
  useEffect(() => {
    const lowerTerm = searchTerm.toLowerCase();
    const results = books.filter(book => 
      (book.Title && book.Title.toLowerCase().includes(lowerTerm)) ||
      (book.Author && book.Author.toLowerCase().includes(lowerTerm)) ||
      (book.Pub && book.Pub.toLowerCase().includes(lowerTerm))
    );
    setFilteredBooks(results);
  }, [searchTerm, books]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="text-blue-600 w-8 h-8" />
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">College Library</h1>
            </div>
            
            {/* Search Bar */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input 
                type="text"
                placeholder="Search by Title, Author, or Publisher..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Scanning library shelves...</p>
          </div>
        ) : (
          <>
            <div className="mb-6 text-sm text-gray-500">
              Showing {filteredBooks.length} results
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredBooks.slice(0, 100).map((book, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100 flex flex-col">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 leading-tight mb-2 line-clamp-2">
                      {book.Title || "Untitled"}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">{book.Author || "Unknown Author"}</p>
                    
                    <div className="space-y-2 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                         <span className="font-medium bg-gray-100 px-2 py-0.5 rounded text-xs">PUB</span>
                         <span className="truncate">{book.Pub}</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="font-medium bg-gray-100 px-2 py-0.5 rounded text-xs">CALL</span>
                         <span>{book.CallNo}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                      <MapPin className="w-4 h-4" />
                      {book.Shelf || "N/A"}
                    </div>
                    
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      book.Status?.includes('Available') 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {book.Status?.includes('Available') ? <CheckCircle className="w-3 h-3"/> : <XCircle className="w-3 h-3"/>}
                      {book.Status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredBooks.length === 0 && (
               <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                 <p className="text-gray-500">No books found matching "{searchTerm}"</p>
               </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;