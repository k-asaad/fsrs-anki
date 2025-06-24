export interface Card {
  id: string;
  question: string;
  answer: string;
  topicId: string;
}

export interface ReviewLogEntry {
  rating: number;
  state: string;
  due: string; // or Date — depends on what you're storing, string is safer
  stability: number;
  difficulty: number;
  elapsed_days: number;
  last_elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  review: string; // ✅ change from `Date` to `string`
}


export interface UserCard {
  userId: string;
  cardId: string;
  due: Date;
  state: string;
  last_review: Date | null;
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  elapsed_days: number;
  scheduled_days: number;
  reviewLog?: ReviewLogEntry[];
} 