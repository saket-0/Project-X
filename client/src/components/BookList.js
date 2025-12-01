import React from 'react';
// Added 'Monitor' and 'Disc' icons for digital items
import { MapPin, Layers, Monitor, Disc } from 'lucide-react';
import ResponsiveItem from './ResponsiveItem'; 

const BookList = ({ books, onBookClick }) => {
  return (
    <div className="space-y-3">
      {books.map((book, index) => {
        
        // --- LOGIC: Detect Digital Formats ---
        const accType = (book.accessionType || '').toUpperCase();
        const isEbook = accType.includes('E-BOOK');
        const isCD = accType.includes('CD') || accType.includes('DIGITAL');

        // 1. Determine Location Text & Icon
        let shelfDisplay = book.location || book.shelf || "N/A";
        let LocationIcon = MapPin;

        if (isEbook) {
            shelfDisplay = "Digital Access";
            LocationIcon = Monitor;
        } else if (isCD) {
            shelfDisplay = "Digital Media";
            LocationIcon = Disc;
        }

        // 2. Determine Format Label (The Indicator)
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
            
            // Pass the new format label to the item
            format={formatLabel} 

            stats={[
              { 
                icon: Layers, 
                value: copiesText, 
                subLabel: 'In Library' 
              },
              { 
                icon: LocationIcon, // Dynamic Icon
                value: shelfDisplay, // Dynamic Text
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