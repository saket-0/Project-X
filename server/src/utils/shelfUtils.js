/**
 * server/src/utils/shelfUtils.js
 * REDESIGNED: Handles Friendly Floor Names and Parsing
 */

// 1. Friendly Name Mapping
const FLOOR_LABELS = {
    'GD': 'Ground Floor',
    'IF': '1st Floor',
    'IIF': '2nd Floor',
    'IIIF': '3rd Floor',
    'IVF': '4th Floor',
    'STACK': 'Stack Room',
    'REF': 'Reference Section'
};

const FLOOR_PRIORITY = {
    'Ground Floor': 0,
    '1st Floor': 1,
    '2nd Floor': 2,
    '3rd Floor': 3,
    '4th Floor': 4,
    'Stack Room': 99,
    'Unknown': 100
};

/**
 * Parses a shelf string "IF-R42-C1" -> { floor: "1st Floor", rack: 42, ... }
 */
const parseShelf = (shelfStr) => {
    if (!shelfStr || shelfStr === 'N/A') return null;

    // Clean up input
    const cleanStr = shelfStr.trim().toUpperCase();

    // Regex to capture: FLOOR - Rack X - Col Y
    // Matches: "IF-R42", "IIF-R10-C1", "GD-R5"
    const regex = /^([A-Z]+)-R(\d+)(?:-C(\d+))?/;
    const match = cleanStr.match(regex);

    if (match) {
        const rawFloorCode = match[1]; // e.g., "IF"
        const friendlyFloor = FLOOR_LABELS[rawFloorCode] || rawFloorCode; // "1st Floor"

        return {
            raw: shelfStr,
            floor: friendlyFloor, // <--- This is what the UI will show
            rack: parseInt(match[2], 10),
            col: match[3] ? parseInt(match[3], 10) : 0,
            floorPriority: FLOOR_PRIORITY[friendlyFloor] || 99
        };
    }

    // Fallback for non-standard codes
    return {
        raw: shelfStr,
        floor: 'Unknown',
        rack: 999,
        col: 0,
        floorPriority: 100
    };
};

module.exports = { parseShelf, FLOOR_LABELS };