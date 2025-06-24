const { spawn } = require('child_process');
const path = require('path');

const pythonScript = path.join(__dirname, 'src', 'services', 'ankiBridge.py');

async function testReviewHistory() {
  console.log('Testing Review History Functionality...\n');

  // First, import sample data
  console.log('1. Importing sample data...');
  const importResult = await runPythonCommand('import_sample');
  if (importResult.success) {
    console.log('✅ Sample data imported successfully');
    console.log(`   - Decks created: ${importResult.decks_created}`);
    console.log(`   - Notes created: ${importResult.notes_created}`);
    console.log(`   - Cards created: ${importResult.cards_created}`);
    console.log(`   - User cards created: ${importResult.user_cards_created}`);
  } else {
    console.log('❌ Failed to import sample data:', importResult.error);
    return;
  }

  // Get a card to review
  console.log('\n2. Getting a card to review...');
  const cardsResult = await runPythonCommand('get_user_cards_due', 'default_user');
  if (cardsResult.success && cardsResult.cards.length > 0) {
    const card = cardsResult.cards[0];
    console.log(`✅ Found card ${card.card_id} to review`);
    console.log(`   - Front: ${card.front}`);
    console.log(`   - Back: ${card.back}`);
    console.log(`   - Current state: ${card.state}`);
    console.log(`   - Current stability: ${card.stability}`);
    console.log(`   - Current difficulty: ${card.difficulty}`);

    // Review the card with different ratings
    console.log('\n3. Reviewing the card multiple times...');
    
    const ratings = [3, 4, 2, 3, 1, 3]; // Good, Easy, Hard, Good, Again, Good
    for (let i = 0; i < ratings.length; i++) {
      const rating = ratings[i];
      console.log(`   Review ${i + 1}: Rating ${rating} (${getRatingText(rating)})`);
      
      const reviewResult = await runPythonCommand('answer_card_with_fsrs', 'default_user', card.card_id, rating);
      if (reviewResult.success) {
        console.log(`     ✅ New stability: ${reviewResult.card.stability.toFixed(2)}`);
        console.log(`     ✅ New difficulty: ${reviewResult.card.difficulty.toFixed(2)}`);
        console.log(`     ✅ New state: ${reviewResult.card.state}`);
        console.log(`     ✅ Next review: ${reviewResult.next_review.date}`);
      } else {
        console.log(`     ❌ Review failed: ${reviewResult.error}`);
      }
    }

    // Get review history
    console.log('\n4. Getting review history...');
    const historyResult = await runPythonCommand('get_user_card_review_history', 'default_user', card.card_id);
    if (historyResult.success) {
      console.log(`✅ Review history retrieved successfully`);
      console.log(`   - Total reviews: ${historyResult.total_count}`);
      
      if (historyResult.reviews.length > 0) {
        console.log('\n   Review History:');
        historyResult.reviews.forEach((review, index) => {
          console.log(`   ${index + 1}. ${review.review_date} - ${review.rating_text} (${review.state_text})`);
          console.log(`      Stability: ${review.stability.toFixed(2)} → ${review.difficulty.toFixed(2)}`);
          console.log(`      Elapsed: ${review.elapsed_days} days, Scheduled: ${review.scheduled_days} days`);
        });
      }
    } else {
      console.log('❌ Failed to get review history:', historyResult.error);
    }

  } else {
    console.log('❌ No cards found for review');
  }

  console.log('\n✅ Review history test completed!');
}

function getRatingText(rating) {
  const texts = { 1: 'Again', 2: 'Hard', 3: 'Good', 4: 'Easy' };
  return texts[rating] || `Rating ${rating}`;
}

function runPythonCommand(command, ...args) {
  return new Promise((resolve) => {
    const pythonProcess = spawn('python', [pythonScript, command, ...args]);
    
    let output = '';
    let errorOutput = '';
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output.trim());
          resolve(result);
        } catch (e) {
          resolve({ success: false, error: 'Invalid JSON output', output: output.trim() });
        }
      } else {
        resolve({ success: false, error: errorOutput || `Process exited with code ${code}` });
      }
    });
  });
}

// Run the test
testReviewHistory().catch(console.error); 