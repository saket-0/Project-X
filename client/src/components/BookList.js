import React from 'react';
import { MapPin, Layers } from 'lucide-react';
import ResponsiveItem from './ResponsiveItem'; 

const BookList = ({ books, onBookClick }) => {
  return (
    <div className="space-y-3">
      {books.map((book, index) => {
        // 1. DATA NORMALIZATION (Handle Mongo lowercase or CSV Uppercase)
        const title = book.title || book.Title || 'Untitled';
        const author = book.author || book.Author || 'Unknown Author';
        const publisher = book.publisher || book.Pub;
        const status = book.status || book.Status || 'Unknown';
        const shelf = book.shelf || book.Shelf || book.location || book.callNumber || "N/A";
        
        // Mongo returns flat list, so we assume 1 copy unless we aggregate later
        const copies = book.totalCopies || 1; 
        const isAvailable = status.toLowerCase().includes('available');

        // 2. SMART TAGS DISPLAY
        const tags = book.tags || [];
        let footerText = publisher || '';
        if (tags.length > 0) {
            // Add tags to the footer (Publisher • Tag1, Tag2)
            const tagStr = tags.slice(0, 3).join(', ');
            footerText = footerText ? `${footerText} • ${tagStr}` : tagStr;
        }

        return (
          <ResponsiveItem
            key={book._id || index}
            onClick={() => onBookClick(book)}
            
            // 1. Basic Info
            title={title}
            subtitle={author}
            tertiary={footerText} // Shows publisher + smart tags
            
            // 2. Statistics/Metadata
            stats={[
              { 
                icon: Layers, 
                value: copies > 1 ? `${copies} Copies` : 'Single Copy', 
                subLabel: 'Availability' 
              },
              { 
                icon: MapPin, 
                value: shelf, 
                subLabel: 'Location' 
              }
            ]}
            
            // 3. Status
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