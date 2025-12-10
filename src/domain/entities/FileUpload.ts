/**
 * File Upload Types for 4Sale Presigned URL API
 */

export interface FileUploadRequest {
  mime: string;
  size: number;
  type?: 'user-profile' | 'user_adv';
  fileExtension?: string;
}

export interface BulkFileUploadRequest {
  files: FileUploadRequest[];
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  url?: string; // Deprecated - use publicUrls.url instead
  publicUrls?: {
    url: string;
  };
  method: string;
  headers: Record<string, string>;
  uploadBucket: string;
  uploadKey: string;
  processedBucket: string;
  processedKey: string;
  expiresIn: number;
}

export interface BulkPresignedUrlResponse {
  files: PresignedUrlResponse[];
}

export interface UploadedFile {
  url: string;
  fileName: string;
  size: number;
  mimeType: string;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface FileValidationError {
  file: File;
  message: string;
}

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/tiff',
  'image/heic',
  'image/heif',
  'image/avif',
  'image/x-icon',
] as const;

export const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
export const MAX_FILES_PER_UPLOAD = 10;
