# 4Sale Business Directories - Admin Panel

A modern, full-featured admin panel for managing the Business Directories platform, built with Next.js 14, TypeScript, and Clean Architecture principles.

## Features

- **Authentication System**: JWT-based admin authentication with secure token management
- **Dashboard**: Real-time statistics and quick actions
- **Business Management**: Complete CRUD operations with advanced actions (verify, feature, suspend, etc.)
- **Category Management**: Organize and manage business categories
- **Section Management**: Configure homepage sections
- **Tag Management**: Manage business tags
- **Filter Management**: Setup and assign filters to categories
- **Clean Architecture**: Separation of concerns with domain, application, infrastructure, and presentation layers
- **Responsive Design**: Mobile-friendly interface
- **TypeScript**: Full type safety across the application

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5
- **Styling**: SCSS Modules
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Authentication**: JWT tokens with localStorage

## Project Structure

```
admin-directories/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── layout.tsx                # Root layout with AuthProvider
│   │   ├── page.tsx                  # Home page (redirects to dashboard/login)
│   │   ├── login/                    # Login page
│   │   ├── dashboard/                # Dashboard with statistics
│   │   └── businesses/               # Business management page
│   │
│   ├── domain/                       # Domain layer (entities & interfaces)
│   │   ├── entities/                 # Business entities & types
│   │   │   ├── Admin.ts
│   │   │   ├── Business.ts
│   │   │   ├── Category.ts
│   │   │   ├── Section.ts
│   │   │   ├── Tag.ts
│   │   │   ├── Filter.ts
│   │   │   └── ApiResponse.ts
│   │   └── repositories/             # Repository interfaces (if needed)
│   │
│   ├── application/                  # Application layer (services & contexts)
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx       # Authentication context
│   │   ├── services/                 # Business logic services
│   │   └── dtos/                     # Data transfer objects
│   │
│   ├── infrastructure/               # Infrastructure layer (API & implementations)
│   │   ├── api/
│   │   │   └── adminApiClient.ts     # Axios client with JWT interceptors
│   │   └── repositories/             # Repository implementations
│   │       ├── AuthRepository.ts
│   │       ├── BusinessAdminRepository.ts
│   │       ├── CategoryAdminRepository.ts
│   │       ├── SectionAdminRepository.ts
│   │       ├── TagAdminRepository.ts
│   │       └── FilterAdminRepository.ts
│   │
│   └── presentation/                 # Presentation layer (components & styles)
│       ├── components/
│       │   ├── AdminLayout/          # Main admin layout with sidebar
│       │   └── Sidebar/              # Navigation sidebar
│       └── styles/
│           └── globals.scss          # Global styles
│
├── public/                           # Static assets
├── .env.local                        # Environment variables
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript configuration
└── next.config.js                    # Next.js configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Backend API running on http://localhost:8080

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v2
```

3. Run the development server:
```bash
npm run dev
```

The application will be available at [http://localhost:3001](http://localhost:3001)

### Building for Production

```bash
npm run build
npm start
```

## API Integration

### Authentication

The admin panel integrates with the backend admin authentication API:

- **Login**: `POST /api/v2/admin/auth/login`
- Token is stored in localStorage and automatically included in all requests
- Automatic redirect to login page on 401 responses

### Admin Operations

All repository implementations are located in `src/infrastructure/repositories/`:

#### BusinessAdminRepository
- `getAll(params)` - List businesses with filters
- `getById(id)` - Get business details
- `create(data)` - Create new business
- `update(id, data)` - Update business
- `delete(id)` - Delete business
- `verify(id)` / `unverify(id)` - Verification actions
- `feature(id)` / `unfeature(id)` - Featured status
- `suspend(id)` / `unsuspend(id)` - Suspension actions
- `activate(id)` / `deactivate(id)` - Activation actions

#### CategoryAdminRepository
- `getAll()` - List all categories
- `getById(id)` - Get category details
- `create(data)` - Create new category
- `update(id, data)` - Update category
- `delete(id)` - Delete category
- `activate(id)` / `deactivate(id)` - Toggle active status

#### SectionAdminRepository
- `getAll()` - List all sections
- `getById(id)` - Get section details
- `create(data)` - Create new section
- `update(id, data)` - Update section
- `delete(id)` - Delete section
- `activate(id)` / `deactivate(id)` - Toggle active status

#### TagAdminRepository
- `getAll()` - List all tags
- `create(data)` - Create new tag
- `update(id, data)` - Update tag
- `delete(id)` - Delete tag

#### FilterAdminRepository
- `getAll()` - List all filters
- `getBySlug(slug)` - Get filter by slug
- `create(data)` - Create new filter
- `update(slug, data)` - Update filter
- `delete(slug)` - Delete filter
- `assignToCategory(categoryId, filterId)` - Assign filter to category
- `removeFromCategory(categoryId, filterId)` - Remove filter from category

## Creating New Pages

To add a new resource management page (e.g., Categories, Sections, Tags), follow the pattern established in the Businesses page:

1. Create a new folder in `src/app/` (e.g., `categories/`)
2. Create `page.tsx` with the page component wrapped in `<AdminLayout>`
3. Create a corresponding SCSS module for styling
4. Use the appropriate repository from `src/infrastructure/repositories/`
5. Implement list view, filters, and action buttons
6. Add the route to the Sidebar component

### Example Page Structure

```typescript
'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/presentation/components/AdminLayout/AdminLayout';
import { resourceRepository } from '@/infrastructure/repositories/ResourceRepository';

export default function ResourcePage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      const response = await resourceRepository.getAll();
      setItems(response.data);
    } catch (err) {
      console.error('Failed to load items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      {/* Your content here */}
    </AdminLayout>
  );
}
```

## Default Admin Credentials

For testing purposes, use the credentials configured in your backend seed data:

- Username: `admin`
- Password: (check your backend seed file)

## Available Scripts

- `npm run dev` - Start development server on port 3001
- `npm run build` - Build production bundle
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Authentication Flow

1. User visits the admin panel
2. If not authenticated, redirected to `/login`
3. User enters credentials
4. Backend validates and returns JWT token + admin data
5. Token stored in localStorage, admin data in context
6. All subsequent API requests include the token in Authorization header
7. On 401 response, user is automatically logged out and redirected to login

## Security Features

- JWT token-based authentication
- Automatic token refresh handling
- Protected routes with authentication check
- Secure token storage in localStorage
- Automatic cleanup on logout
- HTTPS upgrade for all HTTP requests

## Future Enhancements

To complete the admin panel, consider adding:

1. **Category Management Page**: Full CRUD for categories with activate/deactivate
2. **Section Management Page**: Configure homepage sections
3. **Tag Management Page**: Manage business tags
4. **Filter Management Page**: Create filters and assign to categories
5. **Modal Components**: For create/edit operations instead of separate pages
6. **Form Validation**: Client-side validation for all forms
7. **Toast Notifications**: Better user feedback for actions
8. **Search and Advanced Filters**: Enhanced filtering capabilities
9. **Bulk Operations**: Select multiple items for batch actions
10. **Activity Logs**: Track admin actions
11. **Role-Based Access Control**: Different permissions for super_admin, admin, moderator
12. **Internationalization**: Arabic/English interface switching

## Contributing

When adding new features:

1. Follow the clean architecture pattern
2. Create entities in `src/domain/entities/`
3. Implement repositories in `src/infrastructure/repositories/`
4. Use TypeScript strictly (no `any` types)
5. Style with SCSS modules
6. Keep components focused and reusable
7. Handle loading and error states properly

## License

Private - 4Sale Business Directories
