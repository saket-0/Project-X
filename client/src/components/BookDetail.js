import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Map, Tag, BookOpen, AlertCircle } from 'lucide-react';

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. DEADLOCK PREVENTION: Check ID validity immediately
    if (!id || id === 'undefined' || id === 'null') {
        setError("Invalid Book ID. Please go back and try again.");
        setLoading(false); // <--- STOP THE SPINNER
        return;
    }

    const fetchDetail = async () => {
      try {
        setLoading(true);
        // 2. Fetch Data
        const res = await axios.get(`http://localhost:5001/api/books/${id}`);
        if(res.data.success) {
            setBook(res.data.data);
            setError(null);
        }
      } catch (err) {
        console.error("Detail Error", err);
        setError("Could not load book details. Is the server running?");
      } finally {
        setLoading(false); // <--- ALWAYS RUNS
      }
    };

    fetchDetail();
  }, [id]);

  // --- RENDER STATES ---
  if (loading) return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-500">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p>Loading Library Card...</p>
      </div>
  );

  if (error || !book) return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-500 p-4">
          <AlertCircle className="w-12 h-12 mb-2" />
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="mb-6">{error || "Book not found."}</p>
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            Return to Library
          </button>
      </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-indigo-600 mb-6 font-medium transition-colors">
        <ArrowLeft className="w-5 h-5 mr-2" /> Back
      </button>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 flex flex-col md:flex-row">
        {/* Left: Key Info */}
        <div className="w-full md:w-2/3 p-8 border-b md:border-b-0 md:border-r border-gray-100">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{book.title}</h1>
                    <p className="text-xl text-indigo-600 font-medium mb-6">{book.author}</p>
                </div>
                <div className="text-right">
                    <span className="block text-4xl font-black text-gray-100">{book.floor || "N/A"}</span>
                    <span className="text-xs text-gray-400 uppercase tracking-widest">Floor</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-y-6 gap-x-8 mt-6">
                <div><span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Publisher</span><p>{book.publisher}</p></div>
                <div><span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Year</span><p>{book.year || 'N/A'}</p></div>
                <div><span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Category</span><p>{book.category}</p></div>
                <div><span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Status</span><p>{book.status}</p></div>
            </div>
        </div>

        {/* Right: ID & Metadata */}
        <div className="w-full md:w-1/3 bg-gray-50 p-8 flex flex-col justify-center items-center text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mb-4" />
            <div className="space-y-2">
                <div className="text-sm text-gray-500">System ID</div>
                <div className="font-mono bg-white border border-gray-200 px-3 py-1 rounded text-gray-700 select-all">
                    {book._id || book.libraryId}
                </div>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-200 w-full">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    <Map className="w-3 h-3 mr-1" />
                    {book.parsedLocation?.display || book.shelfCode || "Shelf Unknown"}
                </span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetail;