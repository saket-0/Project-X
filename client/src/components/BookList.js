import React from 'react';
import { MapPin, Layers } from 'lucide-react';
import ResponsiveItem from './ResponsiveItem'; // Import the helper

const BookList = ({ books, onBookClick }) => {
  return (
    <div className="space-y-3">
      {books.map((group, index) => {
        const isAvailable = group.Status && group.Status.toLowerCase().includes('available');

        return (
          <ResponsiveItem
            key={index}
            onClick={() => onBookClick(group)}
            // 1. Basic Info
            title={group.Title}
            subtitle={group.Author}
            tertiary={group.Pub}
            
            // 2. Statistics/Metadata (Automatic Layout)
            stats={[
              { 
                icon: Layers, 
                value: `${group.totalCopies} Copies`, 
                subLabel: 'Total Copies' // Optional label for desktop
              },
              { 
                icon: MapPin, 
                value: group.Shelf || "N/A", 
                subLabel: 'Location' 
              }
            ]}
            
            // 3. Status (Automatic Coloring)
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