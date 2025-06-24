const axios = require('axios');

async function importSampleData() {
  try {
    console.log('Importing sample data...');
    
    const response = await axios.post('http://localhost:3001/anki/import/sample');
    
    if (response.data.success) {
      console.log('✅ Sample data imported successfully!');
      console.log(`📊 Created ${response.data.decks_created} decks`);
      console.log(`📝 Created ${response.data.notes_created} notes`);
      console.log(`🃏 Created ${response.data.cards_created} cards`);
    } else {
      console.error('❌ Failed to import sample data:', response.data.error);
    }
  } catch (error) {
    console.error('❌ Error importing sample data:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run the import
importSampleData(); 