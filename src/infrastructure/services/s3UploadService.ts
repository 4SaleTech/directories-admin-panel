import { adminApiClient } from '../api/adminApiClient';

export interface S3UploadResponse {
  upload_url: string;
  file_url: string;
  key: string;
}

export type UploadType =
  | 'business_logo'
  | 'business_cover'
  | 'business_media'
  | 'business_menu'
  | 'badge'
  | 'category_icon';

export interface UploadFileParams {
  file: File;
  uploadType: UploadType;
  onProgress?: (progress: number) => void;
}

/**
 * S3 Upload Service
 * Handles file uploads to AWS S3 via pre-signed URLs
 */
class S3UploadService {
  /**
   * Upload a file to S3 via proxy (bypasses CORS)
   * Uploads through backend server instead of directly to S3
   */
  async uploadFileViaProxy({ file, uploadType, onProgress }: UploadFileParams): Promise<string> {
    try {
      console.log('Uploading via proxy:', file.name, uploadType);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_type', uploadType);

      const response = await adminApiClient.post<{ file_url: string; key: string }>(
        '/admin/upload/proxy',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress(progress);
            }
          },
        }
      );

      console.log('Proxy upload successful, file URL:', response.file_url);
      return response.file_url;
    } catch (error: any) {
      console.error('Proxy upload failed:', error);
      console.error('Error details:', error.response || error.message);
      throw new Error(error.message || 'Failed to upload file. Please try again.');
    }
  }

  /**
   * Upload a file to S3
   * 1. Request pre-signed URL from backend
   * 2. Upload file directly to S3
   * 3. Return the public URL
   */
  async uploadFile({ file, uploadType, onProgress }: UploadFileParams): Promise<string> {
    // Use proxy upload by default to avoid CORS issues
    return this.uploadFileViaProxy({ file, uploadType, onProgress });
  }

  /**
   * Upload file directly to S3 using pre-signed URL
   */
  private async uploadToS3(
    uploadUrl: string,
    file: File,
    contentType: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        console.log('S3 upload response status:', xhr.status);
        console.log('S3 upload response:', xhr.responseText);
        if (xhr.status === 200) {
          resolve();
        } else {
          reject(new Error(`S3 upload failed with status: ${xhr.status} - ${xhr.responseText}`));
        }
      });

      xhr.addEventListener('error', (e) => {
        console.error('S3 upload error event:', e);
        reject(new Error('Network error during S3 upload'));
      });

      xhr.addEventListener('abort', () => {
        console.error('S3 upload aborted');
        reject(new Error('Upload aborted'));
      });

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', contentType);
      xhr.send(file);
    });
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File, maxSizeMB: number = 10): { valid: boolean; error?: string } {
    // Check file size (default 10MB)
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size must be less than ${maxSizeMB}MB`,
      };
    }

    // Check file type (images only)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Only image files (JPEG, PNG, GIF, WebP) are allowed',
      };
    }

    return { valid: true };
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: File[],
    uploadType: UploadType,
    onProgress?: (fileIndex: number, progress: number) => void
  ): Promise<string[]> {
    const uploadPromises = files.map((file, index) =>
      this.uploadFile({
        file,
        uploadType,
        onProgress: onProgress ? (progress) => onProgress(index, progress) : undefined,
      })
    );

    return Promise.all(uploadPromises);
  }
}

export const s3UploadService = new S3UploadService();
