import express, { Request, Response } from 'express';
import ankiService from '../services/ankiService';
import { 
  CreateDeckRequest, 
  CreateNoteRequest, 
  ReviewCardRequest, 
  SearchCardsRequest,
  ankiTimeToDate 
} from '../models/ankiModels';

const router = express.Router();

// GET /anki/decks - Get all decks
router.get('/decks', async (req: Request, res: Response) => {
  try {
    const decks = await ankiService.getDecks();
    res.json(decks);
  } catch (error) {
    console.error('Error getting decks:', error);
    res.status(500).json({ 
      error: 'Failed to get decks',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// GET /anki/decks/hierarchy - Get deck hierarchy
router.get('/decks/hierarchy', async (req: Request, res: Response) => {
  try {
    const hierarchy = await ankiService.getDeckHierarchy();
    res.json(hierarchy);
  } catch (error) {
    console.error('Error getting deck hierarchy:', error);
    res.status(500).json({ 
      error: 'Failed to get deck hierarchy',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// POST /anki/decks - Create a new deck
router.post('/decks', async (req: Request, res: Response) => {
  try {
    const { name, parent_id }: CreateDeckRequest = req.body;
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Deck name is required' });
    }
    
    const deck = await ankiService.createDeck(name, parent_id);
    res.status(201).json(deck);
  } catch (error) {
    console.error('Error creating deck:', error);
    res.status(500).json({ 
      error: 'Failed to create deck',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// GET /anki/cards - Get cards (with optional filtering)
router.get('/cards', async (req: Request, res: Response) => {
  try {
    const deckId = req.query.deck_id ? parseInt(req.query.deck_id as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    
    if (deckId) {
      const cards = await ankiService.getCardsByDeck(deckId);
      res.json(cards);
    } else {
      const cards = await ankiService.getCardsDue(undefined, limit);
      res.json(cards);
    }
  } catch (error) {
    console.error('Error getting cards:', error);
    res.status(500).json({ 
      error: 'Failed to get cards',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// GET /anki/cards/due - Get cards due for review
router.get('/cards/due', async (req: Request, res: Response) => {
  try {
    const deckId = req.query.deck_id ? parseInt(req.query.deck_id as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    
    const cards = await ankiService.getCardsDue(deckId, limit);
    const cardsWithDates = cards.map(card => ({
      ...card,
      due_date: ankiTimeToDate(card.due).toISOString()
    }));
    
    res.json(cardsWithDates);
  } catch (error) {
    console.error('Error getting due cards:', error);
    res.status(500).json({ 
      error: 'Failed to get due cards',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// GET /anki/cards/next - Get next card to review
router.get('/cards/next', async (req: Request, res: Response) => {
  try {
    const deckId = req.query.deck_id ? parseInt(req.query.deck_id as string) : undefined;
    
    const card = await ankiService.getNextCard(deckId);
    if (!card) {
      return res.status(404).json({ error: 'No cards due for review' });
    }
    
    const cardWithDate = {
      ...card,
      due_date: ankiTimeToDate(card.due).toISOString()
    };
    
    res.json(cardWithDate);
  } catch (error) {
    console.error('Error getting next card:', error);
    res.status(500).json({ 
      error: 'Failed to get next card',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// GET /anki/cards/:id - Get card by ID
router.get('/cards/:id', async (req: Request, res: Response) => {
  try {
    const cardId = parseInt(req.params.id);
    if (isNaN(cardId)) {
      return res.status(400).json({ error: 'Invalid card ID' });
    }
    
    const card = await ankiService.getCardById(cardId);
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }
    
    const cardWithDate = {
      ...card,
      due_date: ankiTimeToDate(card.due).toISOString()
    };
    
    res.json(cardWithDate);
  } catch (error) {
    console.error('Error getting card:', error);
    res.status(500).json({ 
      error: 'Failed to get card',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// POST /anki/cards/:id/review - Review a card
router.post('/cards/:id/review', async (req: Request, res: Response) => {
  try {
    const cardId = parseInt(req.params.id);
    if (isNaN(cardId)) {
      return res.status(400).json({ error: 'Invalid card ID' });
    }
    
    const { ease }: ReviewCardRequest = req.body;
    
    if (!ease || ![1, 2, 3, 4].includes(ease)) {
      return res.status(400).json({ error: 'Invalid ease rating (must be 1-4)' });
    }
    
    const card = await ankiService.answerCard(cardId, ease);
    
    if (!card) {
      return res.status(404).json({ error: 'Card not found or could not be reviewed' });
    }
    
    const response = {
      card: {
        ...card,
        due_date: ankiTimeToDate(card.due).toISOString()
      },
      next_review: card.next_review ? ankiTimeToDate(card.next_review).toISOString() : undefined,
      success: true
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error reviewing card:', error);
    res.status(500).json({ 
      error: 'Failed to review card',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// GET /anki/cards/:id/stats - Get card statistics
router.get('/cards/:id/stats', async (req: Request, res: Response) => {
  try {
    const cardId = parseInt(req.params.id);
    if (isNaN(cardId)) {
      return res.status(400).json({ error: 'Invalid card ID' });
    }
    
    const stats = await ankiService.getCardStats(cardId);
    res.json(stats);
  } catch (error) {
    console.error('Error getting card stats:', error);
    res.status(500).json({ 
      error: 'Failed to get card stats',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// POST /anki/import - Import sample data (for testing)
router.post('/import/sample', async (req: Request, res: Response) => {
  try {
    const result = await ankiService.importSampleData();
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json({ 
        error: 'Failed to import sample data',
        details: result.error || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Error importing sample data:', error);
    res.status(500).json({ 
      error: 'Failed to import sample data',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// POST /anki/clear - Clear sample data (for testing)
router.post('/clear/sample', async (req: Request, res: Response) => {
  try {
    const result = await ankiService.clearSampleData();
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json({ 
        error: 'Failed to clear sample data',
        details: result.error || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Error clearing sample data:', error);
    res.status(500).json({ 
      error: 'Failed to clear sample data',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// POST /anki/notes - Create a new note
router.post('/notes', async (req: Request, res: Response) => {
  try {
    const { deck_id, front, back, tags = [] }: CreateNoteRequest = req.body;
    
    if (!deck_id || !front || !back) {
      return res.status(400).json({ 
        error: 'Deck ID, front, and back are required' 
      });
    }
    
    const note = await ankiService.addNote(deck_id, front, back, tags);
    res.status(201).json(note);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ 
      error: 'Failed to create note',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// GET /anki/search - Search for cards
router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const deckId = req.query.deck_id ? parseInt(req.query.deck_id as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const cards = await ankiService.searchCards(query, deckId);
    const limitedCards = cards.slice(0, limit);
    
    const response = {
      cards: limitedCards.map(card => ({
        ...card,
        due_date: ankiTimeToDate(card.due).toISOString()
      })),
      total: cards.length
    };
    
    console.log(`Sending response with ${response.cards.length} cards`);
    res.json(response);
  } catch (error) {
    console.error('Error searching cards:', error);
    res.status(500).json({ 
      error: 'Failed to search cards',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// GET /anki/stats - Get collection statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const decks = await ankiService.getDecks();
    const dueCards = await ankiService.getCardsDue();
    
    const stats = {
      total_decks: decks.length,
      total_cards: decks.reduce((sum, deck) => sum + deck.card_count, 0),
      due_cards: dueCards.length,
      decks: decks.map(deck => ({
        id: deck.id,
        name: deck.name,
        card_count: deck.card_count
      }))
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ 
      error: 'Failed to get stats',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// User-specific routes
// GET /anki/users/:userId/cards/due - Get cards due for review for specific user
router.get('/users/:userId/cards/due', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const deckId = req.query.deck_id ? parseInt(req.query.deck_id as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    
    // console.log(`Getting user cards due for user: ${userId}, deck: ${deckId}, limit: ${limit}`);
    console.log(`[DEBUG] Request to /users/${userId}/cards/due`);
    console.log(`[DEBUG] Params:`, { userId, deckId, limit });

    
    const cards = await ankiService.getUserCardsDue(userId, deckId, limit);
    
    console.log(`Received ${cards.length} cards from Python bridge:`, cards);
    
    const response = {
      cards: cards.map(card => {
        // Handle different due field formats
        let dueDate: string;
        if (card.due && typeof card.due === 'number') {
          dueDate = ankiTimeToDate(card.due).toISOString();
        } else if (card.due && typeof card.due === 'string') {
          dueDate = card.due;
        } else {
          dueDate = new Date().toISOString();
        }
        
        return {
          ...card,
          due_date: dueDate
        };
      }),
      total: cards.length
    };
    
    console.log(`Sending response with ${response.cards.length} cards`);
    res.json(response);
  } catch (error) {
    console.error('Error getting user cards due:', error);
    res.status(500).json({ 
      error: 'Failed to get user cards due',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// GET /anki/users/:userId/cards/next - Get next card to review for specific user
router.get('/users/:userId/cards/next', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const deckId = req.query.deck_id ? parseInt(req.query.deck_id as string) : undefined;
    
    const card = await ankiService.getNextUserCard(userId, deckId);
    
    if (!card) {
      return res.status(404).json({ error: 'No cards due for review' });
    }
    
    const cardWithDate = {
      ...card,
      due_date: ankiTimeToDate(card.due).toISOString()
    };
    
    res.json(cardWithDate);
  } catch (error) {
    console.error('Error getting next user card:', error);
    res.status(500).json({ 
      error: 'Failed to get next user card',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// GET /anki/users/:userId/cards/:cardId - Get user-specific card data with FSRS parameters
router.get('/users/:userId/cards/:cardId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const cardId = parseInt(req.params.cardId);
    
    if (isNaN(cardId)) {
      return res.status(400).json({ error: 'Invalid card ID' });
    }
    
    const result = await ankiService.getUserCard(userId, cardId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json({ 
        error: 'Card not found',
        details: result.error || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Error getting user card:', error);
    res.status(500).json({ 
      error: 'Failed to get user card',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// POST /anki/users/:userId/cards/:cardId/review - Review a card with FSRS for specific user
router.post('/users/:userId/cards/:cardId/review', async (req: Request, res: Response) => {
  try {
    console.log(`[DEBUG] Review request received:`, {
      userId: req.params.userId,
      cardId: req.params.cardId,
      body: req.body
    });

    const userId = req.params.userId;
    const cardId = parseInt(req.params.cardId);
    const { ease }: ReviewCardRequest = req.body;
    
    console.log(`[DEBUG] Parsed parameters:`, { userId, cardId, ease });
    
    if (isNaN(cardId)) {
      console.log(`[ERROR] Invalid card ID: ${req.params.cardId}`);
      return res.status(400).json({ error: 'Invalid card ID' });
    }
    
    if (!ease || ![1, 2, 3, 4].includes(ease)) {
      console.log(`[ERROR] Invalid ease rating: ${ease}`);
      return res.status(400).json({ error: 'Invalid ease rating (must be 1-4)' });
    }
    
    console.log(`[DEBUG] About to call ankiService.answerCardWithFSRS with:`, { userId, cardId, ease });
    
    try {
      const result = await ankiService.answerCardWithFSRS(userId, cardId, ease);
      console.log(`[DEBUG] ankiService.answerCardWithFSRS returned:`, result);
      console.log(`[DEBUG] Result type:`, typeof result);
      console.log(`[DEBUG] Result success:`, result?.success);
      console.log(`[DEBUG] Result keys:`, result ? Object.keys(result) : 'No result');
      console.log(`[DEBUG] Result stringified:`, JSON.stringify(result));
      console.log(`[DEBUG] Result parsed back:`, JSON.parse(JSON.stringify(result)));
      
      if (result && result.success) {
        console.log(`[DEBUG] Processing successful result`);
        const response = {
          card: result.card,
          next_review: result.next_review,
          success: true
        };
        console.log(`[DEBUG] Sending success response:`, response);
        res.json(response);
      } else if (result && result.error && result.error.includes('Base card not found')) {
        // Only return 404 for truly missing cards
        console.log(`[DEBUG] Card not found, returning 404`);
        res.status(404).json({ 
          error: 'Card not found',
          details: result.error
        });
      } else {
        // For all other errors, return 200 with error info so frontend can show it
        console.log(`[DEBUG] FSRS error, returning error response:`, result ? result.error : 'No result returned');
        res.json({
          success: false,
          error: result ? result.error : 'No result returned',
          details: result ? result.error : 'No result returned'
        });
      }
    } catch (serviceError) {
      console.error(`[ERROR] ankiService.answerCardWithFSRS threw exception:`, serviceError);
      console.error(`[ERROR] Service error stack:`, serviceError instanceof Error ? serviceError.stack : 'No stack trace');
      res.status(500).json({ 
        success: false,
        error: 'Service call failed',
        details: serviceError instanceof Error ? serviceError.message : String(serviceError)
      });
    }
  } catch (error) {
    console.error('[ERROR] Exception in review route:', error);
    console.error('[ERROR] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({ 
      success: false,
      error: 'Failed to review user card',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// GET /anki/users/:userId/cards/:cardId/history - Get review history for a specific user card
router.get('/users/:userId/cards/:cardId/history', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const cardId = parseInt(req.params.cardId);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    
    if (isNaN(cardId)) {
      return res.status(400).json({ error: 'Invalid card ID' });
    }
    
    const result = await ankiService.getUserCardReviewHistory(userId, cardId, limit);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json({ 
        error: 'Review history not found',
        details: result.error || 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Error getting user card review history:', error);
    res.status(500).json({ 
      error: 'Failed to get user card review history',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get detailed user statistics with FSRS parameters
router.get('/users/:userId/stats/detailed', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    
    const result = await ankiService.getDetailedUserStats(userId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error getting detailed user stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router; 