import React from 'react';
import ResponsiveItem from './ResponsiveItem';
import { useNavigate } from 'react-router-dom';

const BookList = ({ books, loading }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl w-full"></div>
        ))}
      </div>
    );
  }

  if (!books || books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-dashed border-gray-300">
        <div className="bg-gray-50 p-4 rounded-full mb-4">
            <span className="text-4xl">🔍</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900">No books found</h3>
        <p className="text-gray-500 max-w-sm mt-2">
          Try adjusting your search terms or clearing the filters to see more results.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 pb-20">
      {books.map((book) => (
        <ResponsiveItem 
          key={book._id} 
          data={book} 
          // --- FIX IS HERE ---
          // Use _id (MongoDB ID) because it is ALWAYS present.
          // Your backend's "Strategy 2" knows how to handle this!
          onClick={() => {
            console.log("Navigating to book:", book._id); // Debug log for you
            navigate(`/book/${book._id}`);
          }} 
        />
      ))}
    </div>
  );
};

export default BookList;