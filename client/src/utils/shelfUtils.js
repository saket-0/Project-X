/**
 * Client-side Shelf Utilities
 * formatting logic ported from server/src/utils/shelfUtils.js
 */

export const FLOOR_MAP = {
  'GD': 'Ground Floor',
  'IF': '1st Floor',
  'IIF': '2nd Floor',
  'IIIF': '3rd Floor',
  'STACK': 'General Stack',
  'N/A': 'Unknown'
};

export const parseShelf = (shelfStr) => {
  if (!shelfStr || shelfStr === 'N/A') return null;

  // Regex: Floor-Rack-Column-Row (e.g., IF-R42-C1-C)
  const regex = /^([A-Z]+)-R(\d+)-C(\d+)-([A-Z0-9]+)$/;
  const match = shelfStr.trim().match(regex);

  if (match) {
      const floorCode = match[1];
      return {
          raw: shelfStr,
          floorCode: floorCode,
          floorLabel: FLOOR_MAP[floorCode] || floorCode, // "1st Floor" or raw "IF"
          rack: parseInt(match[2], 10),
          col: parseInt(match[3], 10),
          row: match[4]
      };
  }

  return null;
};