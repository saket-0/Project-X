const { getCategoryDetails } = require('../../utils/classificationMap');

const tagBook = (book) => {
    const taggedBook = { ...book };
    
    // 1. Query the DDC System
    const ddcResult = getCategoryDetails(book.callNumber);
    
    if (ddcResult) {
        // 2. Assign Category if missing or generic
        // If current category is empty or just "General", overwrite it with the specific DDC term
        if (!taggedBook.category || taggedBook.category.length < 3 || taggedBook.category === 'General') {
            taggedBook.category = ddcResult.primaryCategory;
        }

        // 3. Add Intelligent Tags
        if (!taggedBook.tags) taggedBook.tags = [];
        
        // Add the DDC primary category to tags
        if (!taggedBook.tags.includes(ddcResult.primaryCategory)) {
            taggedBook.tags.push(ddcResult.primaryCategory);
        }

        // Add any secondary keywords found in your DDC map array
        ddcResult.allTags.forEach(tag => {
            if (!taggedBook.tags.includes(tag)) {
                taggedBook.tags.push(tag);
            }
        });
    }

    // Fallback if still no category
    if (!taggedBook.category) {
        taggedBook.category = 'Uncategorized';
    }

    return taggedBook;
};

module.exports = { tagBook };