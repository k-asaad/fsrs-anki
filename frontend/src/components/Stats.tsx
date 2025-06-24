import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Button,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Psychology as PsychologyIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { ankiApi } from '../services/ankiApi';
import { useReviewContext } from '../contexts/ReviewContext';

interface DetailedUserStats {
  summary: {
    total_cards: number;
    completed_cards: number;
    due_cards: number;
    learning_cards: number;
    review_cards: number;
    new_cards: number;
    progress_percentage: number;
    avg_stability: number;
    avg_difficulty: number;
    cards_due_soon: number;
    recently_completed: number;
  };
  cards: Array<{
    card_id: number;
    deck_id: number;
    front: string;
    back: string;
    tags: string[];
    stability: number;
    difficulty: number;
    state: string;
    reps: number;
    lapses: number;
    due: number;
    elapsed_days: number;
    scheduled_days: number;
    last_review: number | null;
    next_review: {
      date: string;
      days_until: number;
      state: string;
      stability: number;
      difficulty: number;
    };
    recent_reviews: Array<{
      rating: number;
      rating_text: string;
      state: string;
      stability: number;
      difficulty: number;
      review_date: string;
      days_ago: number;
    }>;
    is_completed: boolean;
    is_due: boolean;
  }>;
  cards_due_soon: any[];
  recently_completed: any[];
}

const Stats: React.FC = () => {
  const [stats, setStats] = useState<DetailedUserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { lastReviewEvent } = useReviewContext();
  
  // Review dialog state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewResult, setReviewResult] = useState<any>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewHistory, setReviewHistory] = useState<any[]>([]);
  
  // Review history dialog state
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [cardReviewHistory, setCardReviewHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await ankiApi.getDetailedUserStats('default_user');
      console.log('[DEBUG] Stats fetched from backend:', data);
      setStats(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Auto-refresh stats after a review event
  useEffect(() => {
    if (lastReviewEvent && lastReviewEvent.type === 'card_reviewed') {
      fetchStats();
    }
  }, [lastReviewEvent]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'New': return 'default';
      case 'Learning': return 'warning';
      case 'Review': return 'success';
      case 'Relearning': return 'error';
      default: return 'default';
    }
  };

  const getRatingColor = (rating: number) => {
    switch (rating) {
      case 1: return 'error'; // Again
      case 2: return 'warning'; // Hard
      case 3: return 'success'; // Good
      case 4: return 'info'; // Easy
      default: return 'default';
    }
  };

  const handleReviewCard = (card: any) => {
    try {
      // Close any open dialogs first
      setHistoryDialogOpen(false);
      setCardReviewHistory([]);
      setHistoryLoading(false);
      
      setSelectedCard(card);
      setShowAnswer(false);
      setReviewResult(null);
      setReviewCount(0);
      setReviewHistory([]);
      
      // Small delay to ensure state is updated before opening dialog
      setTimeout(() => {
        setReviewDialogOpen(true);
      }, 50);
    } catch (error) {
      console.error('Error opening review dialog:', error);
      setSnackbarMessage('Error opening review dialog');
      setSnackbarOpen(true);
    }
  };

  const handleAnswerCard = async (rating: number) => {
    if (!selectedCard) return;
    
    try {
      const result = await ankiApi.answerCardWithFSRS('default_user', selectedCard.card_id, rating);
      console.log('[DEBUG] Review API response:', result);
      if (result.success) {
        setReviewResult(result);
        setReviewCount(prev => prev + 1);
        setReviewHistory(prev => [...prev, {
          rating,
          ratingText: getRatingText(rating),
          timestamp: new Date(),
          result
        }]);
        // Update the selected card with new values for next review
        setSelectedCard((prev: any) => ({
          ...prev,
          stability: result.card.stability,
          difficulty: result.card.difficulty,
          state: result.card.state,
          reps: result.card.reps,
          lapses: result.card.lapses,
          due: result.card.due,
          next_review: result.next_review
        }));
        setShowAnswer(false); // Reset showAnswer so user must click again
        setSnackbarMessage(`Card reviewed with rating: ${getRatingText(rating)} (Review #${reviewCount + 1})`);
        setSnackbarOpen(true);
        // Refresh stats after a short delay
        setTimeout(() => {
          fetchStats();
        }, 1000);
      } else {
        setSnackbarMessage(`Error reviewing card: ${result.error}`);
        setSnackbarOpen(true);
      }
    } catch (error) {
      setSnackbarMessage(`Error reviewing card: ${error}`);
      setSnackbarOpen(true);
    }
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return 'Again';
      case 2: return 'Hard';
      case 3: return 'Good';
      case 4: return 'Easy';
      default: return 'Unknown';
    }
  };

  const handleCloseReviewDialog = () => {
    try {
      setReviewDialogOpen(false);
      // Small delay before clearing state
      setTimeout(() => {
        setSelectedCard(null);
        setShowAnswer(false);
        setReviewResult(null);
        setReviewCount(0);
        setReviewHistory([]);
      }, 100);
    } catch (error) {
      console.error('Error closing review dialog:', error);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleViewReviewHistory = async (card: any) => {
    try {
      // Close review dialog if open
      setReviewDialogOpen(false);
      setShowAnswer(false);
      setReviewResult(null);
      setReviewCount(0);
      setReviewHistory([]);
      
      setSelectedCard(card);
      setHistoryLoading(true);
      
      // Small delay before opening history dialog
      setTimeout(() => {
        setHistoryDialogOpen(true);
      }, 50);
      
      const result = await ankiApi.getUserCardReviewHistory('default_user', card.card_id, 50);
      if (result.success) {
        setCardReviewHistory(result.reviews);
      } else {
        setCardReviewHistory([]);
        setSnackbarMessage(`Error loading review history: ${result.error}`);
        setSnackbarOpen(true);
      }
    } catch (error) {
      setCardReviewHistory([]);
      setSnackbarMessage(`Error loading review history: ${error}`);
      setSnackbarOpen(true);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCloseHistoryDialog = () => {
    try {
      setHistoryDialogOpen(false);
      // Small delay before clearing state
      setTimeout(() => {
        setCardReviewHistory([]);
        setHistoryLoading(false);
      }, 100);
    } catch (error) {
      console.error('Error closing history dialog:', error);
    }
  };

  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

  // Custom Modal component to avoid Dialog issues
  const CustomModal: React.FC<{
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
  }> = ({ open, onClose, children, title }) => {
    if (!open || !isBrowser) return null;

    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2
        }}
        onClick={onClose}
      >
        <Box
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            maxWidth: '90vw',
            width: '800px',
            maxHeight: '90vh',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">{title}</Typography>
            </Box>
          )}
          <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
            {children}
          </Box>
        </Box>
      </Box>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Loading Statistics...
        </Typography>
      </Container>
    );
  }

  if (!stats) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Error loading statistics
        </Typography>
      </Container>
    );
  }

  const completedCards = stats.cards.filter(card => card.is_completed);

  // Helper to check if a card was just reviewed (within 60s)
  const isRecentlyReviewed = (cardId: number) => {
    if (!lastReviewEvent || lastReviewEvent.type !== 'card_reviewed') return false;
    if (lastReviewEvent.data?.cardId !== cardId) return false;
    return Date.now() - lastReviewEvent.timestamp < 60000;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Statistics
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="body2" color="text.secondary">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Typography>
          <Tooltip title="Refresh Statistics">
            <IconButton onClick={fetchStats} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Cards
              </Typography>
              <Typography variant="h4">
                {stats.summary.total_cards}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Due Cards
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.summary.due_cards}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Progress
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.summary.progress_percentage}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Completed Cards
              </Typography>
              <Typography variant="h4" color="primary.main">
                {stats.summary.completed_cards}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* FSRS Parameters Summary */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <PsychologyIcon color="primary" />
                <Typography color="text.secondary" gutterBottom>
                  Avg Stability
                </Typography>
              </Box>
              <Typography variant="h5">
                {stats.summary.avg_stability}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <TrendingUpIcon color="secondary" />
                <Typography color="text.secondary" gutterBottom>
                  Avg Difficulty
                </Typography>
              </Box>
              <Typography variant="h5">
                {stats.summary.avg_difficulty}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <ScheduleIcon color="info" />
                <Typography color="text.secondary" gutterBottom>
                  Due Soon (7d)
                </Typography>
              </Box>
              <Typography variant="h5" color="warning.main">
                {stats.summary.cards_due_soon}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <CheckCircleIcon color="success" />
                <Typography color="text.secondary" gutterBottom>
                  Recently Completed
                </Typography>
              </Box>
              <Typography variant="h5" color="success.main">
                {stats.summary.recently_completed}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Card States */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Learning Cards
              </Typography>
              <Typography variant="h5" color="warning.main">
                {stats.summary.learning_cards}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Review Cards
              </Typography>
              <Typography variant="h5" color="success.main">
                {stats.summary.review_cards}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                New Cards
              </Typography>
              <Typography variant="h5" color="info.main">
                {stats.summary.new_cards}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Decks
              </Typography>
              <Typography variant="h5">
                {new Set(stats.cards.map(card => card.deck_id)).size}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Completed Cards with FSRS Details */}
      {completedCards.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Completed Cards with FSRS Parameters
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Card</TableCell>
                    <TableCell>State</TableCell>
                    <TableCell>Stability</TableCell>
                    <TableCell>Difficulty</TableCell>
                    <TableCell>Next Review</TableCell>
                    <TableCell>Reps</TableCell>
                    <TableCell>Lapses</TableCell>
                    <TableCell>Recent Reviews</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {completedCards.slice(0, 20).map((card) => (
                    <TableRow key={card.card_id} sx={isRecentlyReviewed(card.card_id) ? { backgroundColor: 'rgba(56, 255, 56, 0.12)' } : {}}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {card.front.substring(0, 50)}...
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Deck ID: {card.deck_id}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={card.state} 
                          size="small" 
                          color={getStateColor(card.state) as any}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {card.stability.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {card.difficulty.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          {card.next_review ? (
                            <>
                              <Typography variant="body2">
                                {card.next_review.days_until > 0
                                  ? `In ${card.next_review.days_until} days`
                                  : card.next_review.days_until === 0
                                    ? 'Today'
                                    : 'Overdue'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(card.next_review.date)}
                              </Typography>
                            </>
                          ) : (
                            (() => { console.warn('Card missing next_review:', card); return <Typography variant="body2" color="text.secondary">N/A</Typography>; })()
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {card.reps}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color={card.lapses > 0 ? 'error' : 'text.secondary'}>
                          {card.lapses}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {card.recent_reviews.length > 0 && (
                          <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Typography variant="caption">
                                {card.recent_reviews.length} reviews
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Box>
                                {card.recent_reviews.map((review, index) => (
                                  <Box key={index} mb={1} p={1} bgcolor="grey.50" borderRadius={1}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                      <Chip 
                                        label={review.rating_text} 
                                        size="small" 
                                        color={getRatingColor(review.rating) as any}
                                      />
                                      <Typography variant="caption">
                                        {review.days_ago === 0 ? 'Today' : `${review.days_ago}d ago`}
                                      </Typography>
                                    </Box>
                                    <Typography variant="caption" display="block">
                                      Stability: {review.stability.toFixed(2)} → {card.stability.toFixed(2)}
                                    </Typography>
                                    <Typography variant="caption" display="block">
                                      Difficulty: {review.difficulty.toFixed(2)} → {card.difficulty.toFixed(2)}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            </AccordionDetails>
                          </Accordion>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="Review Card">
                            <IconButton 
                              size="small" 
                              onClick={() => handleReviewCard(card)}
                              color="primary"
                            >
                              <PlayArrowIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Review Multiple Times">
                            <IconButton 
                              size="small" 
                              onClick={() => handleReviewCard(card)}
                              color="secondary"
                            >
                              <PlayArrowIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Review History">
                            <IconButton 
                              size="small" 
                              onClick={() => handleViewReviewHistory(card)}
                              color="info"
                            >
                              <TrendingUpIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {completedCards.length > 20 && (
              <Typography variant="body2" color="text.secondary" mt={2}>
                Showing first 20 of {completedCards.length} completed cards
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cards Due Soon */}
      {stats.cards_due_soon.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Cards Due Soon (Next 7 Days)
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Card</TableCell>
                    <TableCell>State</TableCell>
                    <TableCell>Due In</TableCell>
                    <TableCell>Current Stability</TableCell>
                    <TableCell>Current Difficulty</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.cards_due_soon.map((card) => (
                    <TableRow key={card.card_id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {card.front.substring(0, 50)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={card.state} 
                          size="small" 
                          color={getStateColor(card.state) as any}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="warning.main" fontWeight="bold">
                          {card.next_review
                            ? (card.next_review.days_until === 0
                                ? 'Today'
                                : `${card.next_review.days_until} days`)
                            : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {card.stability.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {card.difficulty.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="Review Card">
                            <IconButton 
                              size="small" 
                              onClick={() => handleReviewCard(card)}
                              color="primary"
                            >
                              <PlayArrowIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Review Multiple Times">
                            <IconButton 
                              size="small" 
                              onClick={() => handleReviewCard(card)}
                              color="secondary"
                            >
                              <PlayArrowIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Review History">
                            <IconButton 
                              size="small" 
                              onClick={() => handleViewReviewHistory(card)}
                              color="info"
                            >
                              <TrendingUpIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Review Cards Multiple Times Section */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Review Cards Multiple Times (FSRS Parameter Testing)
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Select any card to review it multiple times and observe how FSRS parameters (stability, difficulty, state) change with different ratings.
          </Typography>
          
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Card</TableCell>
                  <TableCell>Current State</TableCell>
                  <TableCell>Current Stability</TableCell>
                  <TableCell>Current Difficulty</TableCell>
                  <TableCell>Total Reps</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.cards.slice(0, 10).map((card) => (
                  <TableRow key={card.card_id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {card.front.substring(0, 60)}...
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Deck ID: {card.deck_id} | Card ID: {card.card_id}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={card.state} 
                        size="small" 
                        color={getStateColor(card.state) as any}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {card.stability.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {card.difficulty.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {card.reps} reps, {card.lapses} lapses
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Review Card Once">
                          <IconButton 
                            size="small" 
                            onClick={() => handleReviewCard(card)}
                            color="primary"
                          >
                            <PlayArrowIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Review Multiple Times (FSRS Testing)">
                          <IconButton 
                            size="small" 
                            onClick={() => handleReviewCard(card)}
                            color="secondary"
                            sx={{ 
                              bgcolor: 'secondary.main', 
                              color: 'white',
                              '&:hover': { bgcolor: 'secondary.dark' }
                            }}
                          >
                            <PlayArrowIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View Review History">
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewReviewHistory(card)}
                            color="info"
                          >
                            <TrendingUpIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              <strong>Instructions:</strong> Click the purple "Review Multiple Times" button to open a review dialog where you can:
            </Typography>
            <ul style={{ marginTop: 8, marginBottom: 8 }}>
              <li>Review the same card multiple times in succession</li>
              <li>See how FSRS parameters change with each rating</li>
              <li>Observe the learning curve and state transitions</li>
              <li>Test different rating patterns (e.g., all "Good", alternating "Hard"/"Easy")</li>
            </ul>
            <Typography variant="body2" color="text.secondary">
              This is perfect for understanding how the FSRS algorithm works and testing different scenarios!
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      {isBrowser && (
        <CustomModal
          open={reviewDialogOpen && !!selectedCard}
          onClose={handleCloseReviewDialog}
          title={selectedCard ? `Review Card: ${selectedCard.front.substring(0, 50)}...` : 'Review Card'}
        >
          {selectedCard && (
            <Box>
              {/* Card Info */}
              <Box mb={2}>
                <Typography variant="caption" color="text.secondary">
                  Card ID: {selectedCard.card_id} | Reps: {selectedCard.reps} | Lapses: {selectedCard.lapses}
                  {reviewCount > 0 && ` | Reviews in this session: ${reviewCount}`}
                </Typography>
              </Box>

              {/* Question */}
              <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                  Question:
                </Typography>
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body1">
                    {selectedCard.front}
                  </Typography>
                </Card>
              </Box>

              {/* Answer */}
              <Box mb={3}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6">
                    Answer:
                  </Typography>
                  <IconButton 
                    onClick={() => setShowAnswer(!showAnswer)}
                    size="small"
                  >
                    {showAnswer ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </Box>
                {showAnswer && (
                  <Card variant="outlined" sx={{ p: 2, bgcolor: 'lightgreen' }}>
                    <Typography variant="body1">
                      {selectedCard.back}
                    </Typography>
                  </Card>
                )}
              </Box>

              {/* Current FSRS Parameters */}
              <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                  Current FSRS Parameters:
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>State:</strong> {selectedCard.state}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Stability:</strong> {selectedCard.stability.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Difficulty:</strong> {selectedCard.difficulty.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Next Review:</strong> {selectedCard.next_review
                        ? (selectedCard.next_review.days_until > 0
                            ? `In ${selectedCard.next_review.days_until} days`
                            : selectedCard.next_review.days_until === 0
                              ? 'Today'
                              : 'Overdue')
                        : 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Review History */}
              {reviewHistory.length > 0 && (
                <Box mb={3}>
                  <Typography variant="h6" gutterBottom>
                    Review History (This Session):
                  </Typography>
                  <Box maxHeight={200} overflow="auto">
                    {reviewHistory.map((review, index) => (
                      <Box key={index} mb={1} p={1} bgcolor="grey.100" borderRadius={1}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Chip 
                            label={review.ratingText} 
                            size="small" 
                            color={getRatingColor(review.rating) as any}
                          />
                          <Typography variant="caption">
                            Review #{index + 1} at {review.timestamp.toLocaleTimeString()}
                          </Typography>
                        </Box>
                        <Typography variant="caption" display="block">
                          Stability: {review.result.card.stability.toFixed(2)} | 
                          Difficulty: {review.result.card.difficulty.toFixed(2)} | 
                          State: {review.result.card.state}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Review Result */}
              {reviewResult && (
                <Box mb={3}>
                  <Alert severity="success">
                    <Typography variant="h6" gutterBottom>
                      Review #{reviewCount} Completed!
                    </Typography>
                    <Typography variant="body2">
                      New Stability: {reviewResult.card.stability.toFixed(2)} (was {selectedCard.stability.toFixed(2)})
                    </Typography>
                    <Typography variant="body2">
                      New Difficulty: {reviewResult.card.difficulty.toFixed(2)} (was {selectedCard.difficulty.toFixed(2)})
                    </Typography>
                    <Typography variant="body2">
                      New State: {reviewResult.card.state} (was {selectedCard.state})
                    </Typography>
                    <Typography variant="body2">
                      Next Review: {reviewResult && reviewResult.next_review
                        ? (reviewResult.next_review.days_until > 0
                            ? `In ${reviewResult.next_review.days_until} days`
                            : 'Today')
                        : 'N/A'}
                    </Typography>
                  </Alert>
                </Box>
              )}

              {/* Answer Buttons */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  How well did you know this card? {reviewCount > 0 && `(Review #${reviewCount + 1})`}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={3}>
                    <Button
                      variant="contained"
                      color="error"
                      fullWidth
                      onClick={() => handleAnswerCard(1)}
                      disabled={!showAnswer}
                    >
                      Again (1)
                    </Button>
                  </Grid>
                  <Grid item xs={3}>
                    <Button
                      variant="contained"
                      color="warning"
                      fullWidth
                      onClick={() => handleAnswerCard(2)}
                      disabled={!showAnswer}
                    >
                      Hard (2)
                    </Button>
                  </Grid>
                  <Grid item xs={3}>
                    <Button
                      variant="contained"
                      color="success"
                      fullWidth
                      onClick={() => handleAnswerCard(3)}
                      disabled={!showAnswer}
                    >
                      Good (3)
                    </Button>
                  </Grid>
                  <Grid item xs={3}>
                    <Button
                      variant="contained"
                      color="info"
                      fullWidth
                      onClick={() => handleAnswerCard(4)}
                      disabled={!showAnswer}
                    >
                      Easy (4)
                    </Button>
                  </Grid>
                </Grid>
                {reviewCount > 0 && (
                  <Box mt={2} textAlign="center">
                    <Typography variant="body2" color="text.secondary">
                      You can continue reviewing this card multiple times to see how FSRS parameters change!
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Close Button */}
              <Box mt={3} textAlign="center">
                <Button onClick={handleCloseReviewDialog} variant="outlined">
                  Close
                </Button>
              </Box>
            </Box>
          )}
        </CustomModal>
      )}

      {/* Review History Dialog */}
      {isBrowser && (
        <CustomModal
          open={historyDialogOpen && !!selectedCard}
          onClose={handleCloseHistoryDialog}
          title={selectedCard ? `Review History: ${selectedCard.front.substring(0, 50)}...` : 'Review History'}
        >
          {historyLoading ? (
            <Box textAlign="center" py={4}>
              <Typography>Loading review history...</Typography>
            </Box>
          ) : cardReviewHistory.length > 0 ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                Complete Review History
              </Typography>
              <Box maxHeight={400} overflow="auto">
                {cardReviewHistory.map((review, index) => (
                  <Box key={review.id} mb={2} p={2} bgcolor="grey.50" borderRadius={1}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Chip 
                        label={review.rating_text} 
                        size="small" 
                        color={getRatingColor(review.rating) as any}
                      />
                      <Typography variant="caption">
                        {review.review_date} ({review.days_ago === 0 ? 'Today' : `${review.days_ago} days ago`})
                      </Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>State:</strong> {review.state_text}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Stability:</strong> {review.stability.toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Difficulty:</strong> {review.difficulty.toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Elapsed Days:</strong> {review.elapsed_days}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Scheduled Days:</strong> {review.scheduled_days}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Review Time:</strong> {review.review_time}s
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <Box textAlign="center" py={4}>
              <Typography>No review history found for this card.</Typography>
            </Box>
          )}

          {/* Close Button */}
          <Box mt={3} textAlign="center">
            <Button onClick={handleCloseHistoryDialog} variant="outlined">
              Close
            </Button>
          </Box>
        </CustomModal>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Stats; 