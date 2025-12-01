import React from 'react';
import { MapPin, Layers, Monitor, Disc } from 'lucide-react';
import ResponsiveItem from './ResponsiveItem'; 

const BookList = ({ books, onBookClick, highlightTerm, highlightEnabled }) => {
  return (
    <div className="space-y-3">
      {books.map((book, index) => {
        
        const accType = (book.accessionType || '').toUpperCase();
        const isEbook = accType.includes('E-BOOK');
        const isCD = accType.includes('CD') || accType.includes('DIGITAL');

        let shelfDisplay = book.location || book.shelf || "N/A";
        let LocationIcon = MapPin;

        if (isEbook) {
            shelfDisplay = "Digital Access";
            LocationIcon = Monitor;
        } else if (isCD) {
            shelfDisplay = "Digital Media";
            LocationIcon = Disc;
        }

        let formatLabel = null;
        if (isEbook) formatLabel = "E-Book";
        else if (isCD) formatLabel = "CD / Digital";

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
            format={formatLabel} 

            // --- PASS HIGHLIGHT DATA ---
            highlightTerm={highlightTerm}
            highlightEnabled={highlightEnabled}
            matchedWords={book.matchedWords} // <--- Pass the smart matches (e.g. ['python'])

            stats={[
              { 
                icon: Layers, 
                value: copiesText, 
                subLabel: 'In Library' 
              },
              { 
                icon: LocationIcon, 
                value: shelfDisplay, 
                subLabel: 'Location' 
              }
            ]}
            status={{
              isPositive: isAvailable,
              label: book.status || 'Unknown'
            }}
          />
        );
      })}
    </div>
  );
};

export default BookList;