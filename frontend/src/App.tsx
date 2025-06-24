import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { AppBar, Toolbar, Typography, Container } from '@mui/material';
import { School } from '@mui/icons-material';

// Components
import Dashboard from './components/Dashboard';
import DeckBrowser from './components/DeckBrowser';
import CardReviewer from './components/CardReviewer';
import CardBrowser from './components/CardBrowser';
import Stats from './components/Stats';
import Navigation from './components/Navigation';

// Context
import { ReviewProvider } from './contexts/ReviewContext';

// Create a modern theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ReviewProvider>
        <Router>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* App Bar */}
            <AppBar position="static" elevation={1}>
              <Toolbar>
                <School sx={{ mr: 2 }} />
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                  FSRS-TS Anki
                </Typography>
              </Toolbar>
            </AppBar>

            {/* Main Content */}
            <Box sx={{ display: 'flex', flex: 1 }}>
              {/* Navigation Sidebar */}
              <Navigation />

              {/* Content Area */}
              <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Container maxWidth="xl">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/decks" element={<DeckBrowser />} />
                    <Route path="/review" element={<CardReviewer />} />
                    <Route path="/browse" element={<CardBrowser />} />
                    <Route path="/stats" element={<Stats />} />
                  </Routes>
                </Container>
              </Box>
            </Box>
          </Box>
        </Router>
      </ReviewProvider>
    </ThemeProvider>
  );
}

export default App;
