import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Box,
  Grid,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import {
  School,
  Add,
  LibraryBooks,
  Assessment,
  Schedule,
  TrendingUp,
  PlayArrow,
  AutoAwesome,
  CheckCircle
} from '@mui/icons-material';
import { ankiApi } from '../services/ankiApi';
import { AnkiDeck, UserCard } from '../types/anki';
import { useReviewContext } from '../contexts/ReviewContext';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [decks, setDecks] = useState<AnkiDeck[]>([]);
  const [dueCards, setDueCards] = useState<UserCard[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as any });

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
      const [decksData, dueCardsData, statsData] = await Promise.all([
        ankiApi.getDecks(),
        ankiApi.getUserCardsDue(userId),
        ankiApi.getStats(),
      ]);
      setDecks(decksData);
      setDueCards(dueCardsData);
      setStats(statsData);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImportSampleData = async () => {
    try {
      await ankiApi.importSampleData();
      setSnackbar({ open: true, message: 'Sample data imported successfully!', severity: 'success' });
      loadData(); // Reload data
    } catch (error) {
      console.error('Error importing sample data:', error);
      setSnackbar({ open: true, message: 'Error importing sample data', severity: 'error' });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleStartReview = (deckId?: number) => {
    const params = new URLSearchParams();
    params.set('user_id', userId);
    if (deckId) {
      params.set('deck_id', deckId.toString());
    }
    navigate(`/review?${params.toString()}`);
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

  const totalDueCards = dueCards.length;
  const totalDecks = decks.length;
  const activeDecks = decks.filter(deck => deck.card_count > 0).length;
  const completedDecks = decks.filter(deck => deck.is_completed).length;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome to FSRS-TS Anki
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
        Your spaced repetition learning companion
      </Typography>

      {/* Header with real-time update indicator */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Dashboard
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

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <LibraryBooks color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">{totalDecks}</Typography>
              </Box>
              <Typography color="textSecondary">Total Decks</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Assessment color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">{activeDecks}</Typography>
              </Box>
              <Typography color="textSecondary">Active Decks</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Schedule color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">{totalDueCards}</Typography>
              </Box>
              <Typography color="textSecondary">Due Cards</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUp color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  {stats?.user_stats?.progress_percentage || 0}%
                </Typography>
              </Box>
              <Typography color="textSecondary">Progress</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Completion Status */}
      {completedDecks > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Completion Status
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Chip
                icon={<CheckCircle />}
                label={`${completedDecks} decks completed`}
                color="success"
                variant="filled"
              />
              <Typography variant="body2" color="textSecondary">
                {completedDecks} out of {totalDecks} decks fully completed
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<PlayArrow />}
                onClick={() => handleStartReview()}
                disabled={totalDueCards === 0}
                sx={{ height: 56 }}
              >
                Review All ({totalDueCards})
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<School />}
                onClick={() => navigate('/decks')}
                sx={{ height: 56 }}
              >
                Browse Decks
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Assessment />}
                onClick={() => navigate('/browse')}
                sx={{ height: 56 }}
              >
                Browse Cards
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<TrendingUp />}
                onClick={() => navigate('/stats')}
                sx={{ height: 56 }}
              >
                View Stats
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Due Cards Preview */}
      {dueCards.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Due Cards Preview
            </Typography>
            <Grid container spacing={2}>
              {dueCards.slice(0, 6).map((card) => (
                <Grid item xs={12} sm={6} md={4} key={card.card_id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" noWrap>
                        {card.front || `Card ${card.card_id}`}
                      </Typography>
                      <Chip
                        size="small"
                        label={`Deck: ${card.deck_id}`}
                        sx={{ mt: 1 }}
                      />
                      <Chip
                        size="small"
                        label={`Due: ${card.next_review.days_until} days`}
                        color={card.next_review.days_until < 0 ? 'error' : 'default'}
                        sx={{ mt: 1, ml: 1 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            {dueCards.length > 6 && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/review?user_id=${userId}`)}
                >
                  View All Due Cards ({dueCards.length})
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Reviews */}
      {lastReviewEvent && lastReviewEvent.type === 'card_reviewed' && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Review Activity
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Latest FSRS parameter changes from your study sessions
            </Typography>
            <Box display="flex" alignItems="center" p={2} bgcolor="success.light" borderRadius={1}>
              <AutoAwesome sx={{ mr: 1 }} color="success" />
              <Typography>
                Card reviewed with rating {lastReviewEvent.data?.rating} • 
                Stability: {lastReviewEvent.data?.newStability?.toFixed(2)} • 
                Difficulty: {lastReviewEvent.data?.newDifficulty?.toFixed(2)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Deck Overview */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Deck Overview
          </Typography>
          <Grid container spacing={2}>
            {decks.slice(0, 8).map((deck) => (
              <Grid item xs={12} sm={6} md={3} key={deck.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      {deck.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {deck.card_count} cards
                    </Typography>
                    {deck.is_completed && (
                      <Chip
                        label="Completed"
                        size="small"
                        color="success"
                        sx={{ mb: 1 }}
                      />
                    )}
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleStartReview(deck.id)}
                      disabled={deck.card_count === 0}
                      fullWidth
                    >
                      Review
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          {decks.length > 8 && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/decks')}
              >
                View All Decks ({decks.length})
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Dashboard; 