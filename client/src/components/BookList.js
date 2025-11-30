import React from 'react';
import { MapPin, Layers } from 'lucide-react';
import ResponsiveItem from './ResponsiveItem'; 

const BookList = ({ books, onBookClick }) => {
  return (
    <div className="space-y-3">
      {books.map((book, index) => {
        // We can now trust the Mongo Schema keys (lowercase)
        // If parsedLocation exists (from our new Controller), use it!
        const shelfDisplay = book.parsedLocation 
            ? `${book.parsedLocation.floorLabel} - Rack ${book.parsedLocation.rack}`
            : (book.shelf || book.location || "N/A");

        const isAvailable = book.status ? book.status.toLowerCase().includes('available') : false;

        // Footer: Publisher • Tag1, Tag2
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
                value: '1 Copy', // Simplified unless you actually track copies
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