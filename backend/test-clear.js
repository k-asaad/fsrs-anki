const axios = require('axios');

async function testClearData() {
  try {
    console.log('🧹 Testing clear sample data...');
    
    // Test if backend is running
    try {
      const statsResponse = await axios.get('http://localhost:3001/anki/stats');
      console.log('✅ Backend is running');
      console.log('📊 Current stats before clearing:', statsResponse.data);
    } catch (error) {
      console.log('❌ Backend is not running. Please start it with: npm start');
      return;
    }
    
    // Test clear sample data
    console.log('\n🗑️ Clearing sample data...');
    const clearResponse = await axios.post('http://localhost:3001/anki/clear/sample');
    
    if (clearResponse.data.success) {
      console.log('✅ Sample data cleared successfully!');
      console.log('🗑️ Cleared items:', clearResponse.data.cleared);
      
      // Get updated stats
      const updatedStats = await axios.get('http://localhost:3001/anki/stats');
      console.log('\n📈 Updated stats after clearing:', updatedStats.data);
      
      // Get decks
      const decks = await axios.get('http://localhost:3001/anki/decks');
      console.log('\n📚 Available decks after clearing:', decks.data.length);
      decks.data.forEach(deck => {
        console.log(`  - ${deck.name} (${deck.card_count} cards)`);
      });
      
      // Get due cards
      const dueCards = await axios.get('http://localhost:3001/anki/cards/due');
      console.log(`\n⏰ Due cards after clearing: ${dueCards.data.length}`);
      
    } else {
      console.error('❌ Failed to clear sample data:', clearResponse.data.error);
    }
    
  } catch (error) {
    console.error('❌ Error clearing sample data:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testClearData(); 