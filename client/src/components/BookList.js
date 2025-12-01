import React from 'react';
import { MapPin, Layers } from 'lucide-react';
import ResponsiveItem from './ResponsiveItem'; 

const BookList = ({ books, onBookClick }) => {
  return (
    <div className="space-y-3">
      {books.map((book, index) => {
        const shelfDisplay = book.location || book.shelf || "N/A";

        // Logic Check: 'Available' is the only positive state. 
        // Everything else (Checked Out, Not for Loan, N/A) is negative/red.
        const isAvailable = book.status ? book.status.toLowerCase().includes('available') : false;

        const tags = book.tags || [];
        const footerText = book.publisher || '';

        const copiesCount = book.totalCopies || 1;
        const copiesText = copiesCount === 1 ? '1 Copy' : `${copiesCount} Copies`;

        return (
          <ResponsiveItem
            key={book._id || index}
            onClick={() => onBookClick(book)}
            title={book.title || 'Untitled'}
            subtitle={book.author || 'Unknown Author'}
            tertiary={footerText}
            tags={tags.slice(0, 3)}
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
              // FIX: Use the actual status text from the backend ('Not for Loan', 'N/A', etc.)
              // instead of hardcoding 'Available' / 'Out'.
              label: book.status || 'Unknown' 
            }}
          />
        );
      })}
    </div>
  );
};

export default BookList;