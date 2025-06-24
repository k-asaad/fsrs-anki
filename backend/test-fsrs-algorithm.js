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
                    reject(new Error(`Invalid JSON output from Python: ${output}`));
                }
            } else {
                reject(new Error(`Python script failed: ${errorOutput}`));
            }
        });
    });
}

async function testFSRSAlgorithm() {
    console.log('Testing FSRS Algorithm with Detailed Parameter Changes...\n');

    try {
        // Test 1: Easy Rating (should increase stability, decrease difficulty)
        console.log('Test 1: Reviewing card with "Easy" rating (should increase stability, decrease difficulty)');
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
            console.log(`   Stability: ${easyResult.card.stability}`);
            console.log(`   Difficulty: ${easyResult.card.difficulty}`);
            console.log(`   State: ${easyResult.card.state}`);
            console.log(`   Next review: ${easyResult.next_review.days_until} days`);
            
            // Check if difficulty decreased
            if (easyResult.card.difficulty < 2.5) {
                console.log('   ✅ Difficulty decreased correctly');
            } else {
                console.log('   ❌ Difficulty should have decreased');
            }
        } else {
            console.log('❌ Test failed:', easyResult.error);
        }

        console.log('');

        // Test 2: Hard Rating (should decrease stability, increase difficulty)
        console.log('Test 2: Reviewing card with "Hard" rating (should decrease stability, increase difficulty)');
        const hardResult = await executePythonScript(`
import sys
sys.path.append('src/services')
from ankiBridge import get_anki_bridge

bridge = get_anki_bridge()
result = bridge.answer_card_with_fsrs("default_user", 2, 2)  # Rating 2 = Hard
print(result)
        `);

        if (hardResult.success) {
            console.log('✅ Hard Rating Result:');
            console.log(`   Stability: ${hardResult.card.stability}`);
            console.log(`   Difficulty: ${hardResult.card.difficulty}`);
            console.log(`   State: ${hardResult.card.state}`);
            console.log(`   Next review: ${hardResult.next_review.days_until} days`);
            
            // Check if difficulty increased
            if (hardResult.card.difficulty > 2.5) {
                console.log('   ✅ Difficulty increased correctly');
            } else {
                console.log('   ❌ Difficulty should have increased');
            }
        } else {
            console.log('❌ Test failed:', hardResult.error);
        }

        console.log('');

        // Test 3: Good Rating (should increase stability, slight decrease in difficulty)
        console.log('Test 3: Reviewing card with "Good" rating (should increase stability, slight decrease in difficulty)');
        const goodResult = await executePythonScript(`
import sys
sys.path.append('src/services')
from ankiBridge import get_anki_bridge

bridge = get_anki_bridge()
result = bridge.answer_card_with_fsrs("default_user", 3, 3)  # Rating 3 = Good
print(result)
        `);

        if (goodResult.success) {
            console.log('✅ Good Rating Result:');
            console.log(`   Stability: ${goodResult.card.stability}`);
            console.log(`   Difficulty: ${goodResult.card.difficulty}`);
            console.log(`   State: ${goodResult.card.state}`);
            console.log(`   Next review: ${goodResult.next_review.days_until} days`);
            
            // Check if difficulty decreased slightly
            if (goodResult.card.difficulty <= 2.5) {
                console.log('   ✅ Difficulty decreased or stayed same (correct)');
            } else {
                console.log('   ❌ Difficulty should have decreased or stayed same');
            }
        } else {
            console.log('❌ Test failed:', goodResult.error);
        }

        console.log('');

        // Test 4: Again Rating (should decrease stability, increase difficulty)
        console.log('Test 4: Reviewing card with "Again" rating (should decrease stability, increase difficulty)');
        const againResult = await executePythonScript(`
import sys
sys.path.append('src/services')
from ankiBridge import get_anki_bridge

bridge = get_anki_bridge()
result = bridge.answer_card_with_fsrs("default_user", 4, 1)  # Rating 1 = Again
print(result)
        `);

        if (againResult.success) {
            console.log('✅ Again Rating Result:');
            console.log(`   Stability: ${againResult.card.stability}`);
            console.log(`   Difficulty: ${againResult.card.difficulty}`);
            console.log(`   State: ${againResult.card.state}`);
            console.log(`   Next review: ${againResult.next_review.days_until} days`);
            
            // Check if difficulty increased
            if (againResult.card.difficulty > 2.5) {
                console.log('   ✅ Difficulty increased correctly');
            } else {
                console.log('   ❌ Difficulty should have increased');
            }
        } else {
            console.log('❌ Test failed:', againResult.error);
        }

        console.log('\n🎉 FSRS Algorithm Test Complete!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testFSRSAlgorithm(); 