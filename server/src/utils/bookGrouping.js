const { compareBooksByLocation } = require('./shelfUtils');

const groupBooksByTitle = (books) => {
    const groups = {};

    books.forEach(book => {
        const titleKey = book.Title ? book.Title.trim().toUpperCase() : "UNKNOWN_TITLE";

        if (!groups[titleKey]) {
            groups[titleKey] = {
                // Basic Metadata (will be overwritten by the best copy later)
                Title: book.Title,
                Author: book.Author, 
                Pub: book.Pub,
                variants: [] 
            };
        }

        groups[titleKey].variants.push(book);
    });

    // Process each group to find the "Best" copy to display
    return Object.values(groups).map(group => {
        // Sort variants based on the priority logic (Available > Floor > Rack...)
        group.variants.sort(compareBooksByLocation);

        // The first item is now the "Best" copy
        const bestCopy = group.variants[0];

        return {
            ...group,
            // Hoist the best copy's details to the top level for the List View
            Shelf: bestCopy.Shelf,
            CallNo: bestCopy.CallNo,
            Status: bestCopy.Status, // List view will show "Available" if *any* copy is available
            totalCopies: group.variants.length
        };
    });
};

module.exports = { groupBooksByTitle };