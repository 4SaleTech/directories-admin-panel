'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { fileUploadService } from '@/infrastructure/services/FileUploadService';
import { UploadedFile, UploadProgress, ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from '@/domain/entities/FileUpload';
import { FiUpload, FiX, FiCheck, FiAlertCircle, FiImage } from 'react-icons/fi';
import styles from './ImageUploader.module.scss';

interface ImageUploaderProps {
  maxFiles?: number;
  onUploadComplete: (files: UploadedFile[]) => void;
  defaultImages?: string[];
  single?: boolean;
  label?: string;
  helpText?: string;
}

interface ImagePreview extends UploadedFile {
  previewUrl?: string; // Local blob URL for immediate preview
}

export default function ImageUploader({
  maxFiles = 10,
  onUploadComplete,
  defaultImages = [],
  single = false,
  label = 'Upload Images',
  helpText = 'Drag and drop images here, or click to select files',
}: ImageUploaderProps) {
  const [uploadedImages, setUploadedImages] = useState<ImagePreview[]>(
    defaultImages.map((url, index) => ({
      url,
      fileName: `image-${index}`,
      size: 0,
      mimeType: 'image/jpeg',
      previewUrl: url, // Use the default image URL as preview
    }))
  );
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setError(null);
      setIsUploading(true);

      try {
        // If single mode, only allow one file
        const filesToUpload = single ? [acceptedFiles[0]] : acceptedFiles;

        // Create local preview URLs for immediate display
        const previewImages: ImagePreview[] = filesToUpload.map((file) => ({
          url: '', // Will be filled after upload
          fileName: file.name,
          size: file.size,
          mimeType: file.type,
          previewUrl: URL.createObjectURL(file), // Local blob URL for immediate preview
        }));

        // Show previews immediately
        const tempImages = single ? previewImages : [...uploadedImages, ...previewImages];
        setUploadedImages(tempImages);

        // Upload files to S3
        const results = await fileUploadService.uploadFiles(filesToUpload, (progress) => {
          setUploadProgress(progress);
        });

        // Update with actual S3 URLs while keeping preview URLs
        const finalImages: ImagePreview[] = results.map((result, index) => ({
          ...result,
          previewUrl: previewImages[index].previewUrl, // Keep local preview
        }));

        const newImages = single ? finalImages : [...uploadedImages, ...finalImages];
        setUploadedImages(newImages);

        // Pass only the S3 URLs (without preview URLs) to parent
        onUploadComplete(newImages.map(({ previewUrl, ...rest }) => rest));

        // Clear progress
        setUploadProgress([]);
      } catch (err: any) {
        console.error('Upload error:', err);
        setError(err.message || 'Failed to upload images');
      } finally {
        setIsUploading(false);
      }
    },
    [uploadedImages, onUploadComplete, single]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ALLOWED_IMAGE_TYPES.map((type) => `.${type.split('/')[1]}`),
    },
    maxSize: MAX_FILE_SIZE,
    maxFiles: single ? 1 : maxFiles,
    disabled: isUploading || (single && uploadedImages.length > 0),
  });

  const handleRemoveImage = (index: number) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);
    onUploadComplete(newImages);
  };

  const getStatusIcon = (status: UploadProgress['status']) => {
    switch (status) {
      case 'success':
        return <FiCheck className={styles.successIcon} />;
      case 'error':
        return <FiAlertCircle className={styles.errorIcon} />;
      case 'uploading':
        return <div className={styles.spinner} />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.imageUploader}>
      {label && <label className={styles.label}>{label}</label>}

      {/* Dropzone */}
      {(!single || uploadedImages.length === 0) && (
        <div
          {...getRootProps()}
          className={`${styles.dropzone} ${isDragActive ? styles.active : ''} ${isUploading ? styles.disabled : ''}`}
        >
          <input {...getInputProps()} />
          <FiUpload className={styles.uploadIcon} />
          <p className={styles.dropzoneText}>
            {isDragActive ? 'Drop files here...' : helpText}
          </p>
          <p className={styles.dropzoneHint}>
            Max {single ? '1 file' : `${maxFiles} files`}, {MAX_FILE_SIZE / (1024 * 1024)}MB per file
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className={styles.error}>
          <FiAlertCircle />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className={styles.progressContainer}>
          {uploadProgress.map((progress) => (
            <div key={progress.fileName} className={styles.progressItem}>
              <div className={styles.progressHeader}>
                <span className={styles.fileName}>{progress.fileName}</span>
                {getStatusIcon(progress.status)}
              </div>
              <div className={styles.progressBar}>
                <div
                  className={`${styles.progressFill} ${
                    progress.status === 'error' ? styles.error : ''
                  }`}
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              {progress.error && (
                <p className={styles.progressError}>{progress.error}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Images Preview */}
      {uploadedImages.length > 0 && (
        <div className={styles.imagesGrid}>
          {uploadedImages.map((image, index) => (
            <div key={index} className={styles.imagePreview}>
              <div className={styles.imageWrapper}>
                <img src={image.previewUrl || image.url} alt={image.fileName} />
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => handleRemoveImage(index)}
                  title="Remove image"
                >
                  <FiX />
                </button>
              </div>
              <p className={styles.imageName}>{image.fileName}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
