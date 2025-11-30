const axios = require('axios');

async function testConnection() {
  const bookTitle = "Engineering Physics";
  const author = "Gaur";
  
  console.log(`🔎 Testing Google Books API for: "${bookTitle}"...`);
  
  try {
    const q = `intitle:${encodeURIComponent(bookTitle)}+inauthor:${encodeURIComponent(author)}`;
    // Note: No API Key used here, simulating your current setup
    const url = `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1`;
    
    const startTime = Date.now();
    const res = await axios.get(url);
    const duration = Date.now() - startTime;
    
    if (res.status === 200) {
      console.log(`✅ SUCCESS! (Took ${duration}ms)`);
      console.log(`📚 Found: ${res.data.items[0].volumeInfo.title}`);
      console.log(`ℹ️  Description length: ${res.data.items[0].volumeInfo.description?.length} chars`);
    }
  } catch (error) {
    console.log(`❌ FAILED! Status: ${error.response?.status}`);
    console.log(`⚠️  Reason: ${error.response?.statusText}`);
    if (error.response?.data) {
        console.log(`📜 Full Error:`, JSON.stringify(error.response.data, null, 2));
    }
  }
}

testConnection();