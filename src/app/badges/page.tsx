'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/presentation/components/AdminLayout/AdminLayout';
import LoadingSpinner from '@/presentation/components/LoadingSpinner/LoadingSpinner';
import { badgeAdminRepository } from '@/infrastructure/repositories/BadgeAdminRepository';
import { Badge, CreateBadgeRequest } from '@/domain/entities/Badge';
import { toastService } from '@/application/services/toastService';
import { s3UploadService } from '@/infrastructure/services/s3UploadService';
import Image from 'next/image';
import { FiUpload, FiImage } from 'react-icons/fi';
import styles from './badges.module.scss';

export default function BadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
  const [formData, setFormData] = useState({
    slug: '',
    name: '',
    name_ar: '',
    image_url_en: '',
    image_url_ar: '',
    display_order: 0,
  });
  const [uploadModeEn, setUploadModeEn] = useState<'url' | 'file'>('url');
  const [uploadModeAr, setUploadModeAr] = useState<'url' | 'file'>('url');
  const [selectedFileEn, setSelectedFileEn] = useState<File | null>(null);
  const [selectedFileAr, setSelectedFileAr] = useState<File | null>(null);
  const [uploadProgressEn, setUploadProgressEn] = useState(0);
  const [uploadProgressAr, setUploadProgressAr] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      setIsLoading(true);
      const response = await badgeAdminRepository.getAll();
      setBadges(response.data || []);
    } catch (err: any) {
      console.error('Failed to load badges:', err);
      setError('Failed to load badges');
      toastService.error('Failed to load badges');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelectEn = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = s3UploadService.validateFile(file);
    if (!validation.valid) {
      toastService.error(validation.error || 'Invalid file');
      return;
    }

    setSelectedFileEn(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, image_url_en: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelectAr = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = s3UploadService.validateFile(file);
    if (!validation.valid) {
      toastService.error(validation.error || 'Invalid file');
      return;
    }

    setSelectedFileAr(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, image_url_ar: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = () => {
    setEditingBadge(null);
    setFormData({
      slug: '',
      name: '',
      name_ar: '',
      image_url_en: '',
      image_url_ar: '',
      display_order: 0,
    });
    setUploadModeEn('file');
    setUploadModeAr('file');
    setSelectedFileEn(null);
    setSelectedFileAr(null);
    setUploadProgressEn(0);
    setUploadProgressAr(0);
    setShowModal(true);
  };

  const handleEdit = (badge: Badge) => {
    setEditingBadge(badge);
    setFormData({
      slug: badge.slug,
      name: badge.name,
      name_ar: badge.name_ar || '',
      image_url_en: badge.image_url_en || '',
      image_url_ar: badge.image_url_ar || '',
      display_order: badge.display_order || 0,
    });
    // Reset upload modes and file states for consistent behavior
    setUploadModeEn('file');
    setUploadModeAr('file');
    setSelectedFileEn(null);
    setSelectedFileAr(null);
    setUploadProgressEn(0);
    setUploadProgressAr(0);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUploading(true);
      let imageUrlEn = formData.image_url_en;
      let imageUrlAr = formData.image_url_ar;

      // Upload English image if file mode
      if (uploadModeEn === 'file' && selectedFileEn) {
        toastService.info('Uploading English badge to S3...');
        imageUrlEn = await s3UploadService.uploadFile({
          file: selectedFileEn,
          uploadType: 'badge',
          onProgress: setUploadProgressEn,
        });
        toastService.success('English badge uploaded!');
      }

      // Upload Arabic image if file mode
      if (uploadModeAr === 'file' && selectedFileAr) {
        toastService.info('Uploading Arabic badge to S3...');
        imageUrlAr = await s3UploadService.uploadFile({
          file: selectedFileAr,
          uploadType: 'badge',
          onProgress: setUploadProgressAr,
        });
        toastService.success('Arabic badge uploaded!');
      }

      if (editingBadge) {
        // Update - don't send slug
        const { slug, ...data } = formData;
        await badgeAdminRepository.update(editingBadge.id, {
          ...data,
          image_url_en: imageUrlEn,
          image_url_ar: imageUrlAr,
        });
        toastService.success('Badge updated successfully!');
      } else {
        // Create - send data without slug (it's auto-generated)
        const payload: CreateBadgeRequest = {
          name: formData.name,
          name_ar: formData.name_ar,
          image_url_en: imageUrlEn,
          image_url_ar: imageUrlAr,
          display_order: formData.display_order,
        };
        await badgeAdminRepository.create(payload);
        toastService.success('Badge created successfully!');
      }
      setShowModal(false);
      setSelectedFileEn(null);
      setSelectedFileAr(null);
      setUploadProgressEn(0);
      setUploadProgressAr(0);
      loadBadges();
    } catch (err: any) {
      toastService.error(`Failed to save badge: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (badgeId: number, badgeName: string) => {
    toastService.confirm(
      `Are you sure you want to delete "${badgeName}"? This will remove it from all categories and businesses.`,
      async () => {
        try {
          await badgeAdminRepository.delete(badgeId);
          toastService.success('Badge deleted successfully!');
          loadBadges();
        } catch (err: any) {
          toastService.error(`Failed to delete badge: ${err.response?.data?.message || err.message}`);
        }
      }
    );
  };

  const handleToggleActive = async (badge: Badge) => {
    try {
      if (badge.is_active) {
        await badgeAdminRepository.deactivate(badge.id);
        toastService.success(`Badge "${badge.name}" deactivated!`);
      } else {
        await badgeAdminRepository.activate(badge.id);
        toastService.success(`Badge "${badge.name}" activated!`);
      }
      loadBadges();
    } catch (err: any) {
      toastService.error(`Failed to toggle badge: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <AdminLayout>
      <div className={styles.badgesPage}>
        <div className={styles.header}>
          <h1>Badges Management</h1>
          <button onClick={handleCreate} className="btn btn-primary">
            + Create Badge
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        {isLoading ? (
          <LoadingSpinner text="Loading badges..." />
        ) : (
          <div className={styles.badgeGrid}>
            {badges.map((badge) => (
              <div key={badge.id} className={styles.badgeCard}>
                <div className={styles.badgeImages}>
                  <div className={styles.imageContainer}>
                    <label>English</label>
                    {badge.image_url_en ? (
                      <img src={badge.image_url_en} alt={badge.name} />
                    ) : (
                      <div className={styles.noImage}>No Image</div>
                    )}
                  </div>
                  <div className={styles.imageContainer}>
                    <label>Arabic</label>
                    {badge.image_url_ar ? (
                      <img src={badge.image_url_ar} alt={badge.name_ar} />
                    ) : (
                      <div className={styles.noImage}>No Image</div>
                    )}
                  </div>
                </div>

                <div className={styles.badgeInfo}>
                  <h3>{badge.name}</h3>
                  {badge.name_ar && <p className={styles.nameAr}>{badge.name_ar}</p>}
                  <div className={styles.meta}>
                    <span className="badge badge-secondary">{badge.slug}</span>
                    <span className={`badge ${badge.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {badge.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="badge badge-info">Order: {badge.display_order}</span>
                  </div>
                </div>

                <div className={styles.actions}>
                  <button
                    onClick={() => handleEdit(badge)}
                    className="btn btn-primary btn-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleActive(badge)}
                    className={`btn btn-sm ${badge.is_active ? 'btn-warning' : 'btn-success'}`}
                  >
                    {badge.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(badge.id, badge.name)}
                    className="btn btn-danger btn-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && badges.length === 0 && (
          <div className={styles.emptyState}>
            <p>No badges found. Create your first badge to get started!</p>
          </div>
        )}

        {showModal && (
          <div className={styles.modal} onClick={() => setShowModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h2>{editingBadge ? 'Edit Badge' : 'Create Badge'}</h2>
              <form onSubmit={handleSubmit}>
                {editingBadge && (
                  <div className="form-group">
                    <label>Slug (auto-generated)</label>
                    <input
                      type="text"
                      value={formData.slug}
                      disabled
                      style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
                    />
                    <small style={{ color: '#666', fontSize: '12px' }}>
                      Slug is auto-generated and cannot be changed
                    </small>
                  </div>
                )}

                <div className="form-group">
                  <label>Name (English) *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Premium, Verified"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Name (Arabic) *</label>
                  <input
                    type="text"
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    placeholder="e.g., بريميوم، موثّق"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Image (English) *</label>
                  <div className={styles.uploadModeTabs}>
                    <button
                      type="button"
                      className={`${styles.modeTab} ${uploadModeEn === 'file' ? styles.active : ''}`}
                      onClick={() => setUploadModeEn('file')}
                    >
                      <FiUpload /> Upload File
                    </button>
                    <button
                      type="button"
                      className={`${styles.modeTab} ${uploadModeEn === 'url' ? styles.active : ''}`}
                      onClick={() => setUploadModeEn('url')}
                    >
                      <FiImage /> From URL
                    </button>
                  </div>

                  {uploadModeEn === 'file' ? (
                    <>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleFileSelectEn}
                        required={!formData.image_url_en}
                      />
                      <small>Max size: 10MB. Supported: JPEG, PNG, GIF, WebP</small>

                      {selectedFileEn && (
                        <div className={styles.filePreview}>
                          <img src={formData.image_url_en} alt="Preview" />
                          <p>{selectedFileEn.name} ({(selectedFileEn.size / 1024 / 1024).toFixed(2)} MB)</p>
                        </div>
                      )}

                      {uploadProgressEn > 0 && uploadProgressEn < 100 && (
                        <div className={styles.progressBar}>
                          <div className={styles.progressFill} style={{ width: `${uploadProgressEn}%` }}>
                            {uploadProgressEn}%
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <input
                        type="url"
                        value={formData.image_url_en}
                        onChange={(e) => setFormData({ ...formData, image_url_en: e.target.value })}
                        placeholder="https://example.com/badge-en.png"
                        required
                      />
                      {formData.image_url_en && (
                        <div className={styles.imagePreview}>
                          <img src={formData.image_url_en} alt="English preview" />
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="form-group">
                  <label>Image (Arabic) *</label>
                  <div className={styles.uploadModeTabs}>
                    <button
                      type="button"
                      className={`${styles.modeTab} ${uploadModeAr === 'file' ? styles.active : ''}`}
                      onClick={() => setUploadModeAr('file')}
                    >
                      <FiUpload /> Upload File
                    </button>
                    <button
                      type="button"
                      className={`${styles.modeTab} ${uploadModeAr === 'url' ? styles.active : ''}`}
                      onClick={() => setUploadModeAr('url')}
                    >
                      <FiImage /> From URL
                    </button>
                  </div>

                  {uploadModeAr === 'file' ? (
                    <>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleFileSelectAr}
                        required={!formData.image_url_ar}
                      />
                      <small>Max size: 10MB. Supported: JPEG, PNG, GIF, WebP</small>

                      {selectedFileAr && (
                        <div className={styles.filePreview}>
                          <img src={formData.image_url_ar} alt="Preview" />
                          <p>{selectedFileAr.name} ({(selectedFileAr.size / 1024 / 1024).toFixed(2)} MB)</p>
                        </div>
                      )}

                      {uploadProgressAr > 0 && uploadProgressAr < 100 && (
                        <div className={styles.progressBar}>
                          <div className={styles.progressFill} style={{ width: `${uploadProgressAr}%` }}>
                            {uploadProgressAr}%
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <input
                        type="url"
                        value={formData.image_url_ar}
                        onChange={(e) => setFormData({ ...formData, image_url_ar: e.target.value })}
                        placeholder="https://example.com/badge-ar.png"
                        required
                      />
                      {formData.image_url_ar && (
                        <div className={styles.imagePreview}>
                          <img src={formData.image_url_ar} alt="Arabic preview" />
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="form-group">
                  <label>Display Order</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    Lower numbers appear first (0 = highest priority)
                  </small>
                </div>

                <div className={styles.modalActions}>
                  <button type="submit" className="btn btn-primary" disabled={isUploading}>
                    {isUploading ? 'Uploading...' : editingBadge ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary"
                    disabled={isUploading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
