import React from 'react';
import { useNavigate } from 'react-router-dom';
// REMOVED: import { MapPin, Layers, Monitor, Disc } from 'lucide-react'; 
import ResponsiveItem from './ResponsiveItem'; 

const BookList = ({ books, loading }) => {
  const navigate = useNavigate();

  if (loading) return <div className="p-10 text-center animate-pulse">Loading library data...</div>;
  if (!books || books.length === 0) return <div className="p-10 text-center text-gray-500">No books found.</div>;

  return (
    <div className="space-y-3 pb-20">
      {books.map((book, index) => {
        
        // Determine the Best ID to use
        const validId = book._id || book.libraryId;

        // Prepare the data object specifically for ResponsiveItem
        const itemData = {
            ...book,
            locationDisplay: book.location || book.shelf || "N/A" 
        };

        return (
          <ResponsiveItem
            key={validId || index}
            onClick={() => {
                if (validId) {
                    navigate(`/book/${validId}`);
                } else {
                    console.error("Book has no ID:", book);
                    alert("System Error: This book has no valid ID. Please report to admin.");
                }
            }}
            data={itemData}
          />
        );
      })}
    </div>
  );
};

export default BookList;