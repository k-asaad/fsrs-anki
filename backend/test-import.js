const axios = require('axios');

async function testBackend() {
  try {
    console.log('🧪 Testing backend connection...');
    
    // Test if backend is running
    try {
      const statsResponse = await axios.get('http://localhost:3001/anki/stats');
      console.log('✅ Backend is running');
      console.log('📊 Current stats:', statsResponse.data);
    } catch (error) {
      console.log('❌ Backend is not running. Please start it with: npm start');
      return;
    }
    
    // Test import sample data
    console.log('\n📥 Testing sample data import...');
    const importResponse = await axios.post('http://localhost:3001/anki/import/sample');
    
    if (importResponse.data.success) {
      console.log('✅ Sample data imported successfully!');
      console.log(`📊 Created ${importResponse.data.decks_created} decks`);
      console.log(`📝 Created ${importResponse.data.notes_created} notes`);
      console.log(`🃏 Created ${importResponse.data.cards_created} cards`);
      
      // Get updated stats
      const updatedStats = await axios.get('http://localhost:3001/anki/stats');
      console.log('\n📈 Updated stats:', updatedStats.data);
      
      // Get decks
      const decks = await axios.get('http://localhost:3001/anki/decks');
      console.log('\n📚 Available decks:', decks.data.length);
      decks.data.forEach(deck => {
        console.log(`  - ${deck.name} (${deck.card_count} cards)`);
      });
      
      // Get due cards
      const dueCards = await axios.get('http://localhost:3001/anki/cards/due');
      console.log(`\n⏰ Due cards: ${dueCards.data.length}`);
      
    } else {
      console.error('❌ Failed to import sample data:', importResponse.data.error);
    }
    
  } catch (error) {
    console.error('❌ Error testing backend:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testBackend(); 