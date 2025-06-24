import React, { useState, useEffect } from 'react';
import { Card } from './types';
import { ankiApi } from '../services/ankiApi';

const ratingLabels = ['Again', 'Hard', 'Good', 'Easy'];
const stateLabels = ['New', 'Learning', 'Review', 'Relearning'];

interface CardDetailsProps {
  card: Card;
  onRate: (rating: number) => void;
  userId?: string;
}

interface ReviewHistoryEntry {
  id: number;
  rating: number;
  state: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  review_time: number;
  created_at: number;
  review_date: string;
  rating_text: string;
  state_text: string;
}

const CardDetails: React.FC<CardDetailsProps> = ({ card, onRate, userId = 'default_user' }) => {
  const [reviewHistory, setReviewHistory] = useState<ReviewHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Calculate elapsed days for display
  const elapsedDays = card.last_review 
    ? Math.floor((new Date().getTime() - new Date(card.last_review).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Fetch review history when component mounts or card changes
  useEffect(() => {
    if (showHistory && card.id) {
      fetchReviewHistory();
    }
  }, [showHistory, card.id, userId]);

  const fetchReviewHistory = async () => {
    if (!card.id) return;
    
    setLoadingHistory(true);
    try {
      const cardId = typeof card.id === 'string' ? parseInt(card.id) : card.id;
      const result = await ankiApi.getUserCardReviewHistory(userId, cardId, 50);
      if (result.success) {
        setReviewHistory(result.reviews);
      }
    } catch (error) {
      console.error('Failed to fetch review history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRate = async (rating: number) => {
    await onRate(rating);
    // Refresh review history after rating
    if (showHistory) {
      setTimeout(fetchReviewHistory, 500);
    }
    // Always refresh FSRS parameters after rating
    setTimeout(fetchReviewHistory, 500);
  };
    
  return (
    <div className="CardDetails">
      <h2>Card Details</h2>
      <p><strong>Q:</strong> {card.question}</p>
      <p><strong>A:</strong> {card.answer}</p>
      
      <div style={{ margin: '20px 0', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Current FSRS Parameters</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <p><strong>Stability:</strong> {typeof card.stability === 'number' ? card.stability.toFixed(2) : 'N/A'}</p>
          <p><strong>Difficulty:</strong> {typeof card.difficulty === 'number' ? card.difficulty.toFixed(2) : 'N/A'}</p>
          <p><strong>State:</strong> {isNaN(Number(card.state)) ? card.state : stateLabels[Number(card.state)] ?? card.state}</p>
          <p><strong>Reps:</strong> {card.reps}</p>
          <p><strong>Lapses:</strong> {card.lapses}</p>
          <p><strong>Elapsed Days:</strong> {card.elapsed_days} (calculated: {elapsedDays})</p>
          <p><strong>Scheduled Days:</strong> {card.scheduled_days}</p>
          <p><strong>Due:</strong> {card.due ? new Date(card.due).toLocaleString() : 'N/A'}</p>
          <p><strong>Last Review:</strong> {card.last_review ? new Date(card.last_review).toLocaleString() : 'N/A'}</p>
        </div>
      </div>

      <div style={{ margin: '20px 0' }}>
        <h3>Rate This Card</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => handleRate(1)}
            style={{ padding: '10px 20px', backgroundColor: '#ff4444', color: 'white', border: 'none', borderRadius: '5px' }}
          >
            Again (1)
          </button>
          <button 
            onClick={() => handleRate(2)}
            style={{ padding: '10px 20px', backgroundColor: '#ff8800', color: 'white', border: 'none', borderRadius: '5px' }}
          >
            Hard (2)
          </button>
          <button 
            onClick={() => handleRate(3)}
            style={{ padding: '10px 20px', backgroundColor: '#00aa00', color: 'white', border: 'none', borderRadius: '5px' }}
          >
            Good (3)
          </button>
          <button 
            onClick={() => handleRate(4)}
            style={{ padding: '10px 20px', backgroundColor: '#0088ff', color: 'white', border: 'none', borderRadius: '5px' }}
          >
            Easy (4)
          </button>
        </div>
      </div>

      <div style={{ margin: '20px 0' }}>
        <button 
          onClick={() => setShowHistory(!showHistory)}
          style={{ padding: '10px 20px', backgroundColor: '#666', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          {showHistory ? 'Hide' : 'Show'} Review History
        </button>
      </div>

      {showHistory && (
        <div style={{ marginTop: 24 }}>
          <h3>Review History</h3>
          {loadingHistory ? (
            <p>Loading review history...</p>
          ) : reviewHistory.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f0f0f0' }}>
                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>#</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Rating</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>State</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Stability</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Difficulty</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Elapsed Days</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Scheduled Days</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewHistory.map((review, idx) => (
                    <tr key={review.id} style={{ backgroundColor: idx % 2 === 0 ? '#f9f9f9' : 'white' }}>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{reviewHistory.length - idx}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                        {new Date(review.review_date).toLocaleString()}
                      </td>
                      <td style={{ 
                        padding: '8px', 
                        border: '1px solid #ddd',
                        color: review.rating === 1 ? '#ff4444' : 
                               review.rating === 2 ? '#ff8800' : 
                               review.rating === 3 ? '#00aa00' : '#0088ff',
                        fontWeight: 'bold'
                      }}>
                        {review.rating_text}
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{review.state_text}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{review.stability.toFixed(2)}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{review.difficulty.toFixed(2)}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{review.elapsed_days}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{review.scheduled_days}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No review history found for this card.</p>
          )}
        </div>
      )}

      {/* Legacy review log display (if available) */}
      {card.reviewLog && card.reviewLog.length > 0 && !showHistory && (
        <div style={{marginTop: 24}}>
          <h3>Legacy Review History</h3>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr>
                <th>#</th>
                <th>Rating</th>
                <th>State</th>
                <th>Due</th>
                <th>Stability</th>
                <th>Difficulty</th>
                <th>Elapsed Days</th>
                <th>Last Elapsed Days</th>
                <th>Scheduled Days</th>
                <th>Learning Steps</th>
                <th>Review Date</th>
              </tr>
            </thead>
            <tbody>
              {card.reviewLog.map((log, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{typeof log.rating === 'number' ? ratingLabels[log.rating] ?? log.rating : log.rating}</td>
                  <td>{typeof log.state === 'number' ? stateLabels[log.state] ?? log.state : log.state}</td>
                  <td>{new Date(log.due).toLocaleString()}</td>
                  <td>{typeof log.stability === 'number' ? log.stability.toFixed(2) : 'N/A'}</td>
                  <td>{typeof log.difficulty === 'number' ? log.difficulty.toFixed(2) : 'N/A'}</td>
                  <td>{log.elapsed_days}</td>
                  <td>{log.last_elapsed_days}</td>
                  <td>{log.scheduled_days}</td>
                  <td>{log.learning_steps}</td>
                  <td>{new Date(log.review).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CardDetails; 