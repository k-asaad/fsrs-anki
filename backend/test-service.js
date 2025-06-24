const { AnkiService } = require('./src/services/ankiService');

async function testService() {
  console.log('Testing AnkiService...');
  
  const service = new AnkiService();
  
  try {
    const cards = await service.getUserCardsDue('default_user', undefined, 10);
    console.log('Service result:', JSON.stringify(cards, null, 2));
  } catch (error) {
    console.error('Service error:', error);
  }
}

testService(); 