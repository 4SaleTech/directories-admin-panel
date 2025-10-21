import axios from 'axios';
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

const PRESIGNED_URL_ENDPOINT =
  process.env.NEXT_PUBLIC_4SALE_PRESIGNED_URL || 'https://staging-services.q84sale.com/api/v1/presigned-uploader';
const API_TOKEN = process.env.NEXT_PUBLIC_4SALE_API_TOKEN;

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
   * Request presigned URLs from 4Sale API
   */
  private async getPresignedUrls(files: File[]): Promise<PresignedUrlResponse[]> {
    if (!API_TOKEN) {
      console.error('[FileUploadService] API token is missing!');
      throw new Error('4Sale API token is not configured. Please add NEXT_PUBLIC_4SALE_API_TOKEN to your .env.local file.');
    }

    // Prepare request payload
    const isSingleFile = files.length === 1;
    const fileRequests: FileUploadRequest[] = files.map((file) => ({
      mime: file.type,
      size: file.size,
      fileExtension: this.getFileExtension(file.name),
      type: 'user-profile',
    }));

    try {
      if (isSingleFile) {
        // Single file upload
        console.log('📤 REQUEST: Sending single file upload request');
        console.log('🔗 Endpoint:', PRESIGNED_URL_ENDPOINT);
        console.log('📦 Payload:', JSON.stringify(fileRequests[0], null, 2));

        const response = await axios.post<PresignedUrlResponse>(PRESIGNED_URL_ENDPOINT, fileRequests[0], {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${API_TOKEN}`,
          },
        });

        console.log('📥 RESPONSE: Received presigned URL response');
        console.log('📦 Response data:', JSON.stringify(response.data, null, 2));

        return [response.data];
      } else {
        // Bulk file upload
        const payload: BulkFileUploadRequest = { files: fileRequests };

        console.log('📤 REQUEST: Sending bulk file upload request');
        console.log('🔗 Endpoint:', PRESIGNED_URL_ENDPOINT);
        console.log('📦 Payload:', JSON.stringify(payload, null, 2));

        const response = await axios.post<BulkPresignedUrlResponse>(PRESIGNED_URL_ENDPOINT, payload, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${API_TOKEN}`,
          },
        });

        console.log('📥 RESPONSE: Received presigned URL response');
        console.log('📦 Response data:', JSON.stringify(response.data, null, 2));

        return response.data.files;
      }
    } catch (error: any) {
      console.error('[FileUploadService] Error getting presigned URLs:', error.response?.data || error.message);

      if (error.code === 'ERR_NETWORK') {
        throw new Error('Network error: Unable to connect to 4Sale API. Please check your internet connection.');
      }

      throw new Error(error.response?.data?.error || error.message || 'Failed to get presigned URLs');
    }
  }

  /**
   * Upload a file to S3 using presigned URL (via proxy to avoid CORS)
   */
  private async uploadToS3(
    file: File,
    presignedData: PresignedUrlResponse,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    try {
      // Use our proxy API route to bypass CORS restrictions
      const proxyUrl = `/api/upload-proxy?url=${encodeURIComponent(presignedData.uploadUrl)}`;

      const response = await fetch(proxyUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': presignedData.headers['Content-Type'] || file.type,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Upload failed with status: ${response.status}`);
      }

      // Call progress callback with 100% on success
      if (onProgress) {
        onProgress(100);
      }
    } catch (error: any) {
      console.error('[FileUploadService] Failed to upload to S3:', error.message);
      throw new Error(error.message || 'Failed to upload file to S3');
    }
  }

  /**
   * Complete upload flow: get presigned URL → upload to S3 → return final URL
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
      // Step 1: Get presigned URLs
      const presignedUrls = await this.getPresignedUrls(files);

      // Step 2: Upload files to S3
      const uploadPromises = files.map(async (file, index) => {
        const presignedData = presignedUrls[index];
        const progress = progressMap.get(file.name);

        if (!progress) return null;

        try {
          // Update status to uploading
          progress.status = 'uploading';
          updateProgress();

          // Upload to S3
          await this.uploadToS3(file, presignedData, (percent) => {
            progress.progress = percent;
            updateProgress();
          });

          // Update status to success
          progress.status = 'success';
          progress.progress = 100;
          updateProgress();

          // Extract the final URL from the API response (nested in publicUrls.url)
          const finalUrl = (presignedData as any).publicUrls?.url || presignedData.url;

          // Log the uploaded image URL
          console.log('✅ Image uploaded successfully!');
          console.log('📸 File:', file.name);
          console.log('🔗 URL:', finalUrl);
          console.log('---');

          // Return uploaded file metadata with the URL from API response
          return {
            url: finalUrl,
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
