import axios from 'axios';
import {
  AnkiDeck,
  AnkiCard,
  AnkiNote,
  AnkiCardStats,
  CreateDeckRequest,
  CreateNoteRequest,
  ReviewCardRequest,
  CollectionStats,
  UserCard
} from '../types/anki';

const API_BASE_URL = 'http://localhost:3001/anki';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export class AnkiApiService {
  // Decks
  async getDecks(): Promise<AnkiDeck[]> {
    const response = await api.get('/decks');
    return response.data;
  }

  async getDeckHierarchy(): Promise<AnkiDeck[]> {
    const response = await api.get('/decks/hierarchy');
    return response.data;
  }

  async createDeck(request: CreateDeckRequest): Promise<AnkiDeck> {
    const response = await api.post('/decks', request);
    return response.data;
  }

  // Cards
  async getCards(deckId?: number, limit?: number): Promise<AnkiCard[]> {
    const params = new URLSearchParams();
    if (deckId) params.append('deck_id', deckId.toString());
    if (limit) params.append('limit', limit.toString());
    
    const response = await api.get(`/cards?${params.toString()}`);
    return response.data;
  }

  async getCardsDue(deckId?: number, limit?: number): Promise<AnkiCard[]> {
    const params = new URLSearchParams();
    if (deckId) params.append('deck_id', deckId.toString());
    if (limit) params.append('limit', limit.toString());
    
    const response = await api.get(`/cards/due?${params.toString()}`);
    return response.data;
  }

  async getNextCard(deckId?: number): Promise<AnkiCard | null> {
    const params = new URLSearchParams();
    if (deckId) params.append('deck_id', deckId.toString());
    
    try {
      const response = await api.get(`/cards/next?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getCardById(cardId: number): Promise<AnkiCard | null> {
    try {
      const response = await api.get(`/cards/${cardId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async reviewCard(cardId: number, request: ReviewCardRequest): Promise<AnkiCard> {
    const response = await api.post(`/cards/${cardId}/review`, request);
    return response.data.card;
  }

  async getCardStats(cardId: number): Promise<AnkiCardStats> {
    const response = await api.get(`/cards/${cardId}/stats`);
    return response.data;
  }

  // Notes
  async createNote(request: CreateNoteRequest): Promise<AnkiNote> {
    const response = await api.post('/notes', request);
    return response.data;
  }

  // Search
  async searchCards(query: string, deckId?: number, limit?: number): Promise<AnkiCard[]> {
    const params = new URLSearchParams();
    params.append('q', query);
    if (deckId) params.append('deck_id', deckId.toString());
    if (limit) params.append('limit', limit.toString());
    
    const response = await api.get(`/search?${params.toString()}`);
    return response.data.cards;
  }

  // Stats
  async getStats(): Promise<CollectionStats> {
    const response = await api.get('/stats');
    return response.data;
  }

  // Import sample data
  async importSampleData(): Promise<any> {
    const response = await api.post('/import/sample');
    return response.data;
  }

  // Clear sample data
  async clearSampleData(): Promise<any> {
    const response = await api.post('/clear/sample');
    return response.data;
  }

  // User-specific methods
  async getUserCard(userId: string, cardId: number): Promise<any> {
    const response = await api.get(`/users/${userId}/cards/${cardId}`);
    return response.data;
  }

  async reviewUserCard(userId: string, cardId: number, request: ReviewCardRequest): Promise<any> {
    const response = await api.post(`/users/${userId}/cards/${cardId}/review`, request);
    return response.data;
  }

  async answerCardWithFSRS(userId: string, cardId: number, rating: number): Promise<any> {
    console.log(`[DEBUG] Submitting answer: card=${cardId}, rating=${rating}`);
    console.log(`[DEBUG] API URL: ${API_BASE_URL}/users/${userId}/cards/${cardId}/review`);
    console.log(`[DEBUG] Request payload: { ease: ${rating} }`);
    
    try {
      const response = await api.post(`/users/${userId}/cards/${cardId}/review`, { ease: rating });
      console.log(`[DEBUG] API response received:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`[ERROR] API call failed:`, error);
      console.error(`[ERROR] Error response:`, error.response?.data);
      console.error(`[ERROR] Error status:`, error.response?.status);
      console.error(`[ERROR] Error message:`, error.message);
      throw error;
    }
  }

  async getUserCardsDue(userId: string, deckId?: number, limit?: number): Promise<UserCard[]> {
    const params = new URLSearchParams();
    if (deckId) params.append('deck_id', deckId.toString());
    if (limit) params.append('limit', limit.toString());
    
    const response = await api.get(`/users/${userId}/cards/due?${params.toString()}`);
    return response.data.cards;
  }

  async getNextUserCard(userId: string, deckId?: number): Promise<UserCard | null> {
    const params = new URLSearchParams();
    if (deckId) params.append('deck_id', deckId.toString());
    
    try {
      const response = await api.get(`/users/${userId}/cards/next?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getUserCardReviewHistory(userId: string, cardId: number, limit?: number): Promise<any> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    
    const response = await api.get(`/users/${userId}/cards/${cardId}/history?${params.toString()}`);
    return response.data;
  }

  async getDetailedUserStats(userId: string) {
    try {
      const response = await api.get(`/users/${userId}/stats/detailed`);
      return response.data;
    } catch (error) {
      console.error('Error fetching detailed user stats:', error);
      throw error;
    }
  }
}

export const ankiApi = new AnkiApiService();
export default ankiApi; 