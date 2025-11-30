/**
 * Groups a flat list of books by their Title.
 * Returns an array of unique book objects, where each object contains
 * metadata about the book and a 'variants' array of all specific copies.
 */
const groupBooksByTitle = (books) => {
    const groups = {};

    books.forEach(book => {
        // Normalize title to ensure slight casing differences don't split groups
        const titleKey = book.Title ? book.Title.trim().toUpperCase() : "UNKNOWN_TITLE";

        if (!groups[titleKey]) {
            // Initialize the group with the first book's general details
            groups[titleKey] = {
                Title: book.Title,
                Author: book.Author, // Assuming Author is consistent for the same Title
                Pub: book.Pub,
                // We keep a count of how many copies/versions exist
                totalCopies: 0,
                // The 'variants' array holds the specific data points for each version
                variants: [] 
            };
        }

        // Add this specific book record to the variants list
        groups[titleKey].variants.push(book);
        groups[titleKey].totalCopies++;
    });

    // Convert the groups object back to an array for the frontend
    return Object.values(groups);
};

module.exports = { groupBooksByTitle };