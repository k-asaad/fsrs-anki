import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  School,
  Assessment,
} from '@mui/icons-material';
import { ankiApi } from '../services/ankiApi';
import { AnkiDeck } from '../types/anki';

const DeckBrowser: React.FC = () => {
  const [decks, setDecks] = useState<AnkiDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [selectedDeck, setSelectedDeck] = useState<AnkiDeck | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    try {
      setLoading(true);
      const decksData = await ankiApi.getDecks();
      setDecks(decksData);
    } catch (err) {
      setError('Failed to load decks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeck = async () => {
    if (!newDeckName.trim()) return;

    try {
      await ankiApi.createDeck({ name: newDeckName.trim() });
      setNewDeckName('');
      setCreateDialogOpen(false);
      loadDecks();
    } catch (err) {
      setError('Failed to create deck');
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, deck: AnkiDeck) => {
    setMenuAnchor(event.currentTarget);
    setSelectedDeck(deck);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedDeck(null);
  };

  const handleStudyDeck = (deck: AnkiDeck) => {
    // Navigate to review with deck filter
    window.location.href = `/review?deck_id=${deck.id}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Decks
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Deck
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {decks.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No decks found
            </Typography>
            <Typography color="textSecondary" sx={{ mb: 2 }}>
              Create your first deck to get started
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create First Deck
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {decks.map((deck) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={deck.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Typography variant="h6" gutterBottom sx={{ flexGrow: 1 }}>
                      {deck.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, deck)}
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>
                  
                  <Box display="flex" alignItems="center" mb={2}>
                    <Assessment sx={{ mr: 1, fontSize: 20 }} color="action" />
                    <Typography variant="body2" color="textSecondary">
                      {deck.card_count} cards
                    </Typography>
                  </Box>

                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip
                      label="Active"
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                    {deck.parent_id && (
                      <Chip
                        label="Subdeck"
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </CardContent>

                <Box sx={{ p: 2, pt: 0 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<School />}
                    onClick={() => handleStudyDeck(deck)}
                    disabled={deck.card_count === 0}
                  >
                    Study
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Deck Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Create New Deck</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Deck Name"
            fullWidth
            variant="outlined"
            value={newDeckName}
            onChange={(e) => setNewDeckName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateDeck()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateDeck} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deck Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          <Edit sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Delete sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default DeckBrowser; 