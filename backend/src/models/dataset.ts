import { Card, UserCard } from './card';

export interface Topic {
  id: string;
  name: string;
  cardIds: string[]; // Reference to card IDs instead of full cards
}

export interface Subject {
  id: string;
  name: string;
  topics: Topic[];
}

export interface ClassDeck {
  id: string;
  name: string;
  subjects: Subject[];
}

// Static card content (shared across all users)
export const cards: Card[] = [
  {
    id: '1',
    question: 'What is a variable?',
    answer: 'A symbol used to represent a number.',
    topicId: 'algebra6',
  },
  {
    id: '2',
    question: 'Solve: x + 3 = 5',
    answer: 'x = 2',
    topicId: 'algebra6',
  },
  {
    id: '3',
    question: 'What is an equation?',
    answer: 'A statement that two expressions are equal.',
    topicId: 'algebra6',
  },
  {
    id: '4',
    question: 'What is a constant?',
    answer: 'A value that does not change.',
    topicId: 'algebra6',
  },
  {
    id: '5',
    question: 'What is the solution to 2x = 6?',
    answer: 'x = 3',
    topicId: 'algebra6',
  },
  {
    id: '6',
    question: 'What is a triangle?',
    answer: 'A polygon with three edges and three vertices.',
    topicId: 'geometry6',
  },
  {
    id: '7',
    question: 'What is a right angle?',
    answer: 'An angle of 90 degrees.',
    topicId: 'geometry6',
  },
  {
    id: '8',
    question: 'What is the sum of angles in a triangle?',
    answer: '180 degrees.',
    topicId: 'geometry6',
  },
  {
    id: '9',
    question: 'What is force?',
    answer: 'A push or pull on an object.',
    topicId: 'physics6',
  },
  {
    id: '10',
    question: 'What is gravity?',
    answer: 'A force that attracts objects toward the center of the earth.',
    topicId: 'physics6',
  },
  {
    id: '11',
    question: 'What is an atom?',
    answer: 'The basic unit of a chemical element.',
    topicId: 'chemistry6',
  },
  {
    id: '12',
    question: 'What is a molecule?',
    answer: 'A group of atoms bonded together.',
    topicId: 'chemistry6',
  },
];

// User-specific progress (multiple users with different progress)
export const userCards: UserCard[] = [
  // User 1 cards
  {
    userId: 'user1',
    cardId: '1',
    due: new Date('2025-06-20T16:35:48'),
    state: 'New',
    last_review: null,
    stability: 2.0,
    difficulty: 2.5,
    reps: 0,
    lapses: 0,
    elapsed_days: 0,
    scheduled_days: 0,
  },
  {
    userId: 'user1',
    cardId: '2',
    due: new Date('2025-06-21T16:35:48'),
    state: 'Learning',
    last_review: new Date('2025-06-20T16:25:48'),
    stability: 2.31,
    difficulty: 2.12,
    reps: 1,
    lapses: 0,
    elapsed_days: 0,
    scheduled_days: 0,
  },
  {
    userId: 'user1',
    cardId: '3',
    due: new Date('2025-06-22T16:35:48'),
    state: 'Review',
    last_review: new Date('2025-06-20T16:35:48'),
    stability: 3.95,
    difficulty: 1.0,
    reps: 2,
    lapses: 0,
    elapsed_days: 4,
    scheduled_days: 4,
  },
  {
    userId: 'user1',
    cardId: '4',
    due: new Date('2025-06-23T16:35:48'),
    state: 'Review',
    last_review: new Date('2025-06-19T16:35:48'),
    stability: 5.2,
    difficulty: 1.8,
    reps: 3,
    lapses: 1,
    elapsed_days: 7,
    scheduled_days: 7,
  },
  {
    userId: 'user1',
    cardId: '5',
    due: new Date('2025-06-24T16:35:48'),
    state: 'Review',
    last_review: new Date('2025-06-18T16:35:48'),
    stability: 8.1,
    difficulty: 1.2,
    reps: 4,
    lapses: 0,
    elapsed_days: 10,
    scheduled_days: 10,
  },
  // User 2 cards
  {
    userId: 'user2',
    cardId: '1',
    due: new Date('2025-06-19T16:35:48'),
    state: 'Review',
    last_review: new Date('2025-06-18T16:35:48'),
    stability: 4.2,
    difficulty: 1.5,
    reps: 2,
    lapses: 0,
    elapsed_days: 3,
    scheduled_days: 3,
  },
  {
    userId: 'user2',
    cardId: '2',
    due: new Date('2025-06-20T16:35:48'),
    state: 'Review',
    last_review: new Date('2025-06-17T16:35:48'),
    stability: 6.8,
    difficulty: 1.3,
    reps: 3,
    lapses: 0,
    elapsed_days: 5,
    scheduled_days: 5,
  },
  {
    userId: 'user2',
    cardId: '6',
    due: new Date('2025-06-21T16:35:48'),
    state: 'Learning',
    last_review: new Date('2025-06-20T16:25:48'),
    stability: 2.5,
    difficulty: 2.8,
    reps: 1,
    lapses: 0,
    elapsed_days: 0,
    scheduled_days: 0,
  },
  {
    userId: 'user2',
    cardId: '7',
    due: new Date('2025-06-22T16:35:48'),
    state: 'New',
    last_review: null,
    stability: 2.0,
    difficulty: 2.0,
    reps: 0,
    lapses: 0,
    elapsed_days: 0,
    scheduled_days: 0,
  },
  // User 3 cards
  {
    userId: 'user3',
    cardId: '1',
    due: new Date('2025-06-18T16:35:48'),
    state: 'Review',
    last_review: new Date('2025-06-17T16:35:48'),
    stability: 12.5,
    difficulty: 1.1,
    reps: 5,
    lapses: 0,
    elapsed_days: 15,
    scheduled_days: 15,
  },
  {
    userId: 'user3',
    cardId: '3',
    due: new Date('2025-06-19T16:35:48'),
    state: 'Review',
    last_review: new Date('2025-06-16T16:35:48'),
    stability: 9.3,
    difficulty: 1.4,
    reps: 4,
    lapses: 1,
    elapsed_days: 12,
    scheduled_days: 12,
  },
  {
    userId: 'user3',
    cardId: '9',
    due: new Date('2025-06-20T16:35:48'),
    state: 'Learning',
    last_review: new Date('2025-06-19T16:25:48'),
    stability: 2.8,
    difficulty: 2.2,
    reps: 1,
    lapses: 0,
    elapsed_days: 0,
    scheduled_days: 0,
  },
  {
    userId: 'user3',
    cardId: '10',
    due: new Date('2025-06-21T16:35:48'),
    state: 'New',
    last_review: null,
    stability: 2.0,
    difficulty: 2.0,
    reps: 0,
    lapses: 0,
    elapsed_days: 0,
    scheduled_days: 0,
  },
  // User 4 cards
  {
    userId: 'user4',
    cardId: '1',
    due: new Date('2025-06-17T16:35:48'),
    state: 'Review',
    last_review: new Date('2025-06-16T16:35:48'),
    stability: 20.1,
    difficulty: 1.0,
    reps: 6,
    lapses: 0,
    elapsed_days: 25,
    scheduled_days: 25,
  },
  {
    userId: 'user4',
    cardId: '2',
    due: new Date('2025-06-18T16:35:48'),
    state: 'Review',
    last_review: new Date('2025-06-15T16:35:48'),
    stability: 15.7,
    difficulty: 1.2,
    reps: 5,
    lapses: 0,
    elapsed_days: 20,
    scheduled_days: 20,
  },
  {
    userId: 'user4',
    cardId: '11',
    due: new Date('2025-06-19T16:35:48'),
    state: 'Learning',
    last_review: new Date('2025-06-18T16:25:48'),
    stability: 3.1,
    difficulty: 2.6,
    reps: 1,
    lapses: 0,
    elapsed_days: 0,
    scheduled_days: 0,
  },
  {
    userId: 'user4',
    cardId: '12',
    due: new Date('2025-06-20T16:35:48'),
    state: 'New',
    last_review: null,
    stability: 2.0,
    difficulty: 2.0,
    reps: 0,
    lapses: 0,
    elapsed_days: 0,
    scheduled_days: 0,
  },
];

// Hierarchy structure (now references card IDs)
export const dataset: ClassDeck[] = [
  {
    id: 'class6',
    name: 'Class 6',
    subjects: [
      {
        id: 'math6',
        name: 'Math',
        topics: [
          {
            id: 'algebra6',
            name: 'Algebra',
            cardIds: ['1', '2', '3', '4', '5'],
          },
          {
            id: 'geometry6',
            name: 'Geometry',
            cardIds: ['6', '7', '8'],
          },
        ],
      },
      {
        id: 'science6',
        name: 'Science',
        topics: [
          {
            id: 'physics6',
            name: 'Physics',
            cardIds: ['9', '10'],
          },
          {
            id: 'chemistry6',
            name: 'Chemistry',
            cardIds: ['11', '12'],
          },
        ],
      },
    ],
  },
  // Add more classes, subjects, topics, and cards for realism
]; 