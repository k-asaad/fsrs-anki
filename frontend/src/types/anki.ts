export interface AnkiDeck {
  id: number;
  name: string;
  parent_id?: number;
  card_count: number;
  children?: AnkiDeck[];
  due_cards?: number;
  completed_cards?: number;
  progress_percentage?: number;
  is_completed?: boolean;
}

export interface AnkiCard {
  card_id: number;
  note_id: number;
  deck_id: number;
  front: string;
  back: string;
  type: number;
  queue: number;
  due: number;
  interval: number;
  ease_factor: number;
  reps: number;
  lapses: number;
  tags?: string[];
  next_review?: number;
}

// User-specific card data with FSRS parameters
export interface UserCard {
  card_id: number;
  note_id: number;
  deck_id: number;
  front: string;
  back: string;
  tags?: string[];
  user_id: string;
  stability: number;
  difficulty: number;
  state: string;
  reps: number;
  lapses: number;
  due: number;
  elapsed_days: number;
  scheduled_days: number;
  next_review: {
    date: string;
    days_until: number;
    state: string;
    stability: number;
    difficulty: number;
  };
}

export interface FSRSParameters {
  request_retention: number;
  maximum_interval: number;
  w: number[];
  enable_fuzz: boolean;
  enable_short_term: boolean;
  learning_steps: string[];
  relearning_steps: string[];
}

export interface NextReviewInfo {
  date: string;
  days_until: number;
  state: string;
  stability: number;
  difficulty: number;
}

export interface AnkiNote {
  note_id: number;
  card_id: number;
  front: string;
  back: string;
  deck_id: number;
  tags: string[];
}

export interface AnkiCardStats {
  card_id: number;
  type: number;
  queue: number;
  due: number;
  interval: number;
  ease_factor: number;
  reps: number;
  lapses: number;
  review_history: any[];
}

export interface CreateDeckRequest {
  name: string;
  parent_id?: number;
}

export interface CreateNoteRequest {
  deck_id: number;
  front: string;
  back: string;
  tags?: string[];
}

export interface ReviewCardRequest {
  ease: number;
}

export interface SearchCardsRequest {
  query: string;
  deck_id?: number;
  limit?: number;
}

// User-specific statistics
export interface UserStats {
  total_user_cards: number;
  due_cards: number;
  completed_cards: number;
  learning_cards: number;
  review_cards: number;
  new_cards: number;
  progress_percentage: number;
}

export interface CollectionStats {
  total_decks: number;
  total_cards: number;
  due_cards: number;
  decks: Array<{
    id: number;
    name: string;
    card_count: number;
  }>;
  user_stats?: UserStats;
} 