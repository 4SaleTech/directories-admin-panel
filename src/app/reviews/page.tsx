'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/presentation/components/AdminLayout/AdminLayout';
import LoadingSpinner from '@/presentation/components/LoadingSpinner/LoadingSpinner';
import Pagination from '@/presentation/components/Pagination/Pagination';
import { reviewAdminRepository } from '@/infrastructure/repositories/ReviewAdminRepository';
import { Review, ReviewStatus, ReviewModerationSummary } from '@/domain/entities/Review';
import { toastService } from '@/application/services/toastService';
import styles from './reviews.module.scss';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('pending');
  const [summary, setSummary] = useState<ReviewModerationSummary | null>(null);
  const [actioningReviewId, setActioningReviewId] = useState<number | null>(null);

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter]);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadReviews = async () => {
    try {
      setIsLoading(true);
      const params = { page: currentPage, limit: itemsPerPage };

      let response;
      if (statusFilter === 'all') {
        response = await reviewAdminRepository.getAll(params);
      } else {
        response = await reviewAdminRepository.getByStatus(statusFilter, params);
      }

      const reviewsData = Array.isArray(response.data) ? response.data : [];
      setReviews(reviewsData);
      setTotalPages(response.pagination?.total_pages || 1);
      setTotalItems(response.pagination?.total_count || 0);
    } catch (err: any) {
      console.error('Failed to load reviews:', err);
      setError('Failed to load reviews');
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const response = await reviewAdminRepository.getModerationSummary();
      setSummary(response.data);
    } catch (err) {
      console.error('Failed to load summary:', err);
    }
  };

  const handleApprove = async (reviewId: number) => {
    if (!confirm('Are you sure you want to approve this review?')) {
      return;
    }

    try {
      setActioningReviewId(reviewId);
      await reviewAdminRepository.approve(reviewId);
      toastService.success('Review approved successfully');
      await loadReviews();
      await loadSummary();
    } catch (err: any) {
      console.error('Failed to approve review:', err);
      toastService.error(err.message || 'Failed to approve review');
    } finally {
      setActioningReviewId(null);
    }
  };

  const handleReject = async (reviewId: number) => {
    if (!confirm('Are you sure you want to reject this review?')) {
      return;
    }

    try {
      setActioningReviewId(reviewId);
      await reviewAdminRepository.reject(reviewId);
      toastService.success('Review rejected successfully');
      await loadReviews();
      await loadSummary();
    } catch (err: any) {
      console.error('Failed to reject review:', err);
      toastService.error(err.message || 'Failed to reject review');
    } finally {
      setActioningReviewId(null);
    }
  };

  const getStatusBadgeClass = (status: ReviewStatus) => {
    switch (status) {
      case 'approved':
        return styles.badgeApproved;
      case 'rejected':
        return styles.badgeRejected;
      case 'pending':
        return styles.badgePending;
      default:
        return '';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rating ? styles.starFilled : styles.starEmpty}>
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className={styles.reviewsPage}>
        <div className={styles.header}>
          <h1>Reviews Management</h1>
          <p>Moderate user reviews before publishing</p>
        </div>

        {summary && (
          <div className={styles.summaryCards}>
            <div className={`${styles.summaryCard} ${styles.pending}`}>
              <div className={styles.summaryNumber}>{summary.pending}</div>
              <div className={styles.summaryLabel}>Pending</div>
            </div>
            <div className={`${styles.summaryCard} ${styles.approved}`}>
              <div className={styles.summaryNumber}>{summary.approved}</div>
              <div className={styles.summaryLabel}>Approved</div>
            </div>
            <div className={`${styles.summaryCard} ${styles.rejected}`}>
              <div className={styles.summaryNumber}>{summary.rejected}</div>
              <div className={styles.summaryLabel}>Rejected</div>
            </div>
          </div>
        )}

        <div className={styles.filterTabs}>
          <button
            className={`${styles.filterTab} ${statusFilter === 'all' ? styles.active : ''}`}
            onClick={() => {
              setStatusFilter('all');
              setCurrentPage(1);
            }}
          >
            All Reviews
          </button>
          <button
            className={`${styles.filterTab} ${statusFilter === 'pending' ? styles.active : ''}`}
            onClick={() => {
              setStatusFilter('pending');
              setCurrentPage(1);
            }}
          >
            Pending {summary && summary.pending > 0 && (
              <span className={styles.badge}>{summary.pending}</span>
            )}
          </button>
          <button
            className={`${styles.filterTab} ${statusFilter === 'approved' ? styles.active : ''}`}
            onClick={() => {
              setStatusFilter('approved');
              setCurrentPage(1);
            }}
          >
            Approved
          </button>
          <button
            className={`${styles.filterTab} ${statusFilter === 'rejected' ? styles.active : ''}`}
            onClick={() => {
              setStatusFilter('rejected');
              setCurrentPage(1);
            }}
          >
            Rejected
          </button>
        </div>

        {isLoading && <LoadingSpinner />}

        {!isLoading && error && (
          <div className="alert alert-danger">{error}</div>
        )}

        {!isLoading && !error && reviews.length === 0 && (
          <div className={styles.emptyState}>
            <p>No reviews found for this filter.</p>
          </div>
        )}

        {!isLoading && !error && reviews.length > 0 && (
          <>
            <div className={styles.reviewsList}>
              {reviews.map((review) => (
                <div key={review.id} className={styles.reviewCard}>
                  <div className={styles.reviewHeader}>
                    <div className={styles.reviewMeta}>
                      <div className={styles.userName}>{review.user_name}</div>
                      <div className={styles.businessName}>
                        {review.business_name || `Business #${review.business_id}`}
                      </div>
                      <div className={styles.reviewDate}>
                        {formatDate(review.created_at)}
                      </div>
                    </div>
                    <div className={styles.reviewStatus}>
                      <span className={`${styles.statusBadge} ${getStatusBadgeClass(review.status)}`}>
                        {review.status}
                      </span>
                    </div>
                  </div>

                  <div className={styles.reviewContent}>
                    <div className={styles.rating}>
                      {renderStars(review.rating)}
                      <span className={styles.ratingNumber}>{review.rating}/5</span>
                    </div>
                    {review.comment && (
                      <div className={styles.comment}>
                        {review.comment}
                      </div>
                    )}
                  </div>

                  {review.status === 'pending' && (
                    <div className={styles.reviewActions}>
                      <button
                        className={`btn btn-success ${styles.approveBtn}`}
                        onClick={() => handleApprove(review.id)}
                        disabled={actioningReviewId === review.id}
                      >
                        {actioningReviewId === review.id ? 'Approving...' : '✓ Approve'}
                      </button>
                      <button
                        className={`btn btn-danger ${styles.rejectBtn}`}
                        onClick={() => handleReject(review.id)}
                        disabled={actioningReviewId === review.id}
                      >
                        {actioningReviewId === review.id ? 'Rejecting...' : '✗ Reject'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />

            <div className={styles.resultsInfo}>
              Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} reviews
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
