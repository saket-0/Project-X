/**
 * server/src/utils/bookGrouping.js
 * Groups duplicate books and selects the best copy to display.
 */
const { compareBooksByLocation } = require('./shelfUtils');

const groupBooksByTitle = (books) => {
    const groups = {};

    books.forEach(book => {
        // Create a normalized key (removing case/spaces)
        const titleKey = book.title ? book.title.trim().toUpperCase() : "UNKNOWN_TITLE";

        if (!groups[titleKey]) {
            groups[titleKey] = {
                // Initial metadata from the first found copy
                ...book,
                variants: [] // We will store all copies here
            };
        }
        groups[titleKey].variants.push(book);
    });

    // Process groups to find the "Best" copy
    return Object.values(groups).map(group => {
        // Sort variants: Available copies on Ground Floor appear first
        group.variants.sort(compareBooksByLocation);

        const bestCopy = group.variants[0];

        // Determine global status
        // If *any* copy is available, the book is "Available"
        const anyAvailable = group.variants.some(v => 
            v.status && v.status.toLowerCase().includes('available')
        );

        return {
            ...bestCopy, // Inherit all fields from the best copy
            
            // Overwrite specific fields with Group logic
            status: anyAvailable ? 'Available' : bestCopy.status,
            totalCopies: group.variants.length,
            
            // Keep the variants array for the "Details" view
            variants: group.variants 
        };
    });
};

module.exports = { groupBooksByTitle };