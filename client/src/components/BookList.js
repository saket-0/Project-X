import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Layers, Monitor, Disc } from 'lucide-react';
import ResponsiveItem from './ResponsiveItem'; 

const BookList = ({ books, loading }) => {
  const navigate = useNavigate();

  if (loading) return <div className="p-10 text-center animate-pulse">Loading library data...</div>;
  if (!books || books.length === 0) return <div className="p-10 text-center text-gray-500">No books found.</div>;

  return (
    <div className="space-y-3 pb-20">
      {books.map((book, index) => {
        // Safe Accessor Logic
        const accType = (book.accessionType || '').toUpperCase();
        let LocationIcon = accType.includes('E-BOOK') ? Monitor : (accType.includes('CD') ? Disc : MapPin);
        let shelfDisplay = book.location || book.shelf || "N/A";

        // Determine the Best ID to use
        // 1. _id (MongoDB ID) - Best
        // 2. libraryId (Numeric) - Fallback
        const validId = book._id || book.libraryId;

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
            
            title={book.title || 'Untitled'}
            subtitle={book.author || 'Unknown Author'}
            tertiary={book.publisher}
            tags={book.tags ? book.tags.slice(0, 3) : []}
            
            stats={[
              { icon: Layers, value: `${book.totalCopies || 1} Copies`, subLabel: 'Available' },
              { icon: LocationIcon, value: shelfDisplay, subLabel: 'Location' }
            ]}
            status={{
              isPositive: (book.status || '').toLowerCase().includes('available'),
              label: book.status || 'Unknown'
            }}
          />
        );
      })}
    </div>
  );
};

export default BookList;