export interface ReviewLogEntry {
  rating: number;
  state: string;
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  last_elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  review: string;
}

export interface User {
  id: string;
  name: string;
  cardCount: number;
}

export interface Card {
  id: string;
  question: string;
  answer: string;
  topicId: string;
  userId?: string;
  due?: string;
  state?: string;
  last_review?: string | null;
  stability?: number;
  difficulty?: number;
  reps?: number;
  lapses?: number;
  elapsed_days?: number;
  scheduled_days?: number;
  reviewLog?: ReviewLogEntry[];
  learning_step_index?: number; 
} 