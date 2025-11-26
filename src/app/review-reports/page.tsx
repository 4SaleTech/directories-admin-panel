'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/presentation/components/AdminLayout/AdminLayout';
import LoadingSpinner from '@/presentation/components/LoadingSpinner/LoadingSpinner';
import Pagination from '@/presentation/components/Pagination/Pagination';
import { reviewReportAdminRepository } from '@/infrastructure/repositories/ReviewReportAdminRepository';
import { ReviewReport, ReviewReportStatus, ReviewReportSummary } from '@/domain/entities/ReviewReport';
import { toastService } from '@/application/services/toastService';
import styles from './review-reports.module.scss';

export default function ReviewReportsPage() {
  const [reports, setReports] = useState<ReviewReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;
  const [statusFilter, setStatusFilter] = useState<ReviewReportStatus | 'all'>('pending');
  const [summary, setSummary] = useState<ReviewReportSummary | null>(null);
  const [actioningReportId, setActioningReportId] = useState<number | null>(null);

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter]);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const params = { page: currentPage, limit: itemsPerPage };

      let response;
      if (statusFilter === 'all') {
        response = await reviewReportAdminRepository.getAll(params);
      } else {
        response = await reviewReportAdminRepository.getByStatus(statusFilter, params);
      }

      const reportsData = Array.isArray(response.data) ? response.data : [];
      setReports(reportsData);
      setTotalPages(response.pagination?.total_pages || 1);
      setTotalItems(response.pagination?.total_count || 0);
    } catch (err: any) {
      console.error('Failed to load review reports:', err);
      setError('Failed to load review reports');
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const response = await reviewReportAdminRepository.getSummary();
      setSummary(response.data || null);
    } catch (err) {
      console.error('Failed to load summary:', err);
    }
  };

  const handleMarkAsReviewed = async (reportId: number) => {
    if (!confirm('Mark this report as reviewed?')) {
      return;
    }

    try {
      setActioningReportId(reportId);
      await reviewReportAdminRepository.markAsReviewed(reportId);
      toastService.success('Report marked as reviewed');
      await loadReports();
      await loadSummary();
    } catch (err: any) {
      console.error('Failed to mark as reviewed:', err);
      toastService.error(err.message || 'Failed to mark as reviewed');
    } finally {
      setActioningReportId(null);
    }
  };

  const handleResolve = async (reportId: number) => {
    if (!confirm('Resolve this report? This indicates action was taken.')) {
      return;
    }

    try {
      setActioningReportId(reportId);
      await reviewReportAdminRepository.resolve(reportId);
      toastService.success('Report resolved successfully');
      await loadReports();
      await loadSummary();
    } catch (err: any) {
      console.error('Failed to resolve report:', err);
      toastService.error(err.message || 'Failed to resolve report');
    } finally {
      setActioningReportId(null);
    }
  };

  const handleDismiss = async (reportId: number) => {
    if (!confirm('Dismiss this report? This indicates no action is needed.')) {
      return;
    }

    try {
      setActioningReportId(reportId);
      await reviewReportAdminRepository.dismiss(reportId);
      toastService.success('Report dismissed successfully');
      await loadReports();
      await loadSummary();
    } catch (err: any) {
      console.error('Failed to dismiss report:', err);
      toastService.error(err.message || 'Failed to dismiss report');
    } finally {
      setActioningReportId(null);
    }
  };

  const handleDelete = async (reportId: number) => {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      setActioningReportId(reportId);
      await reviewReportAdminRepository.delete(reportId);
      toastService.success('Report deleted successfully');
      await loadReports();
      await loadSummary();
    } catch (err: any) {
      console.error('Failed to delete report:', err);
      toastService.error(err.message || 'Failed to delete report');
    } finally {
      setActioningReportId(null);
    }
  };

  const getStatusBadgeClass = (status: ReviewReportStatus) => {
    switch (status) {
      case 'pending':
        return styles.badgePending;
      case 'reviewed':
        return styles.badgeReviewed;
      case 'resolved':
        return styles.badgeResolved;
      case 'dismissed':
        return styles.badgeDismissed;
      default:
        return '';
    }
  };

  const getReasonBadgeClass = (reason: string) => {
    switch (reason) {
      case 'spam':
        return styles.reasonSpam;
      case 'inappropriate':
        return styles.reasonInappropriate;
      case 'offensive':
        return styles.reasonOffensive;
      case 'fake':
        return styles.reasonFake;
      case 'other':
        return styles.reasonOther;
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

  return (
    <AdminLayout>
      <div className={styles.reportsPage}>
        <div className={styles.header}>
          <h1>Review Reports Management</h1>
          <p>Moderate reported reviews</p>
        </div>

        {summary && (
          <div className={styles.summaryCards}>
            <div className={`${styles.summaryCard} ${styles.pending}`}>
              <div className={styles.summaryNumber}>{summary.pending}</div>
              <div className={styles.summaryLabel}>Pending</div>
            </div>
            <div className={`${styles.summaryCard} ${styles.reviewed}`}>
              <div className={styles.summaryNumber}>{summary.reviewed}</div>
              <div className={styles.summaryLabel}>Reviewed</div>
            </div>
            <div className={`${styles.summaryCard} ${styles.resolved}`}>
              <div className={styles.summaryNumber}>{summary.resolved}</div>
              <div className={styles.summaryLabel}>Resolved</div>
            </div>
            <div className={`${styles.summaryCard} ${styles.dismissed}`}>
              <div className={styles.summaryNumber}>{summary.dismissed}</div>
              <div className={styles.summaryLabel}>Dismissed</div>
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
            All Reports
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
            className={`${styles.filterTab} ${statusFilter === 'reviewed' ? styles.active : ''}`}
            onClick={() => {
              setStatusFilter('reviewed');
              setCurrentPage(1);
            }}
          >
            Reviewed
          </button>
          <button
            className={`${styles.filterTab} ${statusFilter === 'resolved' ? styles.active : ''}`}
            onClick={() => {
              setStatusFilter('resolved');
              setCurrentPage(1);
            }}
          >
            Resolved
          </button>
          <button
            className={`${styles.filterTab} ${statusFilter === 'dismissed' ? styles.active : ''}`}
            onClick={() => {
              setStatusFilter('dismissed');
              setCurrentPage(1);
            }}
          >
            Dismissed
          </button>
        </div>

        {isLoading && <LoadingSpinner />}

        {!isLoading && error && (
          <div className="alert alert-danger">{error}</div>
        )}

        {!isLoading && !error && reports.length === 0 && (
          <div className={styles.emptyState}>
            <p>No reports found for this filter.</p>
          </div>
        )}

        {!isLoading && !error && reports.length > 0 && (
          <>
            <div className={styles.reportsList}>
              {reports.map((report) => (
                <div key={report.id} className={styles.reportCard}>
                  <div className={styles.reportHeader}>
                    <div className={styles.reportMeta}>
                      <div className={styles.reportId}>Report #{report.id}</div>
                      <div className={styles.reportDate}>
                        {formatDate(report.created_at)}
                      </div>
                    </div>
                    <div className={styles.statusBadges}>
                      <span className={`${styles.statusBadge} ${getStatusBadgeClass(report.status)}`}>
                        {report.status}
                      </span>
                      <span className={`${styles.reasonBadge} ${getReasonBadgeClass(report.reason)}`}>
                        {report.reason}
                      </span>
                    </div>
                  </div>

                  <div className={styles.reportContent}>
                    <div className={styles.reviewInfo}>
                      <h4>Reported Review</h4>
                      <p><strong>Review ID:</strong> {report.review_id}</p>
                      {report.review_user_name && (
                        <p><strong>Review by:</strong> {report.review_user_name}</p>
                      )}
                      {report.business_name && (
                        <p><strong>Business:</strong> {report.business_name}</p>
                      )}
                      {report.review_rating && (
                        <p><strong>Rating:</strong> {report.review_rating}/5</p>
                      )}
                      {report.review_comment && (
                        <div className={styles.reviewComment}>
                          <strong>Review Comment:</strong>
                          <p>{report.review_comment}</p>
                        </div>
                      )}
                    </div>

                    {report.comment && (
                      <div className={styles.reportComment}>
                        <strong>Report Comment:</strong>
                        <p>{report.comment}</p>
                      </div>
                    )}
                  </div>

                  {report.status === 'pending' && (
                    <div className={styles.reportActions}>
                      <button
                        className={`btn ${styles.reviewedBtn}`}
                        onClick={() => handleMarkAsReviewed(report.id)}
                        disabled={actioningReportId === report.id}
                      >
                        {actioningReportId === report.id ? 'Processing...' : 'Mark as Reviewed'}
                      </button>
                      <button
                        className={`btn btn-success ${styles.resolveBtn}`}
                        onClick={() => handleResolve(report.id)}
                        disabled={actioningReportId === report.id}
                      >
                        {actioningReportId === report.id ? 'Processing...' : 'Resolve'}
                      </button>
                      <button
                        className={`btn ${styles.dismissBtn}`}
                        onClick={() => handleDismiss(report.id)}
                        disabled={actioningReportId === report.id}
                      >
                        {actioningReportId === report.id ? 'Processing...' : 'Dismiss'}
                      </button>
                      <button
                        className={`btn btn-danger ${styles.deleteBtn}`}
                        onClick={() => handleDelete(report.id)}
                        disabled={actioningReportId === report.id}
                      >
                        {actioningReportId === report.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  )}

                  {report.status !== 'pending' && (
                    <div className={styles.reportActions}>
                      <button
                        className={`btn btn-danger ${styles.deleteBtn}`}
                        onClick={() => handleDelete(report.id)}
                        disabled={actioningReportId === report.id}
                      >
                        {actioningReportId === report.id ? 'Deleting...' : 'Delete'}
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
              Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} reports
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
