'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/presentation/components/AdminLayout/AdminLayout';
import { useAuth } from '@/application/contexts/AuthContext';
import {
  openSearchAdminRepository,
  OpenSearchStatus,
  UnsyncedCounts,
} from '@/infrastructure/repositories/OpenSearchAdminRepository';
import { toastService } from '@/application/services/toastService';
import styles from './page.module.scss';

interface ActionResult {
  type: 'success' | 'error';
  message: string;
}

export default function OpenSearchPage() {
  const { admin } = useAuth();
  const [status, setStatus] = useState<OpenSearchStatus | null>(null);
  const [unsyncedCounts, setUnsyncedCounts] = useState<UnsyncedCounts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<Record<string, ActionResult>>({});
  const [confirmModal, setConfirmModal] = useState<{
    action: string;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Role check
  if (admin?.role !== 'super_admin') {
    return (
      <AdminLayout>
        <div className={styles.accessDenied}>
          <h2>Access Denied</h2>
          <p>This page is only accessible to super administrators.</p>
        </div>
      </AdminLayout>
    );
  }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [statusRes, unsyncedRes] = await Promise.all([
        openSearchAdminRepository.getStatus(),
        openSearchAdminRepository.getUnsyncedCounts(),
      ]);
      setStatus(statusRes.data || null);
      setUnsyncedCounts(unsyncedRes.data || null);
    } catch (err: any) {
      console.error('Failed to load OpenSearch data:', err);
      toastService.error('Failed to load OpenSearch status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setActionLoading('refresh');
    await loadData();
    setActionLoading(null);
    toastService.success('Data refreshed');
  };

  const handleReindexBusinesses = async () => {
    setActionLoading('reindex-businesses');
    setActionResult((prev) => ({ ...prev, 'reindex-businesses': undefined as any }));
    try {
      const response = await openSearchAdminRepository.reindexBusinesses(500);
      const data = response.data;
      setActionResult((prev) => ({
        ...prev,
        'reindex-businesses': {
          type: 'success',
          message: `Synced: ${data?.synced || 0}, Failed: ${data?.failed || 0}`,
        },
      }));
      toastService.success('Business reindex completed');
      await loadData();
    } catch (err: any) {
      setActionResult((prev) => ({
        ...prev,
        'reindex-businesses': { type: 'error', message: err.message || 'Reindex failed' },
      }));
      toastService.error('Business reindex failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReindexReviews = async () => {
    setActionLoading('reindex-reviews');
    setActionResult((prev) => ({ ...prev, 'reindex-reviews': undefined as any }));
    try {
      const response = await openSearchAdminRepository.reindexReviews(500);
      const data = response.data;
      setActionResult((prev) => ({
        ...prev,
        'reindex-reviews': {
          type: 'success',
          message: `Synced: ${data?.synced || 0}, Failed: ${data?.failed || 0}`,
        },
      }));
      toastService.success('Review reindex completed');
      await loadData();
    } catch (err: any) {
      setActionResult((prev) => ({
        ...prev,
        'reindex-reviews': { type: 'error', message: err.message || 'Reindex failed' },
      }));
      toastService.error('Review reindex failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReindexAll = async () => {
    setConfirmModal({
      action: 'reindex-all',
      title: 'Reindex All Data',
      message:
        'This will reindex all businesses and reviews. This operation runs in the background and may take several minutes. Continue?',
      onConfirm: async () => {
        setConfirmModal(null);
        setActionLoading('reindex-all');
        try {
          await openSearchAdminRepository.reindexAll(500);
          toastService.success('Full reindex started in background');
          await loadData();
        } catch (err: any) {
          toastService.error('Failed to start reindex');
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleMarkAllUnsynced = async () => {
    setConfirmModal({
      action: 'mark-unsynced',
      title: 'Mark All Businesses Unsynced',
      message:
        'This will mark all businesses as unsynced. You will need to run a reindex operation afterward. Continue?',
      onConfirm: async () => {
        setConfirmModal(null);
        setActionLoading('mark-unsynced');
        setActionResult((prev) => ({ ...prev, 'mark-unsynced': undefined as any }));
        try {
          const response = await openSearchAdminRepository.markAllBusinessesUnsynced();
          const data = response.data;
          setActionResult((prev) => ({
            ...prev,
            'mark-unsynced': {
              type: 'success',
              message: `${data?.businesses_marked || 0} businesses marked as unsynced`,
            },
          }));
          toastService.success('All businesses marked as unsynced');
          await loadData();
        } catch (err: any) {
          setActionResult((prev) => ({
            ...prev,
            'mark-unsynced': { type: 'error', message: err.message || 'Operation failed' },
          }));
          toastService.error('Failed to mark businesses as unsynced');
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleRecreateIndex = async () => {
    setConfirmModal({
      action: 'recreate-index',
      title: 'Recreate Index',
      message:
        'WARNING: This will DELETE the entire search index and recreate it with the latest mapping. All data will be removed from the index. You must run mark-all-unsynced and reindex afterward to repopulate the data. This is a destructive operation. Are you absolutely sure?',
      onConfirm: async () => {
        setConfirmModal(null);
        setActionLoading('recreate-index');
        try {
          await openSearchAdminRepository.recreateIndex();
          toastService.success('Index recreated successfully');
          await loadData();
        } catch (err: any) {
          toastService.error('Failed to recreate index');
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleSwitchBackend = async () => {
    const newBackend = status?.current_backend === 'elasticsearch' ? 'database' : 'elasticsearch';
    setConfirmModal({
      action: 'switch-backend',
      title: 'Switch Search Backend',
      message: `This will switch the search backend from "${status?.current_backend}" to "${newBackend}". This affects all search queries immediately. Continue?`,
      onConfirm: async () => {
        setConfirmModal(null);
        setActionLoading('switch-backend');
        try {
          await openSearchAdminRepository.switchBackend(newBackend);
          toastService.success(`Backend switched to ${newBackend}`);
          await loadData();
        } catch (err: any) {
          toastService.error('Failed to switch backend');
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  return (
    <AdminLayout>
      <div className={styles.opensearchPage}>
        <h1 className={styles.title}>OpenSearch Management</h1>

        {isLoading ? (
          <div className={styles.loading}>Loading OpenSearch status...</div>
        ) : (
          <>
            {/* Status Section */}
            <div className={styles.statusSection}>
              <h2>Connection Status</h2>
              <div className={styles.statusGrid}>
                <div className={styles.statusItem}>
                  <div
                    className={`${styles.statusIndicator} ${status?.connected ? styles.connected : styles.disconnected}`}
                  />
                  <div>
                    <div className={styles.statusLabel}>Connection</div>
                    <div className={styles.statusValue}>
                      {status?.connected ? 'Connected' : 'Disconnected'}
                    </div>
                  </div>
                </div>

                <div className={styles.statusItem}>
                  <div
                    className={`${styles.statusIndicator} ${status?.current_backend === 'elasticsearch' ? styles.connected : styles.idle}`}
                  />
                  <div>
                    <div className={styles.statusLabel}>Current Backend</div>
                    <div className={styles.statusValue}>
                      {status?.current_backend || 'Unknown'}
                    </div>
                  </div>
                </div>

                <div className={styles.statusItem}>
                  <div
                    className={`${styles.statusIndicator} ${status?.reindex_running ? styles.running : styles.idle}`}
                  />
                  <div>
                    <div className={styles.statusLabel}>Reindex Status</div>
                    <div className={styles.statusValue}>
                      {status?.reindex_running ? 'Running' : 'Idle'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className={styles.statsSection}>
              <h2>
                Sync Status
                <button
                  className={styles.refreshBtn}
                  onClick={handleRefresh}
                  disabled={actionLoading === 'refresh'}
                >
                  {actionLoading === 'refresh' ? 'Refreshing...' : 'Refresh'}
                </button>
              </h2>
              <div className={styles.statsGrid}>
                <div
                  className={`${styles.statCard} ${(unsyncedCounts?.unsynced_businesses || 0) > 0 ? styles.warning : styles.success}`}
                >
                  <div className={styles.statIcon}>🏢</div>
                  <div className={styles.statContent}>
                    <h3>Unsynced Businesses</h3>
                    <p className={styles.statNumber}>
                      {unsyncedCounts?.unsynced_businesses || 0}
                    </p>
                  </div>
                </div>

                <div
                  className={`${styles.statCard} ${(unsyncedCounts?.unsynced_reviews || 0) > 0 ? styles.warning : styles.success}`}
                >
                  <div className={styles.statIcon}>⭐</div>
                  <div className={styles.statContent}>
                    <h3>Unsynced Reviews</h3>
                    <p className={styles.statNumber}>
                      {unsyncedCounts?.unsynced_reviews || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Section */}
            <div className={styles.actionsSection}>
              <h2>Actions</h2>
              <div className={styles.actionsGrid}>
                {/* Reindex Businesses */}
                <div className={styles.actionCard}>
                  <h3>📤 Reindex Businesses</h3>
                  <p>Sync all unsynced businesses to the search index.</p>
                  <button
                    className={styles.btnPrimary}
                    onClick={handleReindexBusinesses}
                    disabled={actionLoading === 'reindex-businesses'}
                  >
                    {actionLoading === 'reindex-businesses'
                      ? 'Reindexing...'
                      : 'Reindex Businesses'}
                  </button>
                  {actionResult['reindex-businesses'] && (
                    <div
                      className={`${styles.resultMessage} ${styles[actionResult['reindex-businesses'].type]}`}
                    >
                      {actionResult['reindex-businesses'].message}
                    </div>
                  )}
                </div>

                {/* Reindex Reviews */}
                <div className={styles.actionCard}>
                  <h3>📤 Reindex Reviews</h3>
                  <p>Sync all unsynced reviews to the search index.</p>
                  <button
                    className={styles.btnPrimary}
                    onClick={handleReindexReviews}
                    disabled={actionLoading === 'reindex-reviews'}
                  >
                    {actionLoading === 'reindex-reviews' ? 'Reindexing...' : 'Reindex Reviews'}
                  </button>
                  {actionResult['reindex-reviews'] && (
                    <div
                      className={`${styles.resultMessage} ${styles[actionResult['reindex-reviews'].type]}`}
                    >
                      {actionResult['reindex-reviews'].message}
                    </div>
                  )}
                </div>

                {/* Reindex All */}
                <div className={styles.actionCard}>
                  <h3>🔄 Reindex All</h3>
                  <p>Trigger a full reindex of all businesses and reviews in the background.</p>
                  <button
                    className={styles.btnPrimary}
                    onClick={handleReindexAll}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === 'reindex-all' ? 'Starting...' : 'Reindex All'}
                  </button>
                </div>

                {/* Mark All Unsynced */}
                <div className={styles.actionCard}>
                  <h3>🔃 Mark All Unsynced</h3>
                  <p>Mark all businesses as unsynced. Run reindex afterward to sync them.</p>
                  <button
                    className={styles.btnWarning}
                    onClick={handleMarkAllUnsynced}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === 'mark-unsynced' ? 'Processing...' : 'Mark All Unsynced'}
                  </button>
                  {actionResult['mark-unsynced'] && (
                    <div
                      className={`${styles.resultMessage} ${styles[actionResult['mark-unsynced'].type]}`}
                    >
                      {actionResult['mark-unsynced'].message}
                    </div>
                  )}
                </div>

                {/* Recreate Index */}
                <div className={styles.actionCard}>
                  <h3>⚠️ Recreate Index</h3>
                  <p>
                    Delete and recreate the search index with latest mapping. All data will be
                    removed.
                  </p>
                  <button
                    className={styles.btnDanger}
                    onClick={handleRecreateIndex}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === 'recreate-index' ? 'Recreating...' : 'Recreate Index'}
                  </button>
                </div>

                {/* Switch Backend */}
                <div className={styles.actionCard}>
                  <h3>🔀 Switch Backend</h3>
                  <p>
                    Toggle between ElasticSearch and Database backend. Current:{' '}
                    <strong>{status?.current_backend || 'Unknown'}</strong>
                  </p>
                  <button
                    className={styles.btnSecondary}
                    onClick={handleSwitchBackend}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === 'switch-backend'
                      ? 'Switching...'
                      : `Switch to ${status?.current_backend === 'elasticsearch' ? 'Database' : 'ElasticSearch'}`}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Confirmation Modal */}
        {confirmModal && (
          <div className={styles.modalOverlay} onClick={() => setConfirmModal(null)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h3>{confirmModal.title}</h3>
              <p>{confirmModal.message}</p>
              <div className={styles.modalActions}>
                <button className={styles.modalCancel} onClick={() => setConfirmModal(null)}>
                  Cancel
                </button>
                <button
                  className={
                    confirmModal.action === 'recreate-index' ? styles.btnDanger : styles.btnPrimary
                  }
                  onClick={confirmModal.onConfirm}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
