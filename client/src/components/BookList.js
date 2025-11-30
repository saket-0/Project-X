import React from 'react';
import { MapPin, Layers } from 'lucide-react';
import ResponsiveItem from './ResponsiveItem'; 

const BookList = ({ books, onBookClick }) => {
  return (
    <div className="space-y-3">
      {books.map((book, index) => {
        // FIXED: Use the parsed data from backend if available
        let shelfDisplay = "Unknown Location";
        
        if (book.parsedLocation && book.parsedLocation.floor !== 'N/A') {
            // Clean format: "IF - Rack 42"
            shelfDisplay = `${book.parsedLocation.floor} - Rack ${book.parsedLocation.rack}`;
        } else {
            // Fallback to raw strings
            shelfDisplay = book.location || book.shelf || book.callNumber || "Processing...";
        }

        const isAvailable = book.status ? book.status.toLowerCase().includes('available') : false;

        const tags = book.tags || [];
        let footerText = book.publisher || '';
        if (tags.length > 0) {
            const tagStr = tags.slice(0, 3).join(', ');
            footerText = footerText ? `${footerText} • ${tagStr}` : tagStr;
        }

        return (
          <ResponsiveItem
            key={book._id || index}
            onClick={() => onBookClick(book)}
            title={book.title || 'Untitled'}
            subtitle={book.author || 'Unknown Author'}
            tertiary={footerText}
            stats={[
              { 
                icon: Layers, 
                value: '1 Copy', 
                subLabel: 'In Library' 
              },
              { 
                icon: MapPin, 
                value: shelfDisplay, 
                subLabel: 'Location' 
              }
            ]}
            status={{
              isPositive: isAvailable,
              label: isAvailable ? 'Available' : 'Out'
            }}
          />
        );
      })}
    </div>
  );
};

export default BookList;