import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getDueReviews, recordReview, getReviewStats } from '../api/samReviews';
import type { ReviewSchedule, ReviewStats } from '../api/samReviews';
import { CheckCircle, XCircle, BarChart3, BookMarked } from 'lucide-react';
import '../styles/reviews.css';

export function ReviewsPage() {
  const queryClient = useQueryClient();
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());

  // Fetch due reviews
  const { data: reviews = [], isLoading: loadingReviews } = useQuery<ReviewSchedule[]>({
    queryKey: ['due-reviews'],
    queryFn: () => getDueReviews(20),
  });

  // Fetch review stats
  const { data: stats } = useQuery<ReviewStats>({
    queryKey: ['review-stats'],
    queryFn: getReviewStats,
  });

  // Record review mutation
  const recordReviewMutation = useMutation({
    mutationFn: ({ scheduleId, wasSuccessful }: { scheduleId: string; wasSuccessful: boolean }) => {
      const responseTimeMs = Date.now() - startTime;
      return recordReview(scheduleId, {
        wasSuccessful,
        reviewType: 'recognition', // Using recognition mode (easier, as per the document)
        responseTimeMs,
      });
    },
    onSuccess: () => {
      // Move to next review
      setShowAnswer(false);
      setCurrentReviewIndex(prev => prev + 1);
      setStartTime(Date.now());

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['due-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['review-stats'] });
    },
  });

  // Reset to first review when reviews change
  useEffect(() => {
    setCurrentReviewIndex(0);
    setShowAnswer(false);
    setStartTime(Date.now());
  }, [reviews.length]);

  if (loadingReviews) {
    return (
      <div className="reviews-page">
        <div className="loading">Loading reviews...</div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="reviews-page">
        <div className="page-header">
          <h1>Reviews</h1>
          <BookMarked size={32} />
        </div>

        <div className="empty-state">
          <CheckCircle size={64} className="success-icon" />
          <h2>All caught up!</h2>
          <p>No reviews due right now. Great work!</p>
          <p className="subtitle">New reviews will appear here based on the spaced repetition schedule.</p>
        </div>

        {stats && (
          <div className="stats-card">
            <h3><BarChart3 size={20} /> Your Progress</h3>
            <div className="stats-grid">
              <div className="stat">
                <span className="stat-label">Total Reviews</span>
                <span className="stat-value">{stats.totalReviews}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Success Rate</span>
                <span className="stat-value">{(stats.successRate * 100).toFixed(0)}%</span>
              </div>
              <div className="stat">
                <span className="stat-label">7-Day Retention</span>
                <span className="stat-value">{(stats.retention7Day * 100).toFixed(0)}%</span>
              </div>
              <div className="stat">
                <span className="stat-label">30-Day Retention</span>
                <span className="stat-value">{(stats.retention30Day * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const currentReview = reviews[currentReviewIndex];

  if (!currentReview) {
    // All reviews completed
    return (
      <div className="reviews-page">
        <div className="completion-screen">
          <CheckCircle size={64} className="success-icon" />
          <h2>Session Complete!</h2>
          <p>You've reviewed {reviews.length} memories.</p>
          <button onClick={() => window.location.reload()} className="btn-primary">
            Check for More Reviews
          </button>
        </div>
      </div>
    );
  }

  const handleReveal = () => {
    setShowAnswer(true);
  };

  const handleCorrect = () => {
    recordReviewMutation.mutate({
      scheduleId: currentReview.id,
      wasSuccessful: true,
    });
  };

  const handleIncorrect = () => {
    recordReviewMutation.mutate({
      scheduleId: currentReview.id,
      wasSuccessful: false,
    });
  };

  return (
    <div className="reviews-page">
      <div className="page-header">
        <h1>Review Session</h1>
        <div className="progress-indicator">
          {currentReviewIndex + 1} / {reviews.length}
        </div>
      </div>

      <div className="review-card">
        <div className="review-header">
          <h2>What does this mean?</h2>
          {currentReview.memory.tags.length > 0 && (
            <div className="tags">
              {currentReview.memory.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          )}
        </div>

        <div className="review-question">
          <div className="question-text">
            <strong>{currentReview.memory.title}</strong>
          </div>

          {currentReview.memory.canonicalPhrases.length > 0 && (
            <div className="canonical-phrases">
              <em>"{currentReview.memory.canonicalPhrases[0]}"</em>
            </div>
          )}
        </div>

        {!showAnswer ? (
          <div className="review-actions">
            <button onClick={handleReveal} className="btn-reveal">
              Show Answer
            </button>
          </div>
        ) : (
          <div className="review-answer">
            <div className="answer-content">
              <p>{currentReview.memory.content}</p>
            </div>

            <div className="answer-question">
              <p>Did you remember correctly?</p>
            </div>

            <div className="answer-actions">
              <button
                onClick={handleIncorrect}
                className="btn-incorrect"
                disabled={recordReviewMutation.isPending}
              >
                <XCircle size={20} />
                Incorrect
              </button>
              <button
                onClick={handleCorrect}
                className="btn-correct"
                disabled={recordReviewMutation.isPending}
              >
                <CheckCircle size={20} />
                Correct
              </button>
            </div>
          </div>
        )}
      </div>

      {stats && (
        <div className="stats-summary">
          <div className="stat-item">
            <span>Success Rate:</span>
            <strong>{(stats.successRate * 100).toFixed(0)}%</strong>
          </div>
          <div className="stat-item">
            <span>Total Reviews:</span>
            <strong>{stats.totalReviews}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
