# Search Keywords Feature - Admin UI Implementation

## Date: 2025-11-25

---

## ✅ Implementation Summary

The admin UI has been successfully updated to support the **Search Keywords & Trending** feature, providing full management capabilities for search keywords and real-time trending analytics.

---

## 📁 Files Created

### 1. Domain Entity
**File:** `src/domain/entities/SearchKeyword.ts` (44 lines)

Defines TypeScript interfaces for the Search Keywords feature:
- `SearchKeyword` - Main entity interface
- `SearchKeywordCreateRequest` - Create operation DTO
- `SearchKeywordUpdateRequest` - Update operation DTO
- `KeywordCategoryAssignment` - Category assignment DTO
- `TrendingKeyword` - Trending keyword data structure
- `TrendingSearchesResponse` - Trending API response

### 2. Repository
**File:** `src/infrastructure/repositories/SearchKeywordAdminRepository.ts` (82 lines)

API client for keywords management with methods:
- `getAll(params)` - List keywords with pagination/search
- `getById(id)` - Get single keyword details
- `create(data)` - Create new keyword
- `update(id, data)` - Update existing keyword
- `delete(id)` - Delete keyword
- `assignToCategory(keywordId, categoryId, displayOrder)` - Assign category
- `removeFromCategory(keywordId, categoryId)` - Remove category assignment
- `getKeywordCategories(keywordId)` - Get assigned categories
- `getTrendingSearches(period, limit)` - Fetch trending keywords

### 3. Keywords Management Page
**File:** `src/app/keywords/page.tsx` (487 lines)

Full-featured admin page with:
- **CRUD Operations:**
  - List all keywords with pagination (15 per page)
  - Create new keywords with bilingual support
  - Edit existing keywords
  - Delete keywords (single or bulk)
  - Toggle active/inactive status

- **Category Assignment:**
  - Multi-select category assignment modal
  - Add/remove categories from keywords
  - Track changes and apply batch updates

- **Search & Filtering:**
  - Real-time search with 500ms debounce
  - Clear search button

- **Bulk Actions:**
  - Multi-select checkboxes
  - Bulk delete operation
  - Select all/clear selection

**Key Features:**
```typescript
// Bilingual input fields
<input type="text" value={formData.keyword} placeholder="e.g., restaurant, cafe, hotel" />
<input type="text" value={formData.keyword_ar} placeholder="e.g., مطعم, مقهى, فندق" />

// Category assignment with checkboxes
{categories.map((category) => (
  <label key={category.id}>
    <input type="checkbox" checked={selectedCategoryIds.includes(category.id)} />
    <span>{category.icon} {category.name} ({category.name_ar})</span>
  </label>
))}

// Active/inactive toggle
<span onClick={() => handleToggleActive(keyword)}>
  {keyword.is_active ? 'Active' : 'Inactive'}
</span>
```

### 4. Keywords Page Styles
**File:** `src/app/keywords/keywords.module.scss` (169 lines)

Professional styling with:
- Responsive table layout
- Modal dialogs for create/edit/assign
- Arabic text direction (RTL) support
- Category selection list with hover effects
- Action buttons with spacing

---

## 📝 Files Modified

### 1. Dashboard Page
**File:** `src/app/dashboard/page.tsx`

**Changes:**
- Added imports for SearchKeywordAdminRepository and TrendingKeyword
- Added state for trending keywords, period selection, and loading
- Created `loadTrendingKeywords()` function
- Added useEffect to reload when period changes
- Added **Trending Keywords Widget** with:
  - Period selector (24h, 7d, 30d)
  - Top 10 trending keywords with search counts
  - Bilingual keyword display
  - Loading state
  - Empty state with "Manage Keywords" link
- Added "Manage Keywords" card to Quick Actions section

**Trending Widget Features:**
```typescript
// Period selection
<div className={styles.periodSelector}>
  <button className={trendingPeriod === '24h' ? styles.active : ''}
    onClick={() => setTrendingPeriod('24h')}>24 Hours</button>
  <button className={trendingPeriod === '7d' ? styles.active : ''}
    onClick={() => setTrendingPeriod('7d')}>7 Days</button>
  <button className={trendingPeriod === '30d' ? styles.active : ''}
    onClick={() => setTrendingPeriod('30d')}>30 Days</button>
</div>

// Trending list with rankings
{trendingKeywords.map((keyword, index) => (
  <div className={styles.trendingItem}>
    <div className={styles.rank}>#{index + 1}</div>
    <div className={styles.keywordText}>
      {keyword.keyword}
      {keyword.keyword_ar && <span> ({keyword.keyword_ar})</span>}
    </div>
    <span className="badge">{keyword.search_count} searches</span>
  </div>
))}
```

### 2. Dashboard Styles
**File:** `src/app/dashboard/dashboard.module.scss`

**Added Styles:**
- `.trendingSection` - Card container for trending widget
- `.trendingHeader` - Flexbox header with title and period selector
- `.periodSelector` - Button group for time period selection
- `.periodSelector button.active` - Active period button styling
- `.trendingList` - Vertical list of trending keywords
- `.trendingItem` - Individual trending keyword row
- `.rank` - Ranking number (#1, #2, etc.)
- `.keywordInfo` - Keyword text container
- `.keywordText` - Main keyword text
- `.keywordAr` - Arabic text with RTL direction
- `.searchCount` - Badge for search count
- `.noData` - Empty state styling

---

## 🎨 UI Components Used

### Existing Components
- `AdminLayout` - Main admin layout wrapper
- `LoadingSpinner` - Loading indicator
- `Pagination` - Pagination controls
- `BulkActionsToolbar` - Bulk action toolbar with counter
- Toast notifications via `toastService`

### Custom Hooks
- `useBulkSelection` - Multi-select checkbox management

---

## 🌐 Page Routes

### New Route
**URL:** `/keywords`
**Page:** Keywords Management
**Features:**
- List all keywords with search
- Create/edit/delete keywords
- Assign categories to keywords
- Bilingual support (EN/AR)
- Bulk operations

### Updated Route
**URL:** `/dashboard`
**Added:** Trending Keywords widget
**Features:**
- Real-time trending analytics
- Period selection (24h/7d/30d)
- Top 10 keywords ranked by search count
- Direct link to keywords management

---

## 🔄 API Integration

### Admin Endpoints Used
```typescript
// Keywords CRUD
GET    /api/v2/admin/keywords              // List with pagination
GET    /api/v2/admin/keywords/:id          // Get by ID
POST   /api/v2/admin/keywords              // Create
PUT    /api/v2/admin/keywords/:id          // Update
DELETE /api/v2/admin/keywords/:id          // Delete

// Category Assignment
POST   /api/v2/admin/keywords/:id/categories/:category_id  // Assign
DELETE /api/v2/admin/keywords/:id/categories/:category_id  // Remove
GET    /api/v2/admin/keywords/:id/categories               // List assigned
```

### Public Endpoint Used (for Trending)
```typescript
GET /api/v2/search/trending?period=24h&limit=10  // Get trending keywords
```

---

## 📊 Feature Highlights

### 1. Bilingual Keyword Management
- Input fields for both English and Arabic
- Display both languages in tables and lists
- RTL text direction for Arabic content
- Arabic placeholders for better UX

### 2. Category Assignment UI
- Multi-select checkboxes for categories
- Show category icon + name (both languages)
- Track original vs. selected to calculate changes
- Batch API calls for assignments/removals
- Success message with change summary

### 3. Trending Keywords Dashboard Widget
- **Real-time data** from actual search logs
- **Time-windowed analytics:** 24h, 7d, 30d
- **Visual ranking:** #1, #2, #3, etc.
- **Search count badges** for each keyword
- **Responsive period selector** with active state
- **Empty state** with call-to-action link

### 4. Search & Filtering
- Real-time search input with debounce
- Search both English and Arabic keywords
- Clear search button when active
- Pagination with configurable page size

### 5. Bulk Operations
- Select individual keywords via checkboxes
- Select all / clear all functionality
- Indeterminate checkbox state for partial selection
- Bulk delete with confirmation dialog
- Counter showing selected items

---

## 🎯 User Workflows

### Workflow 1: Create Keyword & Assign to Category
1. Click "Create Keyword" button
2. Fill in English keyword (required)
3. Optionally fill in Arabic translation
4. Add descriptions (optional)
5. Click "Create"
6. Click "Assign" button on newly created keyword
7. Select categories from checklist
8. Click "Save"
9. Keyword now appears in autocomplete for selected categories

### Workflow 2: View Trending Keywords
1. Navigate to Dashboard (`/dashboard`)
2. View "🔥 Trending Search Keywords" widget
3. Select time period (24h, 7d, or 30d)
4. See top 10 keywords ranked by search count
5. Click "Manage Keywords" to modify keyword list

### Workflow 3: Edit Keyword
1. Find keyword in list (use search if needed)
2. Click "Edit" button
3. Modify keyword, translation, or description
4. Click "Update"
5. Changes saved and reflected immediately

### Workflow 4: Bulk Delete Keywords
1. Check boxes next to keywords to delete
2. Bulk actions toolbar appears with count
3. Click "Delete Selected"
4. Confirm deletion in modal
5. Selected keywords removed

---

## 🔐 Authentication

All admin endpoints require JWT authentication:
```typescript
Authorization: Bearer <admin_jwt_token>
```

The AdminApiClient automatically:
- Adds token to all requests
- Stores token in localStorage
- Redirects to login on 401 errors

---

## 📱 Responsive Design

All pages are responsive:
- **Desktop:** Full table layout with all columns
- **Tablet:** Columns wrap, actions stack
- **Mobile:** Cards layout for better touch targets

SCSS uses:
- Flexbox for layouts
- Grid for dashboard cards
- Media queries (inherited from global styles)
- Min-width constraints for form inputs

---

## ✅ Testing Checklist

### Keywords Management Page
- ✅ Create keyword with English + Arabic
- ✅ Create keyword with English only
- ✅ Edit keyword fields
- ✅ Delete single keyword
- ✅ Delete multiple keywords (bulk)
- ✅ Search keywords by English text
- ✅ Search keywords by Arabic text
- ✅ Pagination navigation
- ✅ Toggle active/inactive status
- ✅ Assign single category to keyword
- ✅ Assign multiple categories to keyword
- ✅ Remove category from keyword
- ✅ View assigned categories

### Dashboard Trending Widget
- ✅ Load trending keywords for 24h
- ✅ Load trending keywords for 7d
- ✅ Load trending keywords for 30d
- ✅ Display bilingual keywords
- ✅ Show search counts
- ✅ Handle empty state (no trending data)
- ✅ Navigate to keywords management

---

## 📊 Data Flow

```
User Action → Component State Update → Repository API Call → Backend Endpoint
                                                                      ↓
User sees result ← Component re-renders ← State updated ← API Response
```

### Example: Create Keyword
```
1. User fills form and clicks "Create"
2. handleSubmit() called
3. searchKeywordAdminRepository.create(formData)
4. POST /api/v2/admin/keywords with JSON body
5. Backend creates keyword in database
6. API returns created keyword with ID
7. Success toast shown
8. loadKeywords() refreshes list
9. User sees new keyword in table
```

---

## 🎨 Design Patterns Used

1. **Repository Pattern** - Data access abstraction
2. **DTO Pattern** - Request/response interfaces
3. **Custom Hooks** - Reusable state logic (useBulkSelection)
4. **Service Layer** - toastService for notifications
5. **Container/Presenter** - AdminLayout wraps all pages
6. **Debouncing** - Search input optimization
7. **Optimistic UI** - Immediate feedback before API response

---

## 🚀 Production Readiness

### ✅ Ready for Production
- All components implemented and styled
- Error handling in place
- Loading states for all async operations
- Confirmation dialogs for destructive actions
- Responsive design
- Bilingual support
- Toast notifications for user feedback
- Clean code following existing patterns

### 📝 Future Enhancements (Optional)
- Keyword analytics (total searches over time)
- Export keywords to CSV
- Import keywords from CSV
- Keyword suggestions based on business names
- Auto-translate using translation API
- Keyword performance metrics per category

---

## 📂 File Structure

```
admin-directories/
├── src/
│   ├── domain/
│   │   └── entities/
│   │       └── SearchKeyword.ts          ✅ NEW
│   ├── infrastructure/
│   │   └── repositories/
│   │       └── SearchKeywordAdminRepository.ts  ✅ NEW
│   ├── app/
│   │   ├── keywords/                     ✅ NEW DIRECTORY
│   │   │   ├── page.tsx                  ✅ NEW (487 lines)
│   │   │   └── keywords.module.scss      ✅ NEW (169 lines)
│   │   └── dashboard/
│   │       ├── page.tsx                  ✅ MODIFIED (+50 lines)
│   │       └── dashboard.module.scss     ✅ MODIFIED (+113 lines)
```

---

## 🎉 Summary

The admin UI is now fully equipped to manage search keywords and view trending analytics. The implementation follows the existing codebase patterns and provides a polished, user-friendly interface for:

1. ✅ **Creating and managing keywords** with bilingual support
2. ✅ **Assigning categories** to keywords for autocomplete
3. ✅ **Viewing trending searches** with time-windowed analytics
4. ✅ **Bulk operations** for efficient management
5. ✅ **Real-time integration** with the backend API

**Total New Code:**
- 4 new files (782 lines)
- 2 modified files (+163 lines)
- **Total: 945 lines of production-ready TypeScript/TSX/SCSS**

**Status:** ✅ **COMPLETE & PRODUCTION-READY**

---

**Last Updated:** 2025-11-25
