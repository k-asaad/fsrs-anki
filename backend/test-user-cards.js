const { spawn } = require('child_process');
const path = require('path');

async function testUserCards() {
  console.log('Testing user cards functionality...');
  
  // Test the Python bridge directly
  const pythonScript = `
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src', 'services'))
import json
from ankiBridge import get_anki_bridge

bridge = get_anki_bridge()
result = bridge.get_user_cards_due("default_user", None, 10)
print(json.dumps(result))
`;

  const tempFile = path.join(__dirname, `test_user_cards_${Date.now()}.py`);
  const fs = require('fs');
  
  try {
    // Write the script to a temporary file
    fs.writeFileSync(tempFile, pythonScript);
    
    // Execute the Python script
    const pythonProcess = spawn('python', [tempFile]);
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      // Clean up temporary file
      try {
        fs.unlinkSync(tempFile);
      } catch (e) {}
      
      if (code !== 0) {
        console.error('Python script failed:', stderr);
        return;
      }
      
      try {
        const result = JSON.parse(stdout.trim());
        console.log('Python bridge result:', JSON.stringify(result, null, 2));
      } catch (error) {
        console.error('Failed to parse Python output:', error);
        console.log('Raw output:', stdout);
      }
    });
    
    pythonProcess.on('error', (error) => {
      console.error('Failed to execute Python script:', error.message);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testUserCards(); 