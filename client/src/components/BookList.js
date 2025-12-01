import React from 'react';
import { MapPin, Layers } from 'lucide-react';
import ResponsiveItem from './ResponsiveItem'; 

const BookList = ({ books, onBookClick }) => {
  return (
    <div className="space-y-3">
      {books.map((book, index) => {
        // --- FIX: Show "N/A" if location is missing ---
        const shelfDisplay = book.location || book.shelf || "N/A";

        const isAvailable = book.status ? book.status.toLowerCase().includes('available') : false;

        const tags = book.tags || [];
        // FIX: Cleaned up footerText to only show Publisher. Tags are now separate.
        const footerText = book.publisher || '';

        // Calculate dynamic copies text
        const copiesCount = book.totalCopies || 1;
        const copiesText = copiesCount === 1 ? '1 Copy' : `${copiesCount} Copies`;

        return (
          <ResponsiveItem
            key={book._id || index}
            onClick={() => onBookClick(book)}
            title={book.title || 'Untitled'}
            subtitle={book.author || 'Unknown Author'}
            tertiary={footerText}
            tags={tags.slice(0, 3)} // Pass the first 3 tags to the item
            stats={[
              { 
                icon: Layers, 
                value: copiesText, 
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