/**
 * server/src/utils/shelfUtils.js
 * FIXED: Handles Typos (LLF, LLP) and Flexible Spacing
 */

const FLOOR_LABELS = {
    'GD': 'Ground Floor',
    'IF': '1st Floor',
    'IIF': '2nd Floor',
    'IIIF': '3rd Floor',
    'IVF': '4th Floor',
    'STACK': 'Stack Room',
    'REF': 'Reference Section',
    
    // --- FIX FOR DATA TYPOS ---
    'LLF': '2nd Floor',  // Common typo for IIF
    'LLP': '2nd Floor',  // Common typo
    'LIF': '1st Floor',
    '1F': '1st Floor',
    '2F': '2nd Floor'
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

const parseShelf = (shelfStr) => {
    if (!shelfStr || shelfStr === 'N/A') return null;

    const cleanStr = shelfStr.trim().toUpperCase();

    // REGEX UPDATE: Allows optional spaces/hyphens
    // Matches: "IIF-R10", "IIF - R10", "LLF R10"
    const regex = /^([A-Z0-9]+)[\s-]*R(\d+)(?:[\s-]*C(\d+))?/;
    const match = cleanStr.match(regex);

    if (match) {
        const rawFloorCode = match[1]; 
        const friendlyFloor = FLOOR_LABELS[rawFloorCode] || 'Unknown'; // Default to Unknown if code not found

        return {
            raw: shelfStr,
            floor: friendlyFloor,
            rack: parseInt(match[2], 10),
            col: match[3] ? parseInt(match[3], 10) : 0,
            floorPriority: FLOOR_PRIORITY[friendlyFloor] || 100
        };
    }

    return {
        raw: shelfStr,
        floor: 'Unknown',
        rack: 999,
        col: 0,
        floorPriority: 100
    };
};

module.exports = { parseShelf, FLOOR_LABELS };