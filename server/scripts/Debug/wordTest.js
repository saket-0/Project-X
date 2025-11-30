// Save as debug_test.js and run: node debug_test.js
const axios = require('axios');

async function test() {
    console.log("🔍 Diagnosing Search Logic...\n");

    // 1. The Problematic Query (What your script was doing)
    const badUrl = `https://openlibrary.org/search.json?title=ENGINEERING%20DRAWING&author=By:%20BHATT%20N.D&limit=1`;
    console.log("1. Testing 'Dirty' Author Search (By: BHATT)...");
    try {
        const res1 = await axios.get(badUrl);
        console.log(`   Result: ${res1.data.numFound} books found (Likely 0) ❌`);
    } catch(e) { console.log("   Error connecting."); }

    // 2. The Fixed Query (What the new script does)
    const goodUrl = `https://openlibrary.org/search.json?title=ENGINEERING%20DRAWING&author=BHATT&limit=1`;
    console.log("\n2. Testing 'Clean' Author Search (BHATT)...");
    try {
        const res2 = await axios.get(goodUrl);
        console.log(`   Result: ${res2.data.numFound} books found! ✅`);
    } catch(e) { console.log("   Error connecting."); }
}

test();