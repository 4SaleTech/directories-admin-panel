# Changelog - Business Directories Admin Panel

## Recent Updates (2025-10-19)

### Fixed Issues

#### 1. ChunkLoadError on Businesses Page
- **Problem**: `ChunkLoadError: Loading chunk react-quill failed`
- **Root Cause**: Corrupted Next.js build cache
- **Solution**: Clear `.next` directory and restart dev server
  ```bash
  rm -rf .next
  lsof -ti:3001 | xargs kill -9
  npm run dev
  ```

#### 2. Image Upload URL Extraction
- **Problem**: Uploaded image URL showing as `undefined`
- **Root Cause**: 4Sale API returns URL nested in `publicUrls.url`, not directly as `url`
- **Files Changed**:
  - `src/infrastructure/services/FileUploadService.ts:235` - Fixed URL extraction
  - `src/domain/entities/FileUpload.ts:16-29` - Updated PresignedUrlResponse interface
- **Solution**:
  ```typescript
  const finalUrl = (presignedData as any).publicUrls?.url || presignedData.url;
  ```

#### 3. Business Creation Validation Error
- **Problem**: 400 validation error when creating business with empty optional fields
- **Root Cause**:
  - Form sending empty strings for optional fields
  - ReactQuill adding `<p><br></p>` for empty content
- **Files Changed**: `src/app/businesses/page.tsx:175-202`
- **Solution**: Created `cleanFormData()` function that:
  - Strips HTML tags to check for actual content
  - Removes empty optional fields from request
  - Ensures required fields are always present

#### 4. Newly Created Business Not Appearing
- **Problem**: Business created successfully (201) but not visible in list
- **Root Cause**: New businesses have "pending" status, pagination might be on wrong page
- **Files Changed**: `src/app/businesses/page.tsx:204-224`
- **Solution**: Reset to page 1 and sort by newest after creation

#### 5. Filter Changes Showing Empty Page
- **Problem**: Applying filters on page 20 when results only have 6 pages shows empty page
- **Root Cause**: Filter changes didn't reset pagination
- **Files Changed**: `src/app/businesses/page.tsx:78-81`
- **Solution**: Added useEffect to reset to page 1 when filters change
  ```typescript
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.status, filters.search, filters.is_verified, filters.is_featured, filters.sort]);
  ```

## Key Files

### `/src/infrastructure/services/FileUploadService.ts`
**Purpose**: Handles complete file upload workflow

**Key Features**:
- Gets presigned URL from 4Sale API
- Uploads file to S3
- Extracts final public URL from `publicUrls.url`
- Console logging for debugging (lines 237-241)

**Usage**:
```typescript
const uploadedFiles = await fileUploadService.uploadFiles(files);
// Returns: [{ url, fileName, size, mimeType }]
```

### `/src/app/businesses/page.tsx`
**Purpose**: Main business management page

**Key Features**:
- Business list with pagination
- Filters: status, search, verified, featured
- Sorting: newest, name, rating, views
- Create/Edit business forms
- Image upload integration
- Form data cleaning to avoid validation errors

**Helper Functions**:
- `cleanFormData()` - Removes empty optional fields
- `isEmptyString()` - Checks if ReactQuill content is empty
- `handleSubmit()` - Cleans data and creates/updates business

### `/src/domain/entities/FileUpload.ts`
**Purpose**: TypeScript interfaces for file upload

**Important Interfaces**:
```typescript
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
```

## API Integration

### 4Sale Presigned URL API
- **Endpoint**: `https://apis.q84sale.com/api/v1/presigned-upload-url`
- **Method**: POST
- **Request**:
  ```json
  {
    "fileName": "example.jpg",
    "contentType": "image/jpeg"
  }
  ```
- **Response Structure**:
  ```json
  {
    "uploadUrl": "https://s3...",
    "publicUrls": {
      "url": "https://staging-media.q84sale.com/images/..."
    },
    "method": "PUT",
    "headers": {...}
  }
  ```

### Backend Admin API
- **Base URL**: `http://localhost:8080/api/v2/admin`
- **Authentication**: Bearer JWT token

**Business Endpoints**:
- `GET /businesses` - List businesses with filters
  - Query params: `page`, `limit`, `status`, `search`, `is_verified`, `is_featured`, `sort`
- `POST /businesses` - Create business
- `PUT /businesses/:id` - Update business
- `PATCH /businesses/:id/verify` - Verify business
- `PATCH /businesses/:id/feature` - Feature business
- `PATCH /businesses/:id/suspend` - Suspend business

## Form Data Cleaning

### Problem
Backend validation fails when optional fields are empty strings:
```json
{
  "about": "",
  "aboutAr": "",
  "contactNumbers": "",
  "email": "",
  "website": ""
}
```

### Solution
The `cleanFormData()` function removes empty optional fields:
```typescript
const cleanFormData = (data: any) => {
  const cleaned: any = { ...data };

  const isEmptyString = (value: string) => {
    if (!value) return true;
    const textOnly = value.replace(/<[^>]*>/g, '').trim();
    return textOnly === '';
  };

  Object.keys(cleaned).forEach(key => {
    const value = cleaned[key];
    if (typeof value === 'string' && isEmptyString(value)) {
      delete cleaned[key];
    }
  });

  return cleaned;
};
```

## UX Improvements

### Pagination Reset on Filter Change
When users apply filters, the page automatically resets to page 1 to avoid empty results:
```typescript
useEffect(() => {
  setCurrentPage(1);
}, [filters.status, filters.search, filters.is_verified, filters.is_featured, filters.sort]);
```

### Post-Creation Navigation
After creating a business, the UI:
1. Resets to page 1
2. Sorts by newest first
3. Shows the newly created business

## Environment Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Running Locally
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

**Default URL**: http://localhost:3000 or http://localhost:3001

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI**: React with Tailwind CSS (disabled in config)
- **Rich Text**: React Quill
- **Image Upload**: 4Sale Presigned URL API + S3
- **API Client**: Fetch API
- **Authentication**: JWT tokens

## Common Issues

### ChunkLoadError
**Symptoms**: Page fails to load with chunk loading error
**Solution**: Clear Next.js cache
```bash
rm -rf .next
npm run dev
```

### Images Not Uploading
**Symptoms**: Upload succeeds but URL is undefined
**Check**:
1. Verify API response structure has `publicUrls.url`
2. Check console logs for uploaded URL
3. Ensure 4Sale API is accessible

### Validation Errors on Create
**Symptoms**: 400 error with validation messages for optional fields
**Solution**: Ensure `cleanFormData()` is applied before submission

### Empty Page After Filtering
**Symptoms**: No results shown after applying filters
**Solution**: Check that useEffect resets to page 1 on filter change

## Directory Structure
```
src/
├── app/
│   ├── businesses/
│   │   └── page.tsx          # Main business management page
│   └── tags/                  # Tag management pages
├── domain/
│   └── entities/
│       └── FileUpload.ts      # Upload interfaces
├── infrastructure/
│   └── services/
│       └── FileUploadService.ts  # Upload service
└── presentation/
    └── components/
        └── ImageUploader/     # Image upload component
```

## Debug Console Logging

File upload now logs to console:
```
✅ Image uploaded successfully!
📸 File: example.jpg
🔗 URL: https://staging-media.q84sale.com/images/...
---
```

This helps verify successful uploads and track image URLs.
