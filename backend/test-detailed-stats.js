const { spawn } = require('child_process');

async function testDetailedUserStats() {
    console.log('Testing detailed user stats...\n');

    try {
        // Test the new detailed user stats method
        const result = await executePythonScript(`
import sys
sys.path.append('src/services')
from ankiBridge import get_anki_bridge

bridge = get_anki_bridge()
result = bridge.get_detailed_user_stats("default_user")
print(result)
        `);

        console.log('Detailed User Stats Result:');
        console.log(JSON.stringify(result, null, 2));

        if (result.success) {
            console.log('\n✅ Detailed user stats test passed!');
            console.log(`📊 Summary:`);
            console.log(`   - Total cards: ${result.summary.total_cards}`);
            console.log(`   - Completed cards: ${result.summary.completed_cards}`);
            console.log(`   - Due cards: ${result.summary.due_cards}`);
            console.log(`   - Progress: ${result.summary.progress_percentage}%`);
            console.log(`   - Avg stability: ${result.summary.avg_stability}`);
            console.log(`   - Avg difficulty: ${result.summary.avg_difficulty}`);
            console.log(`   - Cards due soon: ${result.summary.cards_due_soon}`);
            console.log(`   - Recently completed: ${result.summary.recently_completed}`);
            
            if (result.cards && result.cards.length > 0) {
                console.log(`\n📋 Sample completed card:`);
                const completedCard = result.cards.find(card => card.is_completed);
                if (completedCard) {
                    console.log(`   - Card ID: ${completedCard.card_id}`);
                    console.log(`   - Front: ${completedCard.front.substring(0, 50)}...`);
                    console.log(`   - State: ${completedCard.state}`);
                    console.log(`   - Stability: ${completedCard.stability}`);
                    console.log(`   - Difficulty: ${completedCard.difficulty}`);
                    console.log(`   - Next review: ${completedCard.next_review.date} (${completedCard.next_review.days_until} days)`);
                    console.log(`   - Recent reviews: ${completedCard.recent_reviews.length}`);
                }
            }
        } else {
            console.log('❌ Detailed user stats test failed:', result.error);
        }

    } catch (error) {
        console.error('❌ Error testing detailed user stats:', error);
    }
}

function executePythonScript(script) {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', ['-c', script]);
        
        let stdout = '';
        let stderr = '';
        
        pythonProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    // Try to parse the last line as JSON
                    const lines = stdout.trim().split('\n');
                    const lastLine = lines[lines.length - 1];
                    const result = JSON.parse(lastLine);
                    resolve(result);
                } catch (e) {
                    console.error('Failed to parse Python output as JSON:', stdout);
                    reject(new Error('Invalid JSON output from Python'));
                }
            } else {
                console.error('Python script error:', stderr);
                reject(new Error(`Python script failed with code ${code}: ${stderr}`));
            }
        });
        
        pythonProcess.on('error', (error) => {
            reject(error);
        });
    });
}

// Run the test
testDetailedUserStats(); 