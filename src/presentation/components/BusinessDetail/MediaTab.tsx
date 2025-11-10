import { useState, useEffect } from 'react';
import { toastService } from '@/application/services/toastService';
import { adminApiClient } from '@/infrastructure/api/adminApiClient';
import { s3UploadService } from '@/infrastructure/services/s3UploadService';
import { businessAdminRepository } from '@/infrastructure/repositories/BusinessAdminRepository';
import LoadingSpinner from '@/presentation/components/LoadingSpinner/LoadingSpinner';
import { FiImage, FiPlus, FiTrash2, FiUpload, FiCircle, FiSquare } from 'react-icons/fi';
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
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadMedia();
  }, [businessId]);

  const loadMedia = async () => {
    try {
      setIsLoading(true);
      const response = await adminApiClient.get(`/admin/businesses/${businessId}/media`);
      // adminApiClient.get returns response.data directly, so response.data.media is the array
      setMedia(response.data?.media || []);
    } catch (err: any) {
      console.error('Failed to load media:', err);
      toastService.error('Failed to load gallery media');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = s3UploadService.validateFile(file);
    if (!validation.valid) {
      toastService.error(validation.error || 'Invalid file');
      return;
    }

    setSelectedFile(file);
    // Preview the file
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewMedia({ ...newMedia, url: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsAdding(true);
      let mediaUrl = newMedia.url;

      // If uploading a file, upload to S3 first
      if (uploadMode === 'file' && selectedFile) {
        toastService.info('Uploading to S3...');
        mediaUrl = await s3UploadService.uploadFile({
          file: selectedFile,
          uploadType: 'business_media',
          onProgress: setUploadProgress,
        });
        toastService.success('File uploaded to S3!');
      } else if (uploadMode === 'url' && !newMedia.url) {
        toastService.error('Please enter a media URL');
        return;
      }

      // Create media record in database
      await adminApiClient.post(`/admin/businesses/${businessId}/media`, {
        type: newMedia.type,
        url: mediaUrl,
        thumbnail_url: newMedia.thumbnail_url || undefined,
      });

      toastService.success('Media added successfully!');
      setShowAddModal(false);
      setNewMedia({ type: 'image', url: '', thumbnail_url: '' });
      setSelectedFile(null);
      setUploadProgress(0);
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

  const handleSetAsLogo = async (mediaId: number) => {
    toastService.confirm(
      'Set this image as business logo?',
      async () => {
        try {
          await businessAdminRepository.setLogoFromMedia(businessId, mediaId);
          toastService.success('Logo updated successfully!');
          // Optionally refresh business data to show updated logo
        } catch (err: any) {
          toastService.error(`Failed to set logo: ${err.response?.data?.message || err.message}`);
        }
      }
    );
  };

  const handleSetAsCover = async (mediaId: number) => {
    toastService.confirm(
      'Set this image as business cover?',
      async () => {
        try {
          await businessAdminRepository.setCoverFromMedia(businessId, mediaId);
          toastService.success('Cover updated successfully!');
          // Optionally refresh business data to show updated cover
        } catch (err: any) {
          toastService.error(`Failed to set cover: ${err.response?.data?.message || err.message}`);
        }
      }
    );
  };

  const handleSetAsLogoAndCover = async (mediaId: number) => {
    toastService.confirm(
      'Set this image as both logo and cover?',
      async () => {
        try {
          await businessAdminRepository.setLogoAndCoverFromMedia(businessId, mediaId, mediaId);
          toastService.success('Logo and cover updated successfully!');
          // Optionally refresh business data
        } catch (err: any) {
          toastService.error(`Failed to set logo and cover: ${err.response?.data?.message || err.message}`);
        }
      }
    );
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

                  {item.type === 'image' && (
                    <div className={styles.imageActions}>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleSetAsLogo(item.id)}
                        title="Set as Logo"
                      >
                        <FiCircle /> Logo
                      </button>
                      <button
                        className="btn btn-info btn-sm"
                        onClick={() => handleSetAsCover(item.id)}
                        title="Set as Cover"
                      >
                        <FiSquare /> Cover
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleSetAsLogoAndCover(item.id)}
                        title="Set as Logo & Cover"
                      >
                        <FiImage /> Both
                      </button>
                    </div>
                  )}

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
                <label>Upload Mode *</label>
                <div className={styles.uploadModeTabs}>
                  <button
                    type="button"
                    className={`${styles.modeTab} ${uploadMode === 'file' ? styles.active : ''}`}
                    onClick={() => setUploadMode('file')}
                  >
                    <FiUpload /> Upload File
                  </button>
                  <button
                    type="button"
                    className={`${styles.modeTab} ${uploadMode === 'url' ? styles.active : ''}`}
                    onClick={() => setUploadMode('url')}
                  >
                    <FiImage /> From URL
                  </button>
                </div>
              </div>

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

              {uploadMode === 'file' ? (
                <>
                  <div className="form-group">
                    <label>Select Image File *</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleFileSelect}
                      required
                    />
                    <small>Max size: 10MB. Supported: JPEG, PNG, GIF, WebP</small>
                  </div>

                  {selectedFile && (
                    <div className={styles.filePreview}>
                      <img src={newMedia.url} alt="Preview" />
                      <p>{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                    </div>
                  )}

                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${uploadProgress}%` }}>
                        {uploadProgress}%
                      </div>
                    </div>
                  )}
                </>
              ) : (
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
              )}

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
