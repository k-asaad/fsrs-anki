// Anki-compatible data models
// These models align with Anki's internal data structures

export interface AnkiDeck {
  id: number;
  name: string;
  parent_id?: number;
  card_count: number;
  conf: number;
  children?: AnkiDeck[];
}

export interface AnkiNote {
  id: number;
  guid: string;
  mid: number; // model ID
  flds: string; // fields as tab-separated values
  tags: string;
  sfld: string; // sort field
  csum: number; // checksum
  flags: number;
  data: string; // JSON data
}

export interface AnkiCard {
  id: number;
  nid: number; // note ID
  did: number; // deck ID
  ord: number; // template ordinal
  type: number; // card type (0=new, 1=learning, 2=review, 3=relearning)
  queue: number; // queue (-1=suspended, 0=new, 1=learning, 2=review, 3=day learning, 4=preview)
  due: number; // due time (timestamp for learning, days for review)
  ivl: number; // interval
  factor: number; // ease factor
  reps: number; // review count
  lapses: number; // lapse count
  left: number; // remaining steps for learning
  odue: number; // original due date
  odid: number; // original deck ID
  flags: number;
  data: string; // JSON data
}

export interface AnkiModel {
  id: number;
  name: string;
  type: number; // 0=standard, 1=cloze
  css: string;
  flds: AnkiField[];
  tmpls: AnkiTemplate[];
  req: AnkiRequirement[];
  sortf: number; // sort field index
  did: number; // default deck ID
  latexPre: string;
  latexPost: string;
  latexsvg: boolean;
  vers: number[]; // version
  tags: string[];
  usn: number; // update sequence number
}

export interface AnkiField {
  name: string;
  ord: number;
  sticky: boolean;
  rtl: boolean;
  font: string;
  size: number;
  media: string[];
}

export interface AnkiTemplate {
  name: string;
  ord: number;
  qfmt: string; // question format
  afmt: string; // answer format
  bqfmt: string; // browser question format
  bafmt: string; // browser answer format
  did: number; // deck override
  bfont: string;
  bsize: number;
}

export interface AnkiRequirement {
  ord: number;
  type: number; // 0=any, 1=all, 2=all with scheduling
  req: number[]; // required field indices
}

export interface AnkiRevlog {
  id: number;
  cid: number; // card ID
  usn: number; // update sequence number
  ease: number; // ease (1-4)
  ivl: number; // interval
  lastIvl: number; // last interval
  factor: number; // ease factor
  time: number; // time taken in milliseconds
  type: number; // review type (0=learning, 1=review, 2=relearning, 3=cram)
}

export interface AnkiConfig {
  id: number;
  name: string;
  mtime: number; // modification time
  usn: number; // update sequence number
  config: AnkiDeckConfig;
}

export interface AnkiDeckConfig {
  new: AnkiNewConfig;
  lapse: AnkiLapseConfig;
  review: AnkiReviewConfig;
  maxTaken: number;
  timer: number;
  autoplay: boolean;
  replayq: boolean;
  mod: number;
}

export interface AnkiNewConfig {
  bury: boolean;
  delays: number[]; // learning steps in minutes
  initialFactor: number;
  ints: number[]; // intervals
  order: number; // 0=random, 1=sequential
  perDay: number;
  separate: boolean;
}

export interface AnkiLapseConfig {
  delays: number[]; // relearning steps in minutes
  leechAction: number; // 0=suspend, 1=tag only
  leechFails: number;
  minInt: number;
  mult: number; // interval multiplier
}

export interface AnkiReviewConfig {
  bury: boolean;
  ease4: number; // ease bonus
  fuzz: number; // interval fuzz
  hardFactor: number;
  ivlFct: number; // interval factor
  maxIvl: number; // maximum interval
  minSpace: number; // minimum spacing
  perDay: number;
}

// API response interfaces
export interface DeckResponse {
  id: number;
  name: string;
  parent_id?: number;
  card_count: number;
  children?: DeckResponse[];
}

export interface CardResponse {
  id: number;
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
  tags: string[];
  due_date: string; // ISO date string
}

export interface NoteResponse {
  id: number;
  deck_id: number;
  front: string;
  back: string;
  tags: string[];
  card_id: number;
}

export interface ReviewResponse {
  card: CardResponse;
  next_review?: string; // ISO date string
  success: boolean;
}

export interface SearchResponse {
  cards: CardResponse[];
  total: number;
}

// Request interfaces
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
  card_id: number;
  ease: number; // 1-4 (again, hard, good, easy)
}

export interface SearchCardsRequest {
  query: string;
  deck_id?: number;
  limit?: number;
}

// Utility types
export type CardType = 0 | 1 | 2 | 3; // new, learning, review, relearning
export type CardQueue = -1 | 0 | 1 | 2 | 3 | 4; // suspended, new, learning, review, day learning, preview
export type ReviewEase = 1 | 2 | 3 | 4; // again, hard, good, easy

// Constants
export const CARD_TYPES = {
  NEW: 0,
  LEARNING: 1,
  REVIEW: 2,
  RELEARNING: 3,
} as const;

export const CARD_QUEUES = {
  SUSPENDED: -1,
  NEW: 0,
  LEARNING: 1,
  REVIEW: 2,
  DAY_LEARNING: 3,
  PREVIEW: 4,
} as const;

export const REVIEW_EASE = {
  AGAIN: 1,
  HARD: 2,
  GOOD: 3,
  EASY: 4,
} as const;

// Helper functions
export function ankiTimeToDate(ankiTime: number): Date {
  return new Date(ankiTime * 1000);
}

export function dateToAnkiTime(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

export function parseFields(fieldsString: string): string[] {
  return fieldsString.split('\x1f'); // Anki uses 0x1f as field separator
}

export function joinFields(fields: string[]): string {
  return fields.join('\x1f');
}

export function parseTags(tagsString: string): string[] {
  return tagsString.trim().split(' ').filter(tag => tag.length > 0);
}

export function joinTags(tags: string[]): string {
  return tags.join(' ');
} 