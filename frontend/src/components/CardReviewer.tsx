import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Typography,
  Button,
  Card,
  CardContent,
  Box,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
  Paper
} from '@mui/material';
import {
  School,
  Visibility,
  CheckCircle,
  Cancel,
  Timer,
  TrendingUp
} from '@mui/icons-material';
import { ankiApi } from '../services/ankiApi';
import { UserCard } from '../types/anki';
import FSRSInfo from './FSRSInfo';
import { useReviewContext } from '../contexts/ReviewContext';

interface CardReviewerProps {
  onReviewComplete?: () => void;
}

const CardReviewer: React.FC<CardReviewerProps> = ({ onReviewComplete }) => {
  const [searchParams] = useSearchParams();
  const [currentCard, setCurrentCard] = useState<UserCard | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [fsrsParams, setFsrsParams] = useState<any>(null);

  const { triggerReviewEvent } = useReviewContext();

  const deckId = searchParams.get('deck_id') ? parseInt(searchParams.get('deck_id')!) : undefined;
  const userId = searchParams.get('user_id') || 'default_user'; // Default user for now

  useEffect(() => {
    loadNextCard();
  }, [deckId, userId]);

  const loadNextCard = async () => {
    try {
      setLoading(true);
      setShowAnswer(false);
      const card = await ankiApi.getNextUserCard(userId, deckId);
      setCurrentCard(card);
      if (!card) {
        setSessionComplete(true);
      } else {
        // Get FSRS parameters for this user
        try {
          const userCardData = await ankiApi.getUserCard(userId, card.card_id);
          if (userCardData.success) {
            setFsrsParams(userCardData.fsrs_params);
          }
        } catch (err) {
          console.warn('Could not load FSRS parameters:', err);
        }
      }
    } catch (err) {
      setError('Failed to load next card');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleAnswer = async (ease: number) => {
    if (!currentCard) {
      console.log(`[DEBUG] handleAnswer called but no currentCard`);
      return;
    }

    console.log(`[DEBUG] handleAnswer called with ease=${ease} for card=${currentCard.card_id}`);
    console.log(`[DEBUG] Current card state:`, currentCard);

    try {
      console.log(`[DEBUG] About to call ankiApi.answerCardWithFSRS`);
      const result = await ankiApi.answerCardWithFSRS(userId, currentCard.card_id, ease);
      console.log(`[DEBUG] ankiApi.answerCardWithFSRS returned:`, result);
      
      if (result && result.success) {
        console.log(`[DEBUG] Review successful, processing result`);
        // Success case - existing logic
        triggerReviewEvent({
          type: 'card_reviewed',
          data: {
            cardId: currentCard.card_id,
            rating: ease,
            userId,
            deckId,
            newStability: result.card?.stability,
            newDifficulty: result.card?.difficulty,
            newState: result.card?.state,
            nextReview: result.next_review
          }
        });

        triggerReviewEvent({
          type: 'fsrs_updated',
          data: {
            cardId: currentCard.card_id,
            userId,
            stability: result.card?.stability,
            difficulty: result.card?.difficulty,
            state: result.card?.state,
            reps: result.card?.reps,
            lapses: result.card?.lapses
          }
        });

        triggerReviewEvent({
          type: 'stats_updated',
          data: {
            userId,
            deckId,
            reviewCount: reviewCount + 1,
            correctCount: ease >= 3 ? correctCount + 1 : correctCount
          }
        });

        setReviewCount(prev => prev + 1);
        if (ease >= 3) {
          setCorrectCount(prev => prev + 1);
        }
        if (onReviewComplete) onReviewComplete();
        console.log(`[DEBUG] About to load next card`);
        loadNextCard();
      } else {
        // Error case - show error to user
        console.error(`[ERROR] Review failed - result indicates failure:`, result);
        const errorMessage = result ? result.error : 'Unknown error';
        console.error(`[ERROR] Error message: ${errorMessage}`);
        setError(`Review failed: ${errorMessage}`);
        // Don't load next card, let user try again
      }
    } catch (err) {
      console.error(`[ERROR] Exception in handleAnswer:`, err);
      console.error(`[ERROR] Error type:`, typeof err);
      console.error(`[ERROR] Error instanceof Error:`, err instanceof Error);
      if (err instanceof Error) {
        console.error(`[ERROR] Error message:`, err.message);
        console.error(`[ERROR] Error stack:`, err.stack);
      }
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`[ERROR] Setting error message: ${errorMessage}`);
      setError(`Network error: ${errorMessage}`);
    }
  };

  const getEaseButtonColor = (ease: number) => {
    switch (ease) {
      case 1: return 'error';
      case 2: return 'warning';
      case 3: return 'success';
      case 4: return 'primary';
      default: return 'default';
    }
  };

  const getEaseButtonText = (ease: number) => {
    switch (ease) {
      case 1: return 'Again';
      case 2: return 'Hard';
      case 3: return 'Good';
      case 4: return 'Easy';
      default: return '';
    }
  };

  const getEaseButtonIcon = (ease: number) => {
    switch (ease) {
      case 1: return <Cancel />;
      case 2: return <School />;
      case 3: return <Visibility />;
      case 4: return <TrendingUp />;
      default: return null;
    }
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

  if (sessionComplete) {
    return (
      <Box textAlign="center" py={4}>
        <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Review Complete!
        </Typography>
        <Typography variant="h6" color="textSecondary" gutterBottom>
          You reviewed {reviewCount} cards
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
          Accuracy: {reviewCount > 0 ? Math.round((correctCount / reviewCount) * 100) : 0}%
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => window.location.href = '/'}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  if (!currentCard) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h5" gutterBottom>
          No cards due for review
        </Typography>
        <Typography color="textSecondary" sx={{ mb: 2 }}>
          Great job! You're all caught up.
        </Typography>
        <Button
          variant="contained"
          onClick={() => window.location.href = '/'}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Progress Bar */}
      <Box mb={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="body2" color="textSecondary">
            Session Progress
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {reviewCount} reviewed
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={reviewCount > 0 ? Math.min((reviewCount / 20) * 100, 100) : 0}
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Box>

      {/* FSRS Information */}
      <FSRSInfo userCard={currentCard} fsrsParams={fsrsParams} />

      {/* Card */}
      <Card sx={{ maxWidth: 800, mx: 'auto', mb: 3 }}>
        <CardContent sx={{ p: 4 }}>
          {/* Question */}
          <Box mb={4}>
            <Typography variant="h5" gutterBottom>
              Question
            </Typography>
            <Paper
              elevation={1}
              sx={{
                p: 3,
                backgroundColor: '#f8f9fa',
                border: '1px solid #e9ecef',
                borderRadius: 2,
                minHeight: 100,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                {currentCard.front}
              </Typography>
            </Paper>
          </Box>

          {/* Answer */}
          {showAnswer && (
            <Box mb={4}>
              <Typography variant="h5" gutterBottom>
                Answer
              </Typography>
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  backgroundColor: '#e8f5e8',
                  border: '1px solid #c8e6c9',
                  borderRadius: 2,
                  minHeight: 100,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                  {currentCard.back}
                </Typography>
              </Paper>
            </Box>
          )}

          {/* Action Buttons */}
          <Box display="flex" justifyContent="center" gap={2}>
            {!showAnswer ? (
              <Button
                variant="contained"
                size="large"
                onClick={handleShowAnswer}
                startIcon={<Visibility />}
              >
                Show Answer
              </Button>
            ) : (
              <Grid container spacing={2} justifyContent="center">
                {[1, 2, 3, 4].map((ease) => (
                  <Grid item key={ease}>
                    <Button
                      variant="contained"
                      color={getEaseButtonColor(ease) as any}
                      size="large"
                      onClick={() => handleAnswer(ease)}
                      startIcon={getEaseButtonIcon(ease)}
                      sx={{ minWidth: 100 }}
                    >
                      {getEaseButtonText(ease)}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CardReviewer; 