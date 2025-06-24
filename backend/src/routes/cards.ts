import express, { Request, Response } from 'express';
import { dataset, cards, userCards } from '../models/dataset';
import { scheduleCard } from '../services/fsrsService';
import { Card, UserCard } from '../models/card';
const router = express.Router();

// Helper to get user cards with card content
function getUserCardsWithContent(userId: string): (Card & UserCard)[] {
  return userCards
    .filter(uc => uc.userId === userId)
    .map(userCard => {
      const card = cards.find(c => c.id === userCard.cardId);
      if (!card) return null;
      return { ...card, ...userCard };
    })
    .filter(Boolean) as (Card & UserCard)[];
}

// Helper to get all cards for a user
function getAllUserCards(userId: string = 'user1'): (Card & UserCard)[] {
  return getUserCardsWithContent(userId);
}

// GET /cards - all cards for current user
router.get('/', (req: Request, res: Response) => {
  const userId = req.query.userId as string || 'user1';
  res.json(getAllUserCards(userId));
});

// GET /cards/hierarchy - deck hierarchy
router.get('/hierarchy', (req: Request, res: Response) => {
  // Remove cards from the hierarchy for frontend navigation
  const hierarchy = dataset.map(cls => ({
    id: cls.id,
    name: cls.name,
    subjects: cls.subjects.map(subj => ({
      id: subj.id,
      name: subj.name,
      topics: subj.topics.map(topic => ({
        id: topic.id,
        name: topic.name
      }))
    }))
  }));
  res.json(hierarchy);
});

// GET /users - get available users
router.get('/users', (req: Request, res: Response) => {
  const uniqueUsers = [...new Set(userCards.map(uc => uc.userId))];
  const users = uniqueUsers.map(userId => ({
    id: userId,
    name: `User ${userId.replace('user', '')}`,
    cardCount: userCards.filter(uc => uc.userId === userId).length
  }));
  res.json(users);
});

// GET /cards/next - next card to review (due soonest)
router.get('/next', (req: Request, res: Response) => {
  const userId = req.query.userId as string || 'user1';
  const now = new Date();
  const dueCards = getAllUserCards(userId).filter(card => new Date(card.due) <= now);
  if (dueCards.length === 0) return res.status(404).json({ error: 'No cards due' });
  // Return the card with the earliest due date
  const nextCard = dueCards.reduce((a, b) => new Date(a.due) < new Date(b.due) ? a : b);
  res.json(nextCard);
});

// GET /cards/:id - card by id for current user
router.get('/:id', (req: Request, res: Response) => {
  const userId = req.query.userId as string || 'user1';
  const card = getAllUserCards(userId).find(c => c.id === req.params.id);
  if (!card) return res.status(404).json({ error: 'Card not found' });
  res.json(card);
});

// POST /cards/:id/review - review a card for current user
router.post('/:id/review', (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string || 'user1';
    const { rating, virtualNow } = req.body; // Expected: rating 1-4, virtualNow as ISO string

    // Find the UserCard
    const userCard = userCards.find(
      (uc) => uc.userId === userId && uc.cardId === req.params.id
    );

    if (!userCard) {
      return res.status(404).json({ error: 'Card not found' });
    }

    if (![1, 2, 3, 4].includes(rating)) {
      return res.status(400).json({ error: 'Invalid rating (must be 1–4)' });
    }

    // Parse virtual time if provided
    const virtualTime = virtualNow ? new Date(virtualNow) : undefined;

    // Run FSRS scheduling algorithm with virtual time
    const { updatedCard, log } = scheduleCard(userCard, rating as any, virtualTime);

    // Update the UserCard's state in memory
    Object.assign(userCard, updatedCard);
    userCard.last_review = updatedCard.last_review;

    // Add to review log
    if (!userCard.reviewLog) userCard.reviewLog = [];
    userCard.reviewLog.push(log);

    // Merge with card content and return
    const card = cards.find((c) => c.id === userCard.cardId);
    if (!card) {
      return res.status(500).json({ error: 'Card content not found' });
    }

    const result = { ...card, ...userCard };
    res.json(result);
  } catch (err) {
    console.error('Error in /cards/:id/review:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      details: err instanceof Error ? err.message : String(err),
    });
  }
});


export default router; 