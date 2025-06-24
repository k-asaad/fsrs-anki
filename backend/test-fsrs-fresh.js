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

async function testFSRSFresh() {
    console.log('Testing FSRS Algorithm with Fresh Cards...\n');

    try {
        // First, let's clear the data and import fresh sample data
        console.log('1. Clearing existing data...');
        await executePythonScript(`
import sys
sys.path.append('src/services')
from ankiBridge import clear_sample_data, import_sample_data

clear_result = clear_sample_data()
print(clear_result)
        `);

        console.log('2. Importing fresh sample data...');
        await executePythonScript(`
import sys
sys.path.append('src/services')
from ankiBridge import import_sample_data

import_result = import_sample_data()
print(import_result)
        `);

        // Test with a fresh card (should be in New state)
        console.log('\n3. Testing Easy rating on fresh card...');
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

        // Test Hard rating on another fresh card
        console.log('4. Testing Hard rating on fresh card...');
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

        console.log('\n🎉 FSRS Algorithm Test Complete!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testFSRSFresh(); 