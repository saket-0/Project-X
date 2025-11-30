/**
 * server/src/seeder/utils/mapper.js
 * The "Contract": Ensures Data Consistency for the Frontend.
 */
const mapToStandardBook = (normalized, metaData) => {
    // 1. Prioritize Valid Shelf Location
    // If we have multiple copies, pick the first valid shelf code.
    // If empty, mark as 'On Shelf' to avoid 'Rack 999' errors if parsed.
    const shelfCodes = Array.from(normalized.locations);
    const primaryLocation = shelfCodes.length > 0 ? shelfCodes[0] : 'Processing';

    // 2. Strict Type Enforcement
    return {
        // Identity
        title: metaData.title || normalized.rawTitle,
        
        // PRIMARY DISPLAY (Must be constant types)
        author: metaData.authors?.[0] || normalized.rawAuthor || "Unknown Author",
        location: primaryLocation,  // This is now "IIF-R48..." NOT "Vellore..."
        status: "Available",
        
        // RICH DATA
        authors: metaData.authors || [normalized.rawAuthor],
        publisher: metaData.publisher || "Unknown Publisher",
        description: (metaData.description || "No description available.").substring(0, 2000),
        tags: [], // Filled by tagger next
        coverImage: metaData.imageLinks?.thumbnail || "",
        
        // INVENTORY
        locations: shelfCodes,
        count: shelfCodes.length || 1,
        callNumber: normalized.callNumber || "",
        
        // ENGINE METADATA (For debugging)
        meta: {
            source: metaData.source || "Local",
            originalId: normalized.originalId,
            lastSeeded: new Date()
        }
    };
};

module.exports = { mapToStandardBook };