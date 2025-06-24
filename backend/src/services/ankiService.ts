import { spawn } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { writeFileSync, unlinkSync } from 'fs';

export interface AnkiDeck {
  id: number;
  name: string;
  parent_id?: number;
  card_count: number;
  children?: AnkiDeck[];
}

export interface AnkiCard {
  card_id: number;
  note_id: number;
  deck_id: number;
  front: string;
  back: string;
  type: number;
  queue: number;
  due: number;
  interval: number;
  ease_factor: number;
  reps: number;
  lapses: number;
  tags?: string[];
  next_review?: number;
}

export interface AnkiNote {
  note_id: number;
  card_id: number;
  front: string;
  back: string;
  deck_id: number;
  tags: string[];
}

export interface AnkiCardStats {
  card_id: number;
  type: number;
  queue: number;
  due: number;
  interval: number;
  ease_factor: number;
  reps: number;
  lapses: number;
  review_history: any[];
}

export interface ApiResponse {
  success: boolean;
  error?: string;
}

class AnkiService {
  private pythonPath: string;
  private bridgePath: string;

  constructor() {
    this.pythonPath = 'python'; // Use 'python' for Windows compatibility
    this.bridgePath = join(__dirname, 'ankiBridge.py');
  }

  private async executePythonScript(script: string): Promise<any> {
    console.log(`[DEBUG] executePythonScript called with script length: ${script.length}`);
    console.log(`[DEBUG] Script preview: ${script.substring(0, 200)}...`);
    
    return new Promise((resolve, reject) => {
      const tempFile = join(__dirname, `temp_${Date.now()}.py`);
      console.log(`[DEBUG] Creating temp file: ${tempFile}`);
      
      // Create a temporary Python script
      const fullScript = `\nimport sys\nimport os\nsys.path.append(os.path.dirname(__file__))\nimport json\nfrom ankiBridge import get_anki_bridge\n\n# Redirect debug output to stderr\nimport sys\n\n${script}\n\n# Output result as JSON\nprint(json.dumps(result))\n`;

      console.log(`[DEBUG] Full script length: ${fullScript.length}`);
      console.log(`[DEBUG] Full script preview: ${fullScript.substring(0, 300)}...`);

      // Write the script to a temporary file
      writeFileSync(tempFile, fullScript, 'utf8');
      console.log(`[DEBUG] Temp file written successfully`);

      // Execute the Python script
      const pythonProcess = spawn('python', [tempFile]);
      console.log(`[DEBUG] Spawning Python process with: python ${tempFile}`);

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (chunk) => {
        const chunkStr = chunk.toString();
        stdout += chunkStr;
        console.log(`[DEBUG] Python stdout chunk: ${chunkStr}`);
      });

      pythonProcess.stderr.on('data', (chunk) => {
        const chunkStr = chunk.toString();
        stderr += chunkStr;
        console.log(`[DEBUG] Python stderr chunk: ${chunkStr}`);
      });

      pythonProcess.on('close', (code) => {
        console.log(`[DEBUG] Python process closed with code: ${code}`);
        console.log(`[DEBUG] Final stdout: ${stdout}`);
        console.log(`[DEBUG] Final stderr: ${stderr}`);

        // Clean up the temporary file
        try {
          unlinkSync(tempFile);
          console.log(`[DEBUG] Temp file cleaned up`);
        } catch (error) {
          console.log(`[DEBUG] Failed to clean up temp file: ${error}`);
        }

        if (code !== 0) {
          console.error(`[ERROR] Python process failed with code ${code}`);
          console.error(`[ERROR] stderr: ${stderr}`);
          reject(new Error(`Python process failed with code ${code}: ${stderr}`));
          return;
        }

        // Try to parse the JSON output
        console.log(`[DEBUG] Attempting to parse JSON from stdout: ${stdout}`);
        try {
          // Trim whitespace and newlines from stdout
          const trimmedStdout = stdout.trim();
          console.log(`[DEBUG] Trimmed stdout: ${trimmedStdout}`);
          
          const result = JSON.parse(trimmedStdout);
          console.log(`[DEBUG] Successfully parsed JSON result:`, result);
          console.log(`[DEBUG] Parsed result type:`, typeof result);
          console.log(`[DEBUG] Parsed result keys:`, Object.keys(result));
          resolve(result);
        } catch (parseError) {
          console.error(`[ERROR] Failed to parse Python output as JSON`);
          console.error(`[ERROR] Parse error: ${parseError}`);
          console.error(`[ERROR] Raw stdout: ${stdout}`);
          console.error(`[ERROR] Raw stderr: ${stderr}`);
          reject(new Error(`Failed to parse Python output: ${parseError}. Raw output: ${stdout}`));
        }
      });

      pythonProcess.on('error', (error) => {
        console.error(`[ERROR] Failed to start Python process: ${error}`);
        reject(error);
      });
    });
  }

  async createDeck(name: string, parentId?: number): Promise<AnkiDeck | null> {
    const script = `
bridge = get_anki_bridge()
result = bridge.create_deck("${name}", ${parentId || 'None'})
`;
    
    const response = await this.executePythonScript(script);
    return response.success ? response.deck : null;
  }

  async getDecks(): Promise<AnkiDeck[]> {
    const script = `
bridge = get_anki_bridge()
result = bridge.get_decks()
`;
    
    const response = await this.executePythonScript(script);
    return response.success ? response.decks : [];
  }

  async getDeckHierarchy(): Promise<AnkiDeck[]> {
    const script = `
bridge = get_anki_bridge()
result = bridge.get_deck_hierarchy()
`;
    
    const response = await this.executePythonScript(script);
    return response.success ? response.decks : [];
  }

  async addNote(deckId: number, front: string, back: string, tags: string[] = []): Promise<AnkiNote | null> {
    const script = `
bridge = get_anki_bridge()
result = bridge.add_note(${deckId}, """${front}""", """${back}""", ${JSON.stringify(tags)})
`;
    
    const response = await this.executePythonScript(script);
    return response.success ? response.note : null;
  }

  async getCardsDue(deckId?: number, limit: number = 100): Promise<AnkiCard[]> {
    const script = `
bridge = get_anki_bridge()
result = bridge.get_cards_due(${deckId || 'None'}, ${limit})
`;
    
    const response = await this.executePythonScript(script);
    return response.success ? response.cards : [];
  }

  async answerCard(cardId: number, ease: number): Promise<AnkiCard | null> {
    const script = `
bridge = get_anki_bridge()
result = bridge.answer_card(${cardId}, ${ease})
`;
    
    const response = await this.executePythonScript(script);
    return response.success ? response.card : null;
  }

  async getCardStats(cardId: number): Promise<AnkiCardStats | null> {
    const script = `
bridge = get_anki_bridge()
result = bridge.get_card_stats(${cardId})
`;
    
    const response = await this.executePythonScript(script);
    return response.success ? response.stats : null;
  }

  async searchCards(query: string, deckId?: number): Promise<AnkiCard[]> {
    const script = `
bridge = get_anki_bridge()
result = bridge.search_cards("""${query}""", ${deckId || 'None'})
`;
    
    const response = await this.executePythonScript(script);
    return response.success ? response.cards : [];
  }

  async getNextCard(deckId?: number): Promise<AnkiCard | null> {
    const cards = await this.getCardsDue(deckId, 1);
    return cards.length > 0 ? cards[0] : null;
  }

  async getCardsByDeck(deckId: number): Promise<AnkiCard[]> {
    return await this.searchCards('', deckId);
  }

  async getCardById(cardId: number): Promise<AnkiCard | null> {
    try {
      const stats = await this.getCardStats(cardId);
      // We need to get the full card info, not just stats
      const script = `
bridge = get_anki_bridge()
card = bridge.col.get_card(${cardId})
if card:
    note = card.note()
    result = {
        'card_id': card.id,
        'note_id': note.id,
        'deck_id': card.did,
        'front': note.fields[0],
        'back': note.fields[1],
        'type': card.type,
        'queue': card.queue,
        'due': card.due,
        'interval': card.interval,
        'ease_factor': card.factor,
        'reps': card.reps,
        'lapses': card.lapses,
        'tags': note.tags
    }
else:
    result = None
`;
      
      return await this.executePythonScript(script);
    } catch (error) {
      return null;
    }
  }

  // Helper method to convert Anki's internal time format to JavaScript Date
  private ankiTimeToDate(ankiTime: number): Date {
    // Anki uses seconds since epoch, JavaScript uses milliseconds
    return new Date(ankiTime * 1000);
  }

  // Helper method to convert JavaScript Date to Anki's time format
  private dateToAnkiTime(date: Date): number {
    return Math.floor(date.getTime() / 1000);
  }

  // Enhanced card interface with proper date handling
  async getCardsDueWithDates(deckId?: number, limit: number = 100): Promise<(AnkiCard & { dueDate: Date })[]> {
    const cards = await this.getCardsDue(deckId, limit);
    return cards.map(card => ({
      ...card,
      dueDate: this.ankiTimeToDate(card.due)
    }));
  }

  async answerCardWithDate(cardId: number, ease: number): Promise<(AnkiCard & { dueDate: Date, nextReviewDate?: Date }) | null> {
    const card = await this.answerCard(cardId, ease);
    if (!card) {
      return null;
    }
    return {
      ...card,
      dueDate: this.ankiTimeToDate(card.due),
      nextReviewDate: card.next_review ? this.ankiTimeToDate(card.next_review) : undefined
    };
  }

  async importSampleData(): Promise<any> {
    const script = `
import sys
import json
from ankiBridge import get_anki_bridge, import_sample_data

bridge = get_anki_bridge()
result = import_sample_data()
`;
    
    return await this.executePythonScript(script);
  }

  async clearSampleData(): Promise<any> {
    const script = `
import sys
import json
from ankiBridge import get_anki_bridge, clear_sample_data

bridge = get_anki_bridge()
result = clear_sample_data()
`;
    
    return await this.executePythonScript(script);
  }

  // User-specific methods
  async getUserCard(userId: string, cardId: number): Promise<any> {
    const script = `
bridge = get_anki_bridge()
result = bridge.get_user_card("${userId}", ${cardId})
`;
    
    return await this.executePythonScript(script);
  }

  async answerCardWithFSRS(userId: string, cardId: number, rating: number): Promise<any> {
    console.log(`[DEBUG] answerCardWithFSRS called with:`, { userId, cardId, rating });
    
    const script = `
bridge = get_anki_bridge()
result = bridge.answer_card_with_fsrs("${userId}", ${cardId}, ${rating})
`;
    
    console.log(`[DEBUG] Generated Python script:`, script);
    console.log(`[DEBUG] About to execute Python script`);
    
    try {
      const result = await this.executePythonScript(script);
      console.log(`[DEBUG] executePythonScript returned:`, result);
      console.log(`[DEBUG] executePythonScript result type:`, typeof result);
      console.log(`[DEBUG] executePythonScript result keys:`, result ? Object.keys(result) : 'No result');
      
      // Ensure we return the parsed object, not a string
      if (typeof result === 'string') {
        console.log(`[DEBUG] Result is a string, attempting to parse it`);
        try {
          const parsedResult = JSON.parse(result);
          console.log(`[DEBUG] Successfully parsed string result:`, parsedResult);
          return parsedResult;
        } catch (parseError) {
          console.error(`[ERROR] Failed to parse string result:`, parseError);
          throw new Error(`Failed to parse result: ${parseError}`);
        }
      }
      
      console.log(`[DEBUG] Returning result object:`, result);
      return result;
    } catch (error) {
      console.error(`[ERROR] executePythonScript failed:`, error);
      console.error(`[ERROR] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }

  async getUserCardsDue(userId: string, deckId?: number, limit: number = 100): Promise<any[]> {
    const script = `
bridge = get_anki_bridge()
result = bridge.get_user_cards_due("${userId}", ${deckId || 'None'}, ${limit})
`;
    
    const response = await this.executePythonScript(script);
    return response.success ? response.cards : [];
  }

  async getNextUserCard(userId: string, deckId?: number): Promise<any | null> {
    const cards = await this.getUserCardsDue(userId, deckId, 1);
    return cards.length > 0 ? cards[0] : null;
  }

  async getUserCardReviewHistory(userId: string, cardId: number, limit: number = 50): Promise<any> {
    const script = `
bridge = get_anki_bridge()
result = bridge.get_user_card_review_history("${userId}", ${cardId}, ${limit})
`;
    
    return await this.executePythonScript(script);
  }

  async getDetailedUserStats(userId: string): Promise<ApiResponse> {
    try {
      const result = await this.executePythonScript(`
bridge = get_anki_bridge()
result = bridge.get_detailed_user_stats("${userId}")
`);
      return result;
    } catch (error) {
      console.error('Error getting detailed user stats:', error);
      return { success: false, error: 'Failed to get detailed user stats' };
    }
  }
}

// Export singleton instance
export const ankiService = new AnkiService();
export default ankiService; 