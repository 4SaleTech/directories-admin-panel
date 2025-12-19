import { adminApiClient } from '../api/adminApiClient';
import {
  FileUploadRequest,
  BulkFileUploadRequest,
  PresignedUrlResponse,
  BulkPresignedUrlResponse,
  UploadedFile,
  UploadProgress,
  FileValidationError,
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  MAX_FILES_PER_UPLOAD,
} from '@/domain/entities/FileUpload';

// Use backend API for uploads (not external 4Sale API)
const UPLOAD_ENDPOINT = '/admin/upload/proxy';

export class FileUploadService {
  /**
   * Validate a single file
   */
  private validateFile(file: File): FileValidationError | null {
    // Check file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
      return {
        file,
        message: `File type "${file.type}" is not allowed. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
      };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        file,
        message: `File size ${(file.size / (1024 * 1024)).toFixed(2)} MB exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)} MB`,
      };
    }

    return null;
  }

  /**
   * Validate multiple files
   */
  public validateFiles(files: File[]): FileValidationError[] {
    const errors: FileValidationError[] = [];

    if (files.length > MAX_FILES_PER_UPLOAD) {
      return [
        {
          file: files[0],
          message: `Cannot upload more than ${MAX_FILES_PER_UPLOAD} files at once. You selected ${files.length} files.`,
        },
      ];
    }

    for (const file of files) {
      const error = this.validateFile(file);
      if (error) {
        errors.push(error);
      }
    }

    return errors;
  }

  /**
   * Get file extension from file name
   */
  private getFileExtension(fileName: string): string {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }

  /**
   * Upload file to S3 via backend proxy
   */
  private async uploadFileViaProxy(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      console.log('📤 Uploading file via backend:', file.name);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_type', 'business_media'); // Default to business_media

      const response = await adminApiClient.post<{ file_url: string; key: string }>(
        UPLOAD_ENDPOINT,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent: any) => {
            if (onProgress && progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress(progress);
            }
          },
        }
      );

      console.log('✅ Upload successful, file URL:', response.file_url);
      return response.file_url;
    } catch (error: any) {
      console.error('[FileUploadService] Upload failed:', error);
      throw new Error(error.message || 'Failed to upload file to backend');
    }
  }

  /**
   * Upload multiple files via backend proxy
   */
  public async uploadFiles(
    files: File[],
    onProgressUpdate?: (progress: UploadProgress[]) => void
  ): Promise<UploadedFile[]> {
    // Validate files
    const validationErrors = this.validateFiles(files);
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.map((e) => e.message).join('\n'));
    }

    // Initialize progress tracking
    const progressMap: Map<string, UploadProgress> = new Map();
    files.forEach((file) => {
      progressMap.set(file.name, {
        fileName: file.name,
        progress: 0,
        status: 'pending',
      });
    });

    const updateProgress = () => {
      if (onProgressUpdate) {
        onProgressUpdate(Array.from(progressMap.values()));
      }
    };

    try {
      // Upload files via backend
      const uploadPromises = files.map(async (file) => {
        const progress = progressMap.get(file.name);

        if (!progress) return null;

        try {
          // Update status to uploading
          progress.status = 'uploading';
          updateProgress();

          // Upload via backend
          const fileUrl = await this.uploadFileViaProxy(file, (percent) => {
            progress.progress = percent;
            updateProgress();
          });

          // Update status to success
          progress.status = 'success';
          progress.progress = 100;
          updateProgress();

          console.log('✅ Image uploaded successfully!');
          console.log('📸 File:', file.name);
          console.log('🔗 URL:', fileUrl);

          // Return uploaded file metadata
          return {
            url: fileUrl,
            fileName: file.name,
            size: file.size,
            mimeType: file.type,
          };
        } catch (error: any) {
          // Update status to error
          progress.status = 'error';
          progress.error = error.message || 'Upload failed';
          updateProgress();
          throw error;
        }
      });

      const results = await Promise.all(uploadPromises);
      return results.filter((result): result is UploadedFile => result !== null);
    } catch (error: any) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload a single file
   */
  public async uploadFile(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadedFile> {
    const results = await this.uploadFiles([file], onProgress ? (progressList) => {
      const fileProgress = progressList.find((p) => p.fileName === file.name);
      if (fileProgress) {
        onProgress(fileProgress.progress);
      }
    } : undefined);

    if (results.length === 0) {
      throw new Error('Upload failed');
    }

    return results[0];
  }
}

// Export singleton instance
export const fileUploadService = new FileUploadService();
