import { useState, useEffect } from 'react';
import { toastService } from '@/application/services/toastService';
import { adminApiClient } from '@/infrastructure/api/adminApiClient';
import LoadingSpinner from '@/presentation/components/LoadingSpinner/LoadingSpinner';
import { FiImage, FiPlus, FiTrash2, FiUpload } from 'react-icons/fi';
import styles from './MediaTab.module.scss';

interface MediaTabProps {
  businessId: number;
}

interface MediaItem {
  id: number;
  business_id: number;
  type: 'image' | 'video';
  url: string;
  thumbnail_url?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export default function MediaTab({ businessId }: MediaTabProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMedia, setNewMedia] = useState({
    type: 'image' as 'image' | 'video',
    url: '',
    thumbnail_url: '',
  });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadMedia();
  }, [businessId]);

  const loadMedia = async () => {
    try {
      setIsLoading(true);
      const response = await adminApiClient.get(`/admin/businesses/${businessId}/media`);
      setMedia(response.data?.data?.media || []);
    } catch (err: any) {
      console.error('Failed to load media:', err);
      toastService.error('Failed to load gallery media');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMedia.url) {
      toastService.error('Please enter a media URL');
      return;
    }

    try {
      setIsAdding(true);
      await adminApiClient.post(`/admin/businesses/${businessId}/media`, {
        type: newMedia.type,
        url: newMedia.url,
        thumbnail_url: newMedia.thumbnail_url || undefined,
      });

      toastService.success('Media added successfully!');
      setShowAddModal(false);
      setNewMedia({ type: 'image', url: '', thumbnail_url: '' });
      loadMedia();
    } catch (err: any) {
      toastService.error(`Failed to add media: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteMedia = async (mediaId: number) => {
    toastService.confirm(
      'Are you sure you want to delete this media item?',
      async () => {
        try {
          await adminApiClient.delete(`/admin/media/${mediaId}`);
          toastService.success('Media deleted successfully!');
          loadMedia();
        } catch (err: any) {
          toastService.error(`Failed to delete media: ${err.response?.data?.message || err.message}`);
        }
      }
    );
  };

  const handleUpdateDisplayOrder = async (mediaId: number, newOrder: number) => {
    try {
      await adminApiClient.put(`/admin/media/${mediaId}`, {
        display_order: newOrder,
      });
      toastService.success('Display order updated!');
      loadMedia();
    } catch (err: any) {
      toastService.error(`Failed to update display order: ${err.response?.data?.message || err.message}`);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading gallery media..." />;
  }

  return (
    <div className={styles.mediaTab}>
      <div className={styles.header}>
        <div>
          <h2><FiImage /> Gallery Media</h2>
          <p className={styles.subtitle}>Manage business gallery images and videos</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <FiPlus /> Add Media
        </button>
      </div>

      {media.length === 0 ? (
        <div className={styles.empty}>
          <FiImage size={48} />
          <p>No gallery media yet</p>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <FiPlus /> Add First Media Item
          </button>
        </div>
      ) : (
        <div className={styles.mediaGrid}>
          {media
            .sort((a, b) => a.display_order - b.display_order)
            .map((item) => (
              <div key={item.id} className={styles.mediaCard}>
                {item.type === 'image' ? (
                  <img src={item.url} alt="Gallery" className={styles.mediaPreview} />
                ) : (
                  <div className={styles.videoPreview}>
                    {item.thumbnail_url ? (
                      <img src={item.thumbnail_url} alt="Video thumbnail" />
                    ) : (
                      <div className={styles.videoPlaceholder}>
                        <FiImage size={32} />
                        <span>Video</span>
                      </div>
                    )}
                  </div>
                )}

                <div className={styles.mediaInfo}>
                  <div className={styles.mediaType}>
                    <span className={`badge ${item.type === 'image' ? 'badge-info' : 'badge-warning'}`}>
                      {item.type}
                    </span>
                    <span className="badge badge-secondary">Order: {item.display_order}</span>
                  </div>

                  <div className={styles.mediaActions}>
                    <input
                      type="number"
                      value={item.display_order}
                      onChange={(e) => handleUpdateDisplayOrder(item.id, parseInt(e.target.value))}
                      className={styles.orderInput}
                      title="Display order"
                      min="0"
                    />
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteMedia(item.id)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>

                <div className={styles.mediaUrl}>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" title={item.url}>
                    {item.url.length > 40 ? `${item.url.substring(0, 40)}...` : item.url}
                  </a>
                </div>
              </div>
            ))}
        </div>
      )}

      {showAddModal && (
        <div className={styles.modal} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2><FiUpload /> Add Gallery Media</h2>
            <form onSubmit={handleAddMedia}>
              <div className="form-group">
                <label>Media Type *</label>
                <select
                  value={newMedia.type}
                  onChange={(e) => setNewMedia({ ...newMedia, type: e.target.value as 'image' | 'video' })}
                  required
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>

              <div className="form-group">
                <label>Media URL *</label>
                <input
                  type="url"
                  value={newMedia.url}
                  onChange={(e) => setNewMedia({ ...newMedia, url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  required
                />
                <small>Full URL to the media file</small>
              </div>

              {newMedia.type === 'video' && (
                <div className="form-group">
                  <label>Thumbnail URL (Optional)</label>
                  <input
                    type="url"
                    value={newMedia.thumbnail_url}
                    onChange={(e) => setNewMedia({ ...newMedia, thumbnail_url: e.target.value })}
                    placeholder="https://example.com/thumbnail.jpg"
                  />
                  <small>Optional thumbnail for video preview</small>
                </div>
              )}

              <div className={styles.modalActions}>
                <button type="submit" className="btn btn-primary" disabled={isAdding}>
                  {isAdding ? 'Adding...' : 'Add Media'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                  disabled={isAdding}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
