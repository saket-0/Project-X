/**
 * shelfUtils.js
 * Modular logic for parsing and comparing library shelf locations.
 * Shelf Format: IF-R42-C1-C (Floor-Rack-Column-Row)
 */

// Priority map for floors. Lower number = Higher Priority.
const FLOOR_PRIORITY = {
    'GD': 0,   // Ground Floor (Assumed)
    'IF': 1,   // 1st Floor
    'IIF': 2,  // 2nd Floor
    'IIIF': 3, // 3rd Floor
    'STACK': 99, // General Stacks
    'N/A': 100   // Unknown
};

/**
 * Parses a shelf string into a structured object.
 * Example: "IF-R42-C1-C" -> { floor: "IF", rack: 42, col: 1, row: "C" }
 */
const parseShelf = (shelfStr) => {
    if (!shelfStr || shelfStr === 'N/A') return null;

    // Regex to match the pattern: Floor-Rack-Column-Row
    // Matches "IF-R42-C1-C" or similar variations
    const regex = /^([A-Z]+)-R(\d+)-C(\d+)-([A-Z0-9]+)$/;
    const match = shelfStr.trim().match(regex);

    if (match) {
        return {
            raw: shelfStr,
            floor: match[1],
            rack: parseInt(match[2], 10),
            col: parseInt(match[3], 10),
            row: match[4],
            floorPriority: FLOOR_PRIORITY[match[1]] || 99
        };
    }

    // Fallback for non-standard formats
    return {
        raw: shelfStr,
        floor: 'N/A',
        rack: 999,
        col: 999,
        row: 'Z',
        floorPriority: 100
    };
};

/**
 * Comparator function to sort two books based on the user's priority logic.
 * Priority 1: Availability (Available comes first)
 * Priority 2: Floor (1st Floor > 2nd Floor > ...)
 * Priority 3: Rack (Ascending)
 * Priority 4: Column (Ascending)
 */
const compareBooksByLocation = (bookA, bookB) => {
    // 1. Priority: Availability
    const isAvailableA = bookA.Status && bookA.Status.toLowerCase().includes('available');
    const isAvailableB = bookB.Status && bookB.Status.toLowerCase().includes('available');

    if (isAvailableA && !isAvailableB) return -1; // A comes first
    if (!isAvailableA && isAvailableB) return 1;  // B comes first

    // 2. Priority: Location Parsing
    const locA = parseShelf(bookA.Shelf);
    const locB = parseShelf(bookB.Shelf);

    // Handle cases where location is missing
    if (!locA && !locB) return 0;
    if (!locA) return 1;
    if (!locB) return -1;

    // 3. Priority: Floor
    if (locA.floorPriority !== locB.floorPriority) {
        return locA.floorPriority - locB.floorPriority;
    }

    // 4. Priority: Rack
    if (locA.rack !== locB.rack) {
        return locA.rack - locB.rack;
    }

    // 5. Priority: Column
    if (locA.col !== locB.col) {
        return locA.col - locB.col;
    }

    // 6. Priority: Row (Alphabetical)
    return locA.row.localeCompare(locB.row);
};

module.exports = { parseShelf, compareBooksByLocation };