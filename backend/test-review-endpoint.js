const { spawn } = require('child_process');
const path = require('path');

async function executePythonScript(script) {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', ['-c', script], {
            cwd: path.join(__dirname, 'src', 'services')
        });

        let stdout = '';
        let stderr = '';

        pythonProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Python script failed with code ${code}: ${stderr}`));
                return;
            }

            try {
                // Handle Python dictionary output by using ast.literal_eval
                const result = JSON.parse(stdout.trim());
                resolve(result);
            } catch (error) {
                // If JSON parsing fails, try to parse as Python literal
                try {
                    const pythonScript = `
import ast
import json
result = ast.literal_eval('''${stdout.trim()}''')
print(json.dumps(result))
`;
                    
                    // Re-run with ast.literal_eval
                    const pythonProcess2 = spawn('python', ['-c', pythonScript], {
                        cwd: path.join(__dirname, 'src', 'services')
                    });

                    let stdout2 = '';
                    let stderr2 = '';

                    pythonProcess2.stdout.on('data', (data) => {
                        stdout2 += data.toString();
                    });

                    pythonProcess2.stderr.on('data', (data) => {
                        stderr2 += data.toString();
                    });

                    pythonProcess2.on('close', (code2) => {
                        if (code2 !== 0) {
                            reject(new Error(`Failed to parse Python output: ${stderr2}`));
                            return;
                        }

                        try {
                            const result = JSON.parse(stdout2.trim());
                            resolve(result);
                        } catch (error2) {
                            reject(new Error(`Failed to parse output: ${stdout2}`));
                        }
                    });
                } catch (error2) {
                    reject(new Error(`Failed to parse output: ${stdout}`));
                }
            }
        });
    });
}

async function testReviewEndpoint() {
    console.log('🧪 Testing Review Endpoint Auto-Creation...\n');

    try {
        // First, let's check if we have any cards in the database
        console.log('1. Checking existing cards...');
        const cardsResult = await executePythonScript(`
import sys
sys.path.append('src/services')
from ankiBridge import get_anki_bridge

bridge = get_anki_bridge()
result = bridge.get_cards()
print(result)
        `);

        if (cardsResult.success && cardsResult.cards.length > 0) {
            console.log(`✅ Found ${cardsResult.cards.length} cards in database`);
            const testCardId = cardsResult.cards[0].id;
            console.log(`   Using card ID: ${testCardId}`);
        } else {
            console.log('❌ No cards found in database');
            return;
        }

        // Test 1: Try to review a card for a new user (should auto-create user card)
        console.log('\n2. Testing review for new user (should auto-create user card)...');
        const newUserResult = await executePythonScript(`
import sys
sys.path.append('src/services')
from ankiBridge import get_anki_bridge

bridge = get_anki_bridge()
result = bridge.answer_card_with_fsrs("new_user_123", ${cardsResult.cards[0].id}, 3)  # Rating 3 = Good
print(result)
        `);

        if (newUserResult.success) {
            console.log('✅ New user review successful!');
            console.log(`   Card state: ${newUserResult.card.state}`);
            console.log(`   Stability: ${newUserResult.card.stability}`);
            console.log(`   Difficulty: ${newUserResult.card.difficulty}`);
            console.log(`   Next review: ${newUserResult.card.due}`);
        } else {
            console.log('❌ New user review failed:', newUserResult.error);
        }

        // Test 2: Try to review the same card again (should work with existing user card)
        console.log('\n3. Testing review for same user again...');
        const repeatResult = await executePythonScript(`
import sys
sys.path.append('src/services')
from ankiBridge import get_anki_bridge

bridge = get_anki_bridge()
result = bridge.answer_card_with_fsrs("new_user_123", ${cardsResult.cards[0].id}, 4)  # Rating 4 = Easy
print(result)
        `);

        if (repeatResult.success) {
            console.log('✅ Repeat review successful!');
            console.log(`   Card state: ${repeatResult.card.state}`);
            console.log(`   Stability: ${repeatResult.card.stability}`);
            console.log(`   Difficulty: ${repeatResult.card.difficulty}`);
            console.log(`   Reps: ${repeatResult.card.reps}`);
        } else {
            console.log('❌ Repeat review failed:', repeatResult.error);
        }

        // Test 3: Check user card review history
        console.log('\n4. Checking user card review history...');
        const historyResult = await executePythonScript(`
import sys
sys.path.append('src/services')
from ankiBridge import get_anki_bridge

bridge = get_anki_bridge()
result = bridge.get_user_card_review_history("new_user_123", ${cardsResult.cards[0].id}, 10)
print(result)
        `);

        if (historyResult.success) {
            console.log(`✅ Found ${historyResult.reviews.length} review entries`);
            historyResult.reviews.forEach((review, index) => {
                console.log(`   Review ${index + 1}: Rating ${review.rating} (${review.rating_text}) - ${review.review_date}`);
            });
        } else {
            console.log('❌ Failed to get review history:', historyResult.error);
        }

        // Test 4: Test with non-existent card ID (should fail gracefully)
        console.log('\n5. Testing with non-existent card ID...');
        const nonExistentResult = await executePythonScript(`
import sys
sys.path.append('src/services')
from ankiBridge import get_anki_bridge

bridge = get_anki_bridge()
result = bridge.answer_card_with_fsrs("new_user_123", 99999, 3)  # Non-existent card ID
print(result)
        `);

        if (!nonExistentResult.success) {
            console.log('✅ Correctly handled non-existent card:', nonExistentResult.error);
        } else {
            console.log('❌ Should have failed for non-existent card');
        }

        console.log('\n🎉 All tests completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testReviewEndpoint(); 