#!/usr/bin/env node

/**
 * Test script for Anki integration
 * This script tests the basic functionality of the Anki API
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Anki Integration...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const health = await makeRequest('GET', '/health');
    if (health.status === 200) {
      console.log('✅ Health check passed');
    } else {
      console.log('❌ Health check failed:', health.status);
      return;
    }

    // Test 2: Import sample data
    console.log('\n2. Importing sample data...');
    const importResult = await makeRequest('POST', '/anki/import/sample');
    if (importResult.status === 200) {
      console.log('✅ Sample data imported successfully');
      console.log(`   Created ${importResult.data.decks.length} decks`);
      console.log(`   Created ${importResult.data.notes.length} notes`);
    } else {
      console.log('❌ Sample data import failed:', importResult.status);
      console.log('   Error:', importResult.data);
      return;
    }

    // Test 3: Get deck hierarchy
    console.log('\n3. Testing deck hierarchy...');
    const hierarchy = await makeRequest('GET', '/anki/decks/hierarchy');
    if (hierarchy.status === 200) {
      console.log('✅ Deck hierarchy retrieved');
      console.log(`   Found ${hierarchy.data.length} root decks`);
    } else {
      console.log('❌ Deck hierarchy failed:', hierarchy.status);
      return;
    }

    // Test 4: Get due cards
    console.log('\n4. Testing due cards...');
    const dueCards = await makeRequest('GET', '/anki/cards/due');
    if (dueCards.status === 200) {
      console.log('✅ Due cards retrieved');
      console.log(`   Found ${dueCards.data.length} due cards`);
    } else {
      console.log('❌ Due cards failed:', dueCards.status);
      return;
    }

    // Test 5: Get next card
    console.log('\n5. Testing next card...');
    const nextCard = await makeRequest('GET', '/anki/cards/next');
    if (nextCard.status === 200) {
      console.log('✅ Next card retrieved');
      console.log(`   Card ID: ${nextCard.data.card_id}`);
      console.log(`   Front: ${nextCard.data.front}`);
    } else if (nextCard.status === 404) {
      console.log('✅ No cards due (expected for new cards)');
    } else {
      console.log('❌ Next card failed:', nextCard.status);
      return;
    }

    // Test 6: Search cards
    console.log('\n6. Testing search...');
    const search = await makeRequest('GET', '/anki/search?q=tag:math');
    if (search.status === 200) {
      console.log('✅ Search working');
      console.log(`   Found ${search.data.total} cards with math tag`);
    } else {
      console.log('❌ Search failed:', search.status);
      return;
    }

    // Test 7: Get statistics
    console.log('\n7. Testing statistics...');
    const stats = await makeRequest('GET', '/anki/stats');
    if (stats.status === 200) {
      console.log('✅ Statistics retrieved');
      console.log(`   Total decks: ${stats.data.total_decks}`);
      console.log(`   Total cards: ${stats.data.total_cards}`);
      console.log(`   Due cards: ${stats.data.due_cards}`);
    } else {
      console.log('❌ Statistics failed:', stats.status);
      return;
    }

    console.log('\n🎉 All tests passed! Anki integration is working correctly.');
    console.log('\n📝 Next steps:');
    console.log('   - Start your frontend application');
    console.log('   - Use the /anki endpoints for full Anki functionality');
    console.log('   - Check the README.md for API documentation');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure the server is running: npm run dev');
    console.log('   2. Check that Python dependencies are installed: npm run setup');
    console.log('   3. Verify Anki submodule is initialized: git submodule update --init --recursive');
  }
}

// Check if server is running
makeRequest('GET', '/health')
  .then(() => {
    runTests();
  })
  .catch(() => {
    console.log('❌ Server is not running on http://localhost:3000');
    console.log('   Please start the server with: npm run dev');
    process.exit(1);
  }); 