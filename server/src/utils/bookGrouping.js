/**
 * server/src/utils/bookGrouping.js
 * Groups duplicate books and selects the best copy to display.
 * FIXED: Ensures the output object ALWAYS has a valid '_id'.
 */
const { compareBooksByLocation } = require('./shelfUtils');

const computeStatus = (book) => {
    const accType = (book.accessionType || '').toLowerCase().trim();
    const rawStatus = (book.status || '').toLowerCase().trim();
    const loc = book.location || book.shelf || '';
    const hasValidLocation = loc && loc.toUpperCase() !== 'N/A' && loc.trim().length > 0;

    if (accType.includes('reference') && rawStatus === 'not for loan') return 'Not for Loan';
    if (accType.includes('written off') && rawStatus === 'not for loan') return 'N/A';
    
    const isAccMissing = !accType || accType === 'n/a';
    const isStatusMissing = !rawStatus || rawStatus === 'n/a';
    if (isAccMissing && isStatusMissing) return 'N/A';

    if (accType.includes('stack') && rawStatus.includes('checked out') && hasValidLocation) {
        return 'Available';
    }

    return book.status || 'Unknown';
};

const groupBooksByTitle = (books) => {
    const groups = {};

    books.forEach(book => {
        const titleKey = book.title ? book.title.trim().toUpperCase() : "UNKNOWN_TITLE";

        if (!groups[titleKey]) {
            groups[titleKey] = {
                variants: [] 
            };
        }
        groups[titleKey].variants.push(book);
    });

    return Object.values(groups).map(group => {
        // 1. Normalize Statuses
        group.variants.forEach(variant => {
            variant.status = computeStatus(variant);
        });

        // 2. Sort to find best copy
        group.variants.sort(compareBooksByLocation);
        const bestCopy = group.variants[0];

        // 3. Find a valid ID from ANY variant if bestCopy lacks one
        // (This fixes issues where search ranking might strip the ID)
        const validId = group.variants.find(v => v._id)?._id || bestCopy._id;

        // 4. Determine Global Status
        const anyAvailable = group.variants.some(v => 
            v.status && v.status.toLowerCase().includes('available')
        );

        return {
            ...bestCopy, // Inherit metadata
            _id: validId, // CRITICAL: Ensure ID is preserved
            status: anyAvailable ? 'Available' : bestCopy.status,
            totalCopies: group.variants.length,
            variants: group.variants 
        };
    });
};

module.exports = { groupBooksByTitle };