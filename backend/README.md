# FSRS-TS Backend with Anki Integration

This backend now integrates with Anki's native library to provide authentic spaced repetition functionality, deck management, and card scheduling.

## Features

- **Native Anki Integration**: Uses Anki's official Python library for all core functionality
- **Authentic Spaced Repetition**: Implements Anki's actual FSRS (Free Spaced Repetition Scheduler) algorithm
- **Deck Hierarchy**: Supports Anki's native deck structure with parent-child relationships
- **Note Types**: Supports Anki's templating system for different card types
- **Card Scheduling**: Uses Anki's proven scheduling algorithms
- **Search**: Full-text search using Anki's search syntax
- **Statistics**: Comprehensive card and deck statistics

## Architecture

```
TypeScript Backend (Express)
    ↓
AnkiService (TypeScript)
    ↓
Python Bridge (Child Process)
    ↓
Anki Python Library
    ↓
SQLite Database (Anki Collection)
```

## Prerequisites

- Node.js 18+ 
- Python 3.9+
- Git (for Anki submodule)

## Setup

### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies and Anki library
python setup.py
```

### 2. Initialize Anki Submodule

If you haven't already initialized the Anki submodule:

```bash
git submodule update --init --recursive
```

### 3. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## API Endpoints

### Health Check
- `GET /health` - Check server status

### Decks
- `GET /anki/decks` - Get all decks
- `GET /anki/decks/hierarchy` - Get deck hierarchy (tree structure)
- `POST /anki/decks` - Create a new deck

### Cards
- `GET /anki/cards` - Get cards (with optional deck filtering)
- `GET /anki/cards/due` - Get cards due for review
- `GET /anki/cards/next` - Get next card to review
- `GET /anki/cards/:id` - Get card by ID
- `POST /anki/cards/:id/review` - Review a card
- `GET /anki/cards/:id/stats` - Get card statistics

### Notes
- `POST /anki/notes` - Create a new note

### Search
- `GET /anki/search?q=<query>` - Search for cards

### Statistics
- `GET /anki/stats` - Get collection statistics

### Import
- `POST /anki/import/sample` - Import sample data for testing

## Usage Examples

### Create a Deck
```bash
curl -X POST http://localhost:3000/anki/decks \
  -H "Content-Type: application/json" \
  -d '{"name": "Mathematics", "parent_id": null}'
```

### Create a Note
```bash
curl -X POST http://localhost:3000/anki/notes \
  -H "Content-Type: application/json" \
  -d '{
    "deck_id": 1,
    "front": "What is 2+2?",
    "back": "4",
    "tags": ["math", "basic"]
  }'
```

### Review a Card
```bash
curl -X POST http://localhost:3000/anki/cards/1/review \
  -H "Content-Type: application/json" \
  -d '{"ease": 3}'
```

### Get Next Card
```bash
curl http://localhost:3000/anki/cards/next
```

### Search Cards
```bash
curl "http://localhost:3000/anki/search?q=tag:math"
```

### Import Sample Data
```bash
curl -X POST http://localhost:3000/anki/import/sample
```

## Data Models

### Deck
```typescript
interface AnkiDeck {
  id: number;
  name: string;
  parent_id?: number;
  card_count: number;
  children?: AnkiDeck[];
}
```

### Card
```typescript
interface AnkiCard {
  card_id: number;
  note_id: number;
  deck_id: number;
  front: string;
  back: string;
  type: number; // 0=new, 1=learning, 2=review, 3=relearning
  queue: number; // -1=suspended, 0=new, 1=learning, 2=review, etc.
  due: number; // Anki timestamp
  interval: number;
  ease_factor: number;
  reps: number;
  lapses: number;
  tags?: string[];
  due_date: string; // ISO date string
}
```

### Review Response
```typescript
interface ReviewResponse {
  card: AnkiCard;
  next_review?: string; // ISO date string
  success: boolean;
}
```

## Review Ease Values

- `1` - Again (failed)
- `2` - Hard
- `3` - Good
- `4` - Easy

## Card Types

- `0` - New
- `1` - Learning
- `2` - Review
- `3` - Relearning

## Card Queues

- `-1` - Suspended
- `0` - New
- `1` - Learning
- `2` - Review
- `3` - Day Learning
- `4` - Preview

## Search Syntax

The search endpoint supports Anki's powerful search syntax:

- `tag:math` - Cards with "math" tag
- `deck:"Mathematics"` - Cards in Mathematics deck
- `is:due` - Cards due for review
- `is:new` - New cards
- `is:review` - Review cards
- `is:learning` - Learning cards
- `front:circle` - Cards with "circle" in front field
- `back:formula` - Cards with "formula" in back field

## Migration from Legacy API

The legacy `/cards` endpoints are still available for backward compatibility, but new development should use the `/anki` endpoints for full Anki functionality.

### Legacy vs New API

| Legacy | New Anki API |
|--------|--------------|
| `GET /cards` | `GET /anki/cards` |
| `GET /cards/next` | `GET /anki/cards/next` |
| `POST /cards/:id/review` | `POST /anki/cards/:id/review` |
| `GET /cards/hierarchy` | `GET /anki/decks/hierarchy` |

## Development

### File Structure
```
src/
├── services/
│   ├── ankiService.ts      # TypeScript service for Anki operations
│   └── ankiBridge.py       # Python bridge to Anki library
├── models/
│   ├── ankiModels.ts       # Anki-compatible data models
│   ├── card.ts            # Legacy models (deprecated)
│   └── dataset.ts         # Legacy models (deprecated)
├── routes/
│   ├── anki.ts            # New Anki API routes
│   └── cards.ts           # Legacy routes (deprecated)
└── app.ts                 # Main application
```

### Adding New Features

1. **Python Bridge**: Add methods to `ankiBridge.py`
2. **TypeScript Service**: Add methods to `ankiService.ts`
3. **API Routes**: Add endpoints to `anki.ts`
4. **Models**: Update `ankiModels.ts` if needed

### Testing

```bash
# Test health endpoint
curl http://localhost:3000/health

# Import sample data
curl -X POST http://localhost:3000/anki/import/sample

# Test deck creation
curl -X POST http://localhost:3000/anki/decks \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Deck"}'
```

## Troubleshooting

### Python Import Errors
If you get Python import errors:
1. Ensure Python 3.9+ is installed
2. Run `python setup.py` to install dependencies
3. Check that the Anki submodule is initialized

### Anki Library Issues
If Anki library fails to load:
1. Check that `anki/pylib` exists
2. Run `cd anki/pylib && python -m pip install -e .`
3. Verify Python path includes Anki library

### Database Issues
If database operations fail:
1. Check that `data/` directory exists
2. Ensure write permissions
3. Check SQLite installation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project uses Anki's AGPL-3.0 license due to the integration with Anki's codebase. 