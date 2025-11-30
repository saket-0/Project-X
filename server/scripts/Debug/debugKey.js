const axios = require('axios');

// !!! PASTE YOUR KEY HERE !!!
const API_KEY = "AIzaSyC2SArU3AIbcCdLu_35JXJ9whgyREjkzkw"; 

async function testKey() {
  console.log("🔑 Testing API Key...");
  
  // A simple query for a known book
  const url = `https://www.googleapis.com/books/v1/volumes?q=intitle:Harry+Potter&key=${API_KEY}`;

  try {
    const res = await axios.get(url);
    if (res.status === 200) {
      console.log("✅ SUCCESS! Your API Key is working.");
      console.log(`📚 Found ${res.data.totalItems} items.`);
      console.log("If this works but the seeder fails, the issue is with your CSV data.");
    }
  } catch (error) {
    console.log("\n❌ API KEY ERROR");
    console.log(`Status: ${error.response?.status}`);
    console.log("Reason:", error.response?.statusText);
    
    if (error.response?.data?.error) {
      console.log("\n📜 GOOGLE ERROR MESSAGE:");
      console.log(JSON.stringify(error.response.data.error, null, 2));
    }
  }
}

testKey();