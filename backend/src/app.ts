import express from 'express';
import cardsRouter from './routes/cards';
import ankiRouter from './routes/anki';
import cors from 'cors';

const app = express();
app.use(cors());

app.use(express.json());

// Legacy routes (for backward compatibility)
app.use('/cards', cardsRouter);

// New Anki-based routes
app.use('/anki', ankiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'FSRS-TS Backend with Anki Integration'
  });
});

export default app; 