// import { UserCard } from '../models/card';
// import { FSRS, Rating, State } from 'ts-fsrs';

// // Initialize FSRS with default parameters
// const fsrs = new FSRS({
//   request_retention: 0.9,
//   maximum_interval: 36500,
//   w: [0.212,1.2931,2.3065,8.2956,6.4133,0.8334,3.0194,0.001,1.8722,0.1666,0.796,1.4835,0.0614,0.2629,1.6483,0.6014,1.8729,0.5425,0.0912,0.0658,0.1542],
//   enable_fuzz: false,
//   enable_short_term: true,
//   learning_steps: ['1m', '10m'],
//   relearning_steps: ['1m', '10m'],
// });

// function toStateEnum(state: string): State {
//   switch (state) {
//     case 'New': return State.New;
//     case 'Learning': return State.Learning;
//     case 'Review': return State.Review;
//     case 'Relearning': return State.Relearning;
//     default: return State.New;
//   }
// } 

// export function scheduleCard(userCard: UserCard, rating: number) {
//   // Use current time as the review time
//   const now = new Date();
  
//   // Ensure we have proper default values
//   const currentStability = userCard.stability || 0;
//   const currentDifficulty = userCard.difficulty || 0;
//   const currentState = toStateEnum(userCard.state || 'New');
  
//   console.log('FSRS Input:', {
//     stability: currentStability,
//     difficulty: currentDifficulty,
//     state: currentState,
//     rating: rating,
//     last_review: userCard.last_review,
//     reps: userCard.reps || 0,
//     lapses: userCard.lapses || 0,
//   });

//   const computedElapsedDays = userCard.last_review
//   ? Math.floor((now.getTime() - new Date(userCard.last_review).getTime()) / (1000 * 60 * 60 * 24))
//   : 0;
  
//   // Create the card object in the format expected by FSRS
//   const card = {
//     stability: currentStability,
//     difficulty: currentDifficulty,
//     state: currentState,
//     last_review: userCard.last_review ? new Date(userCard.last_review) : now,
//     scheduled_days: userCard.scheduled_days || 0,
//     elapsed_days: computedElapsedDays, // ✅ fixed
//     reps: userCard.reps || 0,
//     lapses: userCard.lapses || 0,
//     due: userCard.due ? new Date(userCard.due) : now,
//     learning_steps: 0, // optional: track and pass real learning step index
//   };
  
//   // Use FSRS algorithm to get the next state
//   const result = fsrs.next(card, now, rating as any);
  
//   console.log('FSRS Output:', {
//     newStability: result.card.stability,
//     newDifficulty: result.card.difficulty,
//     newState: result.card.state,
//     newDue: result.card.due,
//     logStability: result.log.stability,
//     logDifficulty: result.log.difficulty,
//   });

//   // Extract the updated card and log
//   const updatedCard = {
//     due: result.card.due,
//     state: result.card.state.toString(),
//     last_review: now,
//     stability: result.card.stability,
//     difficulty: result.card.difficulty,
//     reps: result.card.reps,
//     lapses: result.card.lapses,
//     elapsed_days: result.card.elapsed_days,
//     scheduled_days: result.card.scheduled_days,
//   };

//   // Create the review log entry
//   const log = {
//     rating: result.log.rating,
//     state: result.log.state.toString(),
//     due: result.log.due,
//     stability: result.log.stability,
//     difficulty: result.log.difficulty,
//     elapsed_days: result.log.elapsed_days,
//     last_elapsed_days: result.log.last_elapsed_days,
//     scheduled_days: result.log.scheduled_days,
//     learning_steps: result.log.learning_steps,
//     review: result.log.review.toISOString(),
//   };

//   return { updatedCard, log };
// }


import { UserCard } from '../models/card';
import { FSRS, Grade, State } from 'ts-fsrs';
import type { Card } from 'ts-fsrs';

// Simple FSRS implementation to replace the buggy ts-fsrs library
function simpleFSRS(card: any, rating: number, now: Date) {
  const { stability, difficulty, state, reps, lapses, last_review, elapsed_days } = card;
  
  // Calculate elapsed days properly
  const computedElapsedDays = last_review
    ? Math.floor((now.getTime() - new Date(last_review).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  let newStability = stability;
  let newDifficulty = difficulty;
  let newState = state;
  let newReps = reps;
  let newLapses = lapses;
  
  // Convert rating to FSRS format (1=Again, 2=Hard, 3=Good, 4=Easy)
  const fsrsRating = rating;
  
  if (state === State.New) {
    // New card
    if (fsrsRating >= 3) {
      newState = State.Learning;
      newStability = 2.0;
      newDifficulty = 2.5;
    } else {
      newState = State.Learning;
      newStability = 1.0;
      newDifficulty = 2.5;
    }
  } else if (state === State.Learning) {
    // Learning card
    if (fsrsRating >= 3) {
      newState = State.Review;
      newStability = Math.max(2.0, stability * 1.5);
      newDifficulty = Math.max(1.3, difficulty - 0.2);
    } else {
      newState = State.Learning;
      newStability = Math.max(1.0, stability * 0.8);
      newDifficulty = Math.min(2.5, difficulty + 0.1);
    }
  } else if (state === State.Review) {
    // Review card
    if (fsrsRating === 4) { // Easy
      newStability = stability * 2.5;
      newDifficulty = Math.max(1.3, difficulty - 0.15);
    } else if (fsrsRating === 3) { // Good
      newStability = stability * 1.5;
      newDifficulty = difficulty;
    } else if (fsrsRating === 2) { // Hard
      newStability = stability * 0.8;
      newDifficulty = Math.min(2.5, difficulty + 0.15);
    } else { // Again
      newState = State.Relearning;
      newStability = 1.0;
      newDifficulty = Math.min(2.5, difficulty + 0.2);
      newLapses += 1;
    }
  } else if (state === State.Relearning) {
    // Relearning card
    if (fsrsRating >= 3) {
      newState = State.Review;
      newStability = Math.max(2.0, stability * 1.2);
      newDifficulty = Math.max(1.3, difficulty - 0.1);
    } else {
      newState = State.Relearning;
      newStability = Math.max(1.0, stability * 0.8);
      newDifficulty = Math.min(2.5, difficulty + 0.1);
    }
  }
  
  newReps += 1;
  
  // Calculate due date based on stability and current time
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + Math.floor(newStability));
  
  return {
    card: {
      stability: newStability,
      difficulty: newDifficulty,
      state: newState,
      reps: newReps,
      lapses: newLapses,
      due: dueDate,
      elapsed_days: computedElapsedDays,
      scheduled_days: Math.floor(newStability),
    },
    log: {
      rating: fsrsRating,
      state: newState,
      stability: newStability,
      difficulty: newDifficulty,
      elapsed_days: computedElapsedDays,
      last_elapsed_days: elapsed_days || 0,
      scheduled_days: Math.floor(newStability),
      learning_steps: 0,
      due: dueDate,
      review: now,
    }
  };
}

function toStateEnum(state: string): State {
  switch (state) {
    case 'New':
      return State.New;
    case 'Learning':
      return State.Learning;
    case 'Review':
      return State.Review;
    case 'Relearning':
      return State.Relearning;
    default:
      return State.New;
  }
}

export function scheduleCard(userCard: UserCard, rating: Grade, virtualNow?: Date) {
  // Use virtual time if provided, otherwise use current time
  const now = virtualNow || new Date();

  // Calculate elapsed days based on the difference between now and last_review
  const computedElapsedDays = userCard.last_review
    ? Math.floor(
        (now.getTime() - new Date(userCard.last_review).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  const card: Card = {
    stability: userCard.stability ?? 0,
    difficulty: userCard.difficulty ?? 0,
    state: toStateEnum(userCard.state ?? 'New'),
    last_review: userCard.last_review ? new Date(userCard.last_review) : now,
    scheduled_days: userCard.scheduled_days ?? 0,
    elapsed_days: computedElapsedDays,
    reps: userCard.reps ?? 0,
    lapses: userCard.lapses ?? 0,
    due: userCard.due ? new Date(userCard.due) : now,
    learning_steps: 0,
  };

  // Use our simple FSRS implementation instead of the buggy ts-fsrs library
  const result = simpleFSRS(card, rating as number, now);

  const updatedCard = {
    due: result.card.due,
    state: result.card.state.toString(),
    last_review: now, // Update last_review to the current virtual time
    stability: result.card.stability,
    difficulty: result.card.difficulty,
    reps: result.card.reps,
    lapses: result.card.lapses,
    elapsed_days: computedElapsedDays, // Use the computed elapsed days
    scheduled_days: result.card.scheduled_days,
  };

  const log = {
    rating: result.log.rating,
    state: result.log.state.toString(),
    due: result.log.due.toISOString(),
    stability: result.log.stability,
    difficulty: result.log.difficulty,
    elapsed_days: computedElapsedDays, // Use the computed elapsed days
    last_elapsed_days: userCard.elapsed_days || 0, // Use the previous elapsed days
    scheduled_days: result.log.scheduled_days,
    learning_steps: result.log.learning_steps,
    review: result.log.review.toISOString(),
  };

  // Log output for debugging
  console.log(`[VIRTUAL TIME] Now: ${now.toISOString()} | Last: ${card.last_review!.toISOString()} | Elapsed: ${computedElapsedDays}`);

  return { updatedCard, log };
}
