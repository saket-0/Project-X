/**
 * server/src/utils/bookGrouping.js
 * Groups duplicate books and selects the best copy to display.
 * UPDATED: Includes logic to normalize Status based on Accession Type.
 */
const { compareBooksByLocation } = require('./shelfUtils');

/**
 * Helper to compute the display status based on business rules.
 */
const computeStatus = (book) => {
    const accType = (book.accessionType || '').toLowerCase().trim();
    const rawStatus = (book.status || '').toLowerCase().trim();
    
    // Check for valid location (NotEmpty and Not 'N/A')
    const loc = book.location || book.shelf || '';
    const hasValidLocation = loc && loc.toUpperCase() !== 'N/A' && loc.trim().length > 0;

    // Rule 1: Reference Book & Not for Loan --> "Not for Loan"
    // Matches "Reference", "Reference Book", etc.
    if (accType.includes('reference') && rawStatus === 'not for loan') {
        return 'Not for Loan';
    }

    // Rule 2: Written off & Not for Loan --> "N/A"
    if (accType.includes('written off') && rawStatus === 'not for loan') {
        return 'N/A';
    }

    // Rule 3: Everything is N/A --> "N/A"
    // Checks if both fields are effectively empty or "n/a"
    const isAccMissing = !accType || accType === 'n/a';
    const isStatusMissing = !rawStatus || rawStatus === 'n/a';
    if (isAccMissing && isStatusMissing) {
        return 'N/A';
    }

    // Rule 4: Stack & Checked out & Valid Location --> "Available"
    // Fixes data inconsistency where a book is marked checked out but scanned on a shelf
    if (accType.includes('stack') && rawStatus.includes('checked out') && hasValidLocation) {
        return 'Available';
    }

    // Default: Return original status (Capitalized if needed, or as is)
    return book.status || 'Unknown';
};

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
        
        // --- STEP 1: Normalize Statuses for all copies ---
        // We do this BEFORE sorting so availability logic works correctly
        group.variants.forEach(variant => {
            variant.status = computeStatus(variant);
        });

        // --- STEP 2: Sort variants ---
        // Available copies on Ground Floor appear first
        group.variants.sort(compareBooksByLocation);

        const bestCopy = group.variants[0];

        // --- STEP 3: Determine global status ---
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