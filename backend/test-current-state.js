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

async function testCurrentState() {
    console.log('Checking Current Database State...\n');

    try {
        // Get detailed user stats to see current state
        const statsResult = await executePythonScript(`
import sys
sys.path.append('src/services')
from ankiBridge import get_anki_bridge

bridge = get_anki_bridge()
result = bridge.get_detailed_user_stats("default_user")
print(result)
        `);

        if (statsResult.success) {
            console.log('✅ Current User Stats:');
            console.log(`   Total cards: ${statsResult.summary.total_cards}`);
            console.log(`   Completed cards: ${statsResult.summary.completed_cards}`);
            console.log(`   Due cards: ${statsResult.summary.due_cards}`);
            console.log(`   Average stability: ${statsResult.summary.avg_stability}`);
            console.log(`   Average difficulty: ${statsResult.summary.avg_difficulty}`);
            
            console.log('\n📊 Sample of Completed Cards:');
            const completedCards = statsResult.cards.filter(card => card.is_completed).slice(0, 5);
            
            completedCards.forEach((card, index) => {
                console.log(`\n   Card ${index + 1}: "${card.front.substring(0, 30)}..."`);
                console.log(`     State: ${card.state}`);
                console.log(`     Stability: ${card.stability.toFixed(2)}`);
                console.log(`     Difficulty: ${card.difficulty.toFixed(2)}`);
                console.log(`     Reps: ${card.reps}`);
                console.log(`     Lapses: ${card.lapses}`);
                
                if (card.recent_reviews.length > 0) {
                    console.log(`     Recent reviews: ${card.recent_reviews.length}`);
                    card.recent_reviews.slice(0, 2).forEach((review, reviewIndex) => {
                        console.log(`       Review ${reviewIndex + 1}: ${review.rating_text} (${review.rating})`);
                        console.log(`         Previous stability: ${review.stability.toFixed(2)}`);
                        console.log(`         Previous difficulty: ${review.difficulty.toFixed(2)}`);
                        console.log(`         Current stability: ${card.stability.toFixed(2)}`);
                        console.log(`         Current difficulty: ${card.difficulty.toFixed(2)}`);
                        
                        // Check if values actually changed
                        const stabilityChanged = Math.abs(review.stability - card.stability) > 0.01;
                        const difficultyChanged = Math.abs(review.difficulty - card.difficulty) > 0.01;
                        
                        console.log(`         Stability changed: ${stabilityChanged ? '✅' : '❌'}`);
                        console.log(`         Difficulty changed: ${difficultyChanged ? '✅' : '❌'}`);
                    });
                }
            });
            
        } else {
            console.log('❌ Failed to get stats:', statsResult.error);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testCurrentState(); 