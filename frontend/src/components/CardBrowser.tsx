import React, { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  Card,
  CardContent,
  Box,
  Grid,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Search,
  Visibility,
  School,
  Assessment,
  Timer,
  AutoAwesome
} from '@mui/icons-material';
import { ankiApi } from '../services/ankiApi';
import { AnkiCard, AnkiDeck } from '../types/anki';
import CardDetails from './CardDetails';
import { Card as CardType } from './types';
import { useReviewContext } from '../contexts/ReviewContext';

const CardBrowser: React.FC = () => {
  const [cards, setCards] = useState<AnkiCard[]>([]);
  const [decks, setDecks] = useState<AnkiDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeck, setSelectedDeck] = useState<number | null>(null);
  const [selectedCard, setSelectedCard] = useState<AnkiCard | null>(null);
  const [cardDetailOpen, setCardDetailOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const { lastReviewEvent } = useReviewContext();

  const userId = 'default_user'; // Default user for now

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Listen for review events and refresh data immediately
  useEffect(() => {
    if (lastReviewEvent && lastReviewEvent.type === 'card_reviewed') {
      // Refresh data immediately when a card is reviewed
      loadData();
      setLastUpdate(new Date());
    }
  }, [lastReviewEvent]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [decksData, cardsData] = await Promise.all([
        ankiApi.getDecks(),
        ankiApi.getCards(),
      ]);
      setDecks(decksData);
      setCards(cardsData);
    } catch (err) {
      setError('Failed to load cards');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const searchCards = async () => {
    try {
      const searchData = await ankiApi.searchCards(
        searchQuery,
        selectedDeck ? selectedDeck : undefined
      );
      setCards(searchData);
    } catch (err) {
      setError('Failed to search cards');
    }
  };

  const handleCardClick = (card: AnkiCard) => {
    setSelectedCard(card);
    setCardDetailOpen(true);
  };

  const handleStudyCard = (card: AnkiCard) => {
    // Navigate to review with specific card
    window.location.href = `/review?card_id=${card.card_id}`;
  };

  const handleRateCard = async (rating: number) => {
    if (!selectedCard) return;
    
    try {
      await ankiApi.reviewUserCard(userId, selectedCard.card_id, { ease: rating });
      // Refresh the card data
      await loadData();
    } catch (err) {
      console.error('Failed to rate card:', err);
    }
  };

  const convertAnkiCardToCard = (ankiCard: AnkiCard): CardType => {
    return {
      id: ankiCard.card_id.toString(),
      question: ankiCard.front,
      answer: ankiCard.back,
      topicId: ankiCard.deck_id.toString(),
      due: ankiCard.due ? new Date(ankiCard.due * 1000).toISOString() : undefined,
      state: ankiCard.queue.toString(),
      stability: 0, // Default values for missing properties
      difficulty: ankiCard.ease_factor,
      reps: ankiCard.reps,
      lapses: ankiCard.lapses,
      elapsed_days: 0,
      scheduled_days: ankiCard.interval
    };
  };

  const getDeckName = (deckId: number) => {
    const deck = decks.find(d => d.id === deckId);
    return deck ? deck.name : `Deck ${deckId}`;
  };

  const getDueStatus = (card: AnkiCard) => {
    if (card.due) {
      const dueDate = new Date(card.due * 1000);
      const now = new Date();
      const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return 'Overdue';
      if (diffDays === 0) return 'Due Today';
      if (diffDays === 1) return 'Due Tomorrow';
      return `Due in ${diffDays} days`;
    }
    return 'No due date';
  };

  const getDueStatusColor = (status: string) => {
    if (status === 'Overdue') return 'error';
    if (status === 'Due Today') return 'warning';
    if (status === 'Due Tomorrow') return 'info';
    return 'default';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header with real-time update indicator */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Card Browser
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Chip 
            label={`Last updated: ${lastUpdate.toLocaleTimeString()}`}
            size="small"
            variant="outlined"
            color="info"
          />
          {lastReviewEvent && lastReviewEvent.type === 'card_reviewed' && (
            <Chip
              icon={<AutoAwesome />}
              label="Real-time updates active"
              color="success"
              size="small"
            />
          )}
        </Box>
      </Box>

      {/* Real-time update notification */}
      {lastReviewEvent && lastReviewEvent.type === 'card_reviewed' && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="body2">
            ✅ Real-time update: Card reviewed with rating {lastReviewEvent.data?.rating} 
            • Stability: {lastReviewEvent.data?.newStability?.toFixed(2)} 
            • Difficulty: {lastReviewEvent.data?.newDifficulty?.toFixed(2)}
          </Typography>
        </Alert>
      )}

      {/* Search and Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search cards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Filter by Deck</InputLabel>
                <Select
                  value={selectedDeck}
                  label="Filter by Deck"
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedDeck(value === '' ? null : Number(value));
                  }}
                >
                  <MenuItem value="">
                    <em>All Decks</em>
                  </MenuItem>
                  {decks.map((deck) => (
                    <MenuItem key={deck.id} value={deck.id}>
                      {deck.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="textSecondary">
                {cards.length} cards found
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Cards Grid */}
      {cards.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No cards found
            </Typography>
            <Typography color="textSecondary">
              {searchQuery || selectedDeck ? 'Try adjusting your search criteria' : 'Create some cards to get started'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {cards.map((card) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={card.card_id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  },
                  ...(lastReviewEvent && 
                    lastReviewEvent.type === 'card_reviewed' && 
                    lastReviewEvent.data?.cardId === card.card_id && {
                      border: '2px solid #4caf50',
                      backgroundColor: '#f1f8e9'
                    })
                }}
                onClick={() => handleCardClick(card)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom noWrap>
                    {card.front || `Card ${card.card_id}`}
                  </Typography>
                  
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }} noWrap>
                    {card.back}
                  </Typography>

                  <Box display="flex" alignItems="center" mb={1}>
                    <Assessment sx={{ mr: 1, fontSize: 16 }} color="action" />
                    <Typography variant="caption" color="textSecondary">
                      {getDeckName(card.deck_id)}
                    </Typography>
                  </Box>

                  <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                    <Chip
                      label={getDueStatus(card)}
                      size="small"
                      color={getDueStatusColor(getDueStatus(card)) as any}
                      variant="outlined"
                    />
                    <Chip
                      label={`Reps: ${card.reps}`}
                      size="small"
                      variant="outlined"
                    />
                    {lastReviewEvent && 
                     lastReviewEvent.type === 'card_reviewed' && 
                     lastReviewEvent.data?.cardId === card.card_id && (
                      <Chip
                        icon={<AutoAwesome />}
                        label="Just reviewed"
                        size="small"
                        color="success"
                      />
                    )}
                  </Box>

                  <Box display="flex" gap={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick(card);
                      }}
                      sx={{ flex: 1 }}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<School />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStudyCard(card);
                      }}
                      sx={{ flex: 1 }}
                    >
                      Study
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Card Detail Dialog */}
      <Dialog
        open={cardDetailOpen}
        onClose={() => setCardDetailOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        {selectedCard && (
          <>
            <DialogTitle>
              Card Details
              <IconButton
                aria-label="close"
                onClick={() => setCardDetailOpen(false)}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                }}
              >
                <Visibility />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <CardDetails 
                card={convertAnkiCardToCard(selectedCard)} 
                onRate={handleRateCard}
                userId={userId}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCardDetailOpen(false)}>
                Close
              </Button>
              <Button
                variant="contained"
                startIcon={<School />}
                onClick={() => {
                  setCardDetailOpen(false);
                  handleStudyCard(selectedCard);
                }}
              >
                Study This Card
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default CardBrowser; 