import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ReviewEvent {
  type: 'card_reviewed' | 'stats_updated' | 'fsrs_updated';
  data?: any;
  timestamp: number;
}

interface ReviewContextType {
  reviewEvents: ReviewEvent[];
  triggerReviewEvent: (event: Omit<ReviewEvent, 'timestamp'>) => void;
  clearEvents: () => void;
  lastReviewEvent: ReviewEvent | null;
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

export const useReviewContext = () => {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error('useReviewContext must be used within a ReviewProvider');
  }
  return context;
};

interface ReviewProviderProps {
  children: ReactNode;
}

export const ReviewProvider: React.FC<ReviewProviderProps> = ({ children }) => {
  const [reviewEvents, setReviewEvents] = useState<ReviewEvent[]>([]);
  const [lastReviewEvent, setLastReviewEvent] = useState<ReviewEvent | null>(null);

  const triggerReviewEvent = useCallback((event: Omit<ReviewEvent, 'timestamp'>) => {
    const newEvent: ReviewEvent = {
      ...event,
      timestamp: Date.now(),
    };
    
    setReviewEvents(prev => [newEvent, ...prev.slice(0, 9)]); // Keep last 10 events
    setLastReviewEvent(newEvent);
  }, []);

  const clearEvents = useCallback(() => {
    setReviewEvents([]);
    setLastReviewEvent(null);
  }, []);

  const value: ReviewContextType = {
    reviewEvents,
    triggerReviewEvent,
    clearEvents,
    lastReviewEvent,
  };

  return (
    <ReviewContext.Provider value={value}>
      {children}
    </ReviewContext.Provider>
  );
}; 