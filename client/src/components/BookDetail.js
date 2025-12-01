import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Map, Tag } from 'lucide-react';

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        console.log("Fetching detail for ID:", id); // Debug Log
        const res = await axios.get(`http://localhost:5001/api/books/${id}`);
        if(res.data.success) setBook(res.data.data);
      } catch (err) {
        console.error("Detail Error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading details...</div>;
  if (!book) return <div className="p-8 text-center text-red-500">Book not found.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-indigo-600 mb-6 font-medium transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-2" /> Back to Library
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
                <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Publisher</span>
                    <p className="font-medium text-gray-800">{book.publisher}</p>
                </div>
                <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Year</span>
                    <p className="font-medium text-gray-800">{book.year || 'N/A'}</p>
                </div>
                <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Category</span>
                    <p className="font-medium text-gray-800">{book.category}</p>
                </div>
                <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Pages</span>
                    <p className="font-medium text-gray-800">{book.pages || 'N/A'}</p>
                </div>
            </div>

            <div className="mt-10 pt-6 border-t border-gray-100">
                 <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                    <Tag className="w-4 h-4 mr-2 text-indigo-500"/>
                    System Metadata
                 </h3>
                 <div className="flex flex-wrap gap-2 text-xs text-gray-500 font-mono">
                    {/* Display Library ID if available, otherwise just use the DB ID */}
                    <span className="bg-gray-100 px-2 py-1 rounded">ID: {book.libraryId || book._id}</span>
                    <span className="bg-gray-100 px-2 py-1 rounded">ISBN: {book.isbn || 'N/A'}</span>
                    <span className="bg-gray-100 px-2 py-1 rounded">Vendor: {book.vendor || 'N/A'}</span>
                 </div>
            </div>
        </div>

        {/* Right: Action & Status */}
        <div className="w-full md:w-1/3 bg-gray-50 p-8 flex flex-col justify-between">
            <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Availability Status</h3>
                
                <div className={`p-4 rounded-xl border ${
                    book.statusColor === 'green' ? 'bg-green-100 border-green-200 text-green-800' :
                    book.statusColor === 'orange' ? 'bg-orange-100 border-orange-200 text-orange-800' : 
                    'bg-red-100 border-red-200 text-red-800'
                }`}>
                    <div className="flex items-center font-bold text-lg mb-1">
                        {book.statusColor === 'green' ? '● Available' : '● Checked Out'}
                    </div>
                    <p className="text-sm opacity-90">{book.derivedStatus}</p>
                </div>

                <div className="mt-8 space-y-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 border-b border-gray-200 pb-2">
                        <span>Shelf Location</span>
                        <span className="font-mono font-bold text-gray-900">{book.shelfCode || "Unknown"}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600 border-b border-gray-200 pb-2">
                        <span>Row</span>
                        <span className="font-bold text-gray-900">{book.row || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Rack / Shelf</span>
                        <span className="font-bold text-gray-900">{book.rack || "-"}</span>
                    </div>
                </div>
            </div>

            <button className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center">
                <Map className="w-5 h-5 mr-2" />
                Locate on Map
            </button>
        </div>
      </div>
    </div>
  );
};

export default BookDetail;