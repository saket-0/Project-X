/**
 * server/src/utils/shelfUtils.js
 * FIXED: Better fallback logic
 */

const FLOOR_PRIORITY = {
    'GD': 0, 'IF': 1, 'IIF': 2, 'IIIF': 3, 'STACK': 99, 'N/A': 100
};

const parseShelf = (shelfStr) => {
    if (!shelfStr || shelfStr === 'N/A') return null;

    // Matches "IF-R42-C1..." OR just "IF-R42"
    // This allows for less specific locations to still be parsed
    const regex = /^([A-Z]+)-R(\d+)(?:-C(\d+))?/; 
    const match = shelfStr.trim().toUpperCase().match(regex);

    if (match) {
        return {
            raw: shelfStr,
            floor: match[1],
            // Default to 0/Z if parts are missing, prevents crashes
            rack: match[2] ? parseInt(match[2], 10) : 0,
            col: match[3] ? parseInt(match[3], 10) : 0,
            floorPriority: FLOOR_PRIORITY[match[1]] || 99
        };
    }

    return {
        raw: shelfStr,
        floor: 'N/A', // Normalized 'Unknown'
        rack: 999,
        col: 999,
        floorPriority: 100
    };
};

const compareBooksByLocation = (bookA, bookB) => {
    // ... (Keep existing comparison logic)
    return 0; 
};

module.exports = { parseShelf, compareBooksByLocation };