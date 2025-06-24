import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Grid,
  LinearProgress,
  Tooltip,
  IconButton,
  Alert,
  Divider,
} from '@mui/material';
import {
  Schedule,
  TrendingUp,
  Psychology,
  Assessment,
  Info,
  AutoAwesome,
  Timeline,
} from '@mui/icons-material';
import { UserCard, FSRSParameters } from '../types/anki';
import { useReviewContext } from '../contexts/ReviewContext';

interface FSRSInfoProps {
  userCard: UserCard;
  fsrsParams?: FSRSParameters;
}

const FSRSInfo: React.FC<FSRSInfoProps> = ({ userCard, fsrsParams }) => {
  const { lastReviewEvent } = useReviewContext();

  const getStateColor = (state: string) => {
    switch (state) {
      case 'New': return 'primary';
      case 'Learning': return 'warning';
      case 'Review': return 'success';
      case 'Relearning': return 'error';
      default: return 'default';
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 1.5) return 'success';
    if (difficulty <= 2.5) return 'warning';
    return 'error';
  };

  const getStabilityColor = (stability: number) => {
    if (stability >= 10) return 'success';
    if (stability >= 5) return 'warning';
    return 'error';
  };

  const formatDaysUntil = (days: number) => {
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `Due in ${days} days`;
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return 'Again';
      case 2: return 'Hard';
      case 3: return 'Good';
      case 4: return 'Easy';
      default: return `Rating ${rating}`;
    }
  };

  // Check if this card was just reviewed
  const isRecentlyReviewed = lastReviewEvent && 
    lastReviewEvent.type === 'card_reviewed' && 
    lastReviewEvent.data?.cardId === userCard.card_id;

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        {/* Header with enhanced visibility */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center">
            <Psychology sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">
              FSRS Learning Parameters
            </Typography>
            {isRecentlyReviewed && (
              <Chip
                icon={<AutoAwesome />}
                label="Just Updated"
                color="success"
                size="small"
                sx={{ ml: 2 }}
              />
            )}
          </Box>
          <Tooltip title="Free Spaced Repetition Scheduler algorithm parameters">
            <IconButton size="small">
              <Info />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Real-time update indicator */}
        {isRecentlyReviewed && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              🎯 Card reviewed with rating <strong>{getRatingText(lastReviewEvent.data.rating)}</strong>
              {lastReviewEvent.data.newStability && (
                <span> • Stability: {lastReviewEvent.data.newStability.toFixed(2)}</span>
              )}
              {lastReviewEvent.data.newDifficulty && (
                <span> • Difficulty: {lastReviewEvent.data.newDifficulty.toFixed(2)}</span>
              )}
            </Typography>
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Next Review Info - Enhanced */}
          <Grid item xs={12} md={6}>
            <Box mb={3}>
              <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                <Schedule sx={{ mr: 1, verticalAlign: 'middle' }} />
                Next Review
              </Typography>
              <Box display="flex" alignItems="center" mb={1}>
                <Typography variant="h6" color="primary">
                  {formatDaysUntil(userCard.next_review.days_until)}
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                {new Date(userCard.next_review.date).toLocaleDateString()} at{' '}
                {new Date(userCard.next_review.date).toLocaleTimeString()}
              </Typography>
            </Box>

            <Box mb={3}>
              <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
                Learning State
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                <Chip
                  label={userCard.state}
                  color={getStateColor(userCard.state) as any}
                  size="medium"
                  variant="filled"
                />
                <Chip
                  label={`${userCard.reps} reps`}
                  variant="outlined"
                  size="medium"
                />
                {userCard.lapses > 0 && (
                  <Chip
                    label={`${userCard.lapses} lapses`}
                    color="error"
                    variant="outlined"
                    size="medium"
                  />
                )}
              </Box>
            </Box>
          </Grid>

          {/* FSRS Parameters - Enhanced */}
          <Grid item xs={12} md={6}>
            <Box mb={3}>
              <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                Stability
              </Typography>
              <Box display="flex" alignItems="center" mb={1}>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((userCard.stability / 10) * 100, 100)}
                  color={getStabilityColor(userCard.stability) as any}
                  sx={{ flexGrow: 1, mr: 2, height: 8, borderRadius: 4 }}
                />
                <Typography variant="h6" color="primary">
                  {userCard.stability.toFixed(1)}
                </Typography>
              </Box>
              <Typography variant="caption" color="textSecondary">
                Higher stability = longer intervals between reviews
              </Typography>
            </Box>

            <Box mb={3}>
              <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                <Timeline sx={{ mr: 1, verticalAlign: 'middle' }} />
                Difficulty
              </Typography>
              <Box display="flex" alignItems="center" mb={1}>
                <LinearProgress
                  variant="determinate"
                  value={(userCard.difficulty / 3) * 100}
                  color={getDifficultyColor(userCard.difficulty) as any}
                  sx={{ flexGrow: 1, mr: 2, height: 8, borderRadius: 4 }}
                />
                <Typography variant="h6" color="primary">
                  {userCard.difficulty.toFixed(2)}
                </Typography>
              </Box>
              <Typography variant="caption" color="textSecondary">
                Lower difficulty = easier to remember
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                Scheduled Interval
              </Typography>
              <Typography variant="h6" color="primary">
                {userCard.scheduled_days} days
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Time until next review
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* FSRS Algorithm Parameters - Enhanced */}
        {fsrsParams && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box>
              <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                <Psychology sx={{ mr: 1, verticalAlign: 'middle' }} />
                Algorithm Configuration
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center" p={1} bgcolor="background.paper" borderRadius={1}>
                    <Typography variant="h6" color="primary">
                      {(fsrsParams.request_retention * 100).toFixed(0)}%
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Retention Target
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center" p={1} bgcolor="background.paper" borderRadius={1}>
                    <Typography variant="h6" color="primary">
                      {fsrsParams.maximum_interval}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Max Interval (days)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center" p={1} bgcolor="background.paper" borderRadius={1}>
                    <Typography variant="h6" color="primary">
                      {fsrsParams.enable_fuzz ? 'Yes' : 'No'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Fuzz Enabled
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center" p={1} bgcolor="background.paper" borderRadius={1}>
                    <Typography variant="h6" color="primary">
                      {fsrsParams.enable_short_term ? 'Yes' : 'No'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Short Term
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default FSRSInfo; 