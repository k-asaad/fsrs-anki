const { spawn } = require('child_process');

async function executePythonScript(script) {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', ['-c', script]);
        
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
                    // Try to extract JSON from the output
                    const jsonMatch = output.match(/\{.*\}/s);
                    if (jsonMatch) {
                        try {
                            const result = JSON.parse(jsonMatch[0]);
                            resolve(result);
                        } catch (parseError) {
                            reject(new Error(`Invalid JSON output from Python: ${output.substring(0, 200)}...`));
                        }
                    } else {
                        reject(new Error(`Invalid JSON output from Python: ${output.substring(0, 200)}...`));
                    }
                }
            } else {
                reject(new Error(`Python script failed: ${errorOutput}`));
            }
        });
    });
}

async function testCardState() {
    console.log('Testing Card State and FSRS Algorithm...\n');

    try {
        // First, check the current state of card 1
        console.log('1. Checking current state of card 1...');
        const cardState = await executePythonScript(`
import sys
sys.path.append('src/services')
from ankiBridge import get_anki_bridge

bridge = get_anki_bridge()
result = bridge.get_user_card("default_user", 1)
print(result)
        `);

        if (cardState.success) {
            console.log('✅ Current Card State:');
            console.log(`   State: ${cardState.user_card.state}`);
            console.log(`   Stability: ${cardState.user_card.stability}`);
            console.log(`   Difficulty: ${cardState.user_card.difficulty}`);
            console.log(`   Reps: ${cardState.user_card.reps}`);
            console.log(`   Lapses: ${cardState.user_card.lapses}`);
        } else {
            console.log('❌ Failed to get card state:', cardState.error);
            return;
        }

        console.log('');

        // Now test Easy rating
        console.log('2. Testing Easy rating (4) on card 1...');
        const easyResult = await executePythonScript(`
import sys
sys.path.append('src/services')
from ankiBridge import get_anki_bridge

bridge = get_anki_bridge()
result = bridge.answer_card_with_fsrs("default_user", 1, 4)  # Rating 4 = Easy
print(result)
        `);

        if (easyResult.success) {
            console.log('✅ Easy Rating Result:');
            console.log(`   Previous State: ${cardState.user_card.state}`);
            console.log(`   New State: ${easyResult.card.state}`);
            console.log(`   Previous Stability: ${cardState.user_card.stability} → New Stability: ${easyResult.card.stability}`);
            console.log(`   Previous Difficulty: ${cardState.user_card.difficulty} → New Difficulty: ${easyResult.card.difficulty}`);
            console.log(`   Next review: ${easyResult.next_review.days_until} days`);
            
            // Check if state changed correctly
            if (easyResult.card.state === 'Review') {
                console.log('   ✅ State changed to Review correctly');
            } else {
                console.log(`   ❌ State should be Review, but is ${easyResult.card.state}`);
            }
            
            // Check if difficulty decreased
            if (easyResult.card.difficulty < cardState.user_card.difficulty) {
                console.log('   ✅ Difficulty decreased correctly');
            } else {
                console.log('   ❌ Difficulty should have decreased');
            }
        } else {
            console.log('❌ Test failed:', easyResult.error);
        }

        console.log('\n🎉 Card State Test Complete!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testCardState(); 