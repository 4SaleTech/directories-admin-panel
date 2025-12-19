'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/presentation/components/AdminLayout/AdminLayout';
import LoadingSpinner from '@/presentation/components/LoadingSpinner/LoadingSpinner';
import Pagination from '@/presentation/components/Pagination/Pagination';
import BulkActionsToolbar from '@/presentation/components/BulkActionsToolbar/BulkActionsToolbar';
import IconPicker from '@/presentation/components/IconPicker/IconPicker';
import SEOFields from '@/presentation/components/SEOFields/SEOFields';
import { useBulkSelection } from '@/application/hooks/useBulkSelection';
import { categoryAdminRepository } from '@/infrastructure/repositories/CategoryAdminRepository';
import { badgeAdminRepository } from '@/infrastructure/repositories/BadgeAdminRepository';
import { Category } from '@/domain/entities/Category';
import { Badge } from '@/domain/entities/Badge';
import { toastService } from '@/application/services/toastService';
import styles from './categories.module.scss';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 15;
  const [filters, setFilters] = useState({
    search: '',
    is_active: '',
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    description: '',
    description_ar: '',
    icon: '',
    display_order: 0,
    page_title: '',
    page_description: '',
    meta_title: '',
    meta_description: '',
    page_title_ar: '',
    page_description_ar: '',
    meta_title_ar: '',
    meta_description_ar: '',
    og_image: '',
  });

  // Badge assignment state
  const [badges, setBadges] = useState<Badge[]>([]);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedBadgeIds, setSelectedBadgeIds] = useState<number[]>([]);
  const [originalBadgeIds, setOriginalBadgeIds] = useState<number[]>([]);

  const bulkSelection = useBulkSelection({
    items: categories,
    getItemId: (category) => category.id,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearch, filters.is_active]);

  useEffect(() => {
    // Clear selection when categories change (e.g., after delete or page change)
    bulkSelection.clearSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const params: any = { page: currentPage, limit: itemsPerPage };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.is_active) params.is_active = filters.is_active === 'true';

      const response = await categoryAdminRepository.getAll(params);
      setCategories(response.data || []);
      setTotalPages(response.pagination?.total_pages || 1);
      setTotalItems(response.pagination?.total_count || 0);
    } catch (err: any) {
      console.error('Failed to load categories:', err);
      setError('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  const loadBadges = async () => {
    try {
      const response = await badgeAdminRepository.getAll();
      setBadges(response.data || []);
    } catch (err) {
      console.error('Failed to load badges:', err);
    }
  };

  const handleManageBadges = async (category: Category) => {
    setSelectedCategory(category);
    setShowBadgeModal(true);

    // Fetch current badge assignments
    try {
      const response = await badgeAdminRepository.getCategoryBadges(category.id);
      const badgeIds = response.data?.map((b) => b.id) || [];
      setSelectedBadgeIds(badgeIds);
      setOriginalBadgeIds(badgeIds);
    } catch (err: any) {
      console.error('Failed to load category badges:', err);
      setSelectedBadgeIds([]);
      setOriginalBadgeIds([]);
    }
  };

  const handleBadgeAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;

    try {
      // Assign all selected badges
      await badgeAdminRepository.assignBadgesToCategory(
        selectedCategory.id,
        selectedBadgeIds
      );

      toastService.success('Category badges updated successfully!');
      setShowBadgeModal(false);
    } catch (err: any) {
      toastService.error(`Failed to update badges: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      name_ar: '',
      description: '',
      description_ar: '',
      icon: '',
      display_order: 0,
      page_title: '',
      page_description: '',
      meta_title: '',
      meta_description: '',
      page_title_ar: '',
      page_description_ar: '',
      meta_title_ar: '',
      meta_description_ar: '',
      og_image: '',
    });
    setShowModal(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      name_ar: category.name_ar || '',
      description: category.description || '',
      description_ar: category.description_ar || '',
      icon: category.icon || category.icon_url || '',
      display_order: category.display_order,
      page_title: category.page_title || '',
      page_description: category.page_description || '',
      meta_title: category.meta_title || '',
      meta_description: category.meta_description || '',
      page_title_ar: category.page_title_ar || '',
      page_description_ar: category.page_description_ar || '',
      meta_title_ar: category.meta_title_ar || '',
      meta_description_ar: category.meta_description_ar || '',
      og_image: category.og_image || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await categoryAdminRepository.update(editingCategory.id, formData);
        toastService.success('Category updated successfully!');
      } else {
        await categoryAdminRepository.create(formData);
        toastService.success('Category created successfully!');
      }
      setShowModal(false);
      loadCategories();
    } catch (err: any) {
      toastService.error(err.response?.data?.message || err.message || 'Failed to save category');
    }
  };

  const handleAction = async (action: string, categoryId: number, categoryName: string) => {
    if (action === 'delete') {
      toastService.confirm(
        `Are you sure you want to delete "${categoryName}"?`,
        async () => {
          try {
            await categoryAdminRepository.delete(categoryId);
            toastService.success('Category deleted successfully!');
            loadCategories();
          } catch (err: any) {
            toastService.error(err.response?.data?.message || err.message || 'Failed to delete category');
          }
        }
      );
      return;
    }

    try {
      switch (action) {
        case 'activate':
          await categoryAdminRepository.activate(categoryId);
          toastService.success('Category activated successfully!');
          break;
        case 'deactivate':
          await categoryAdminRepository.deactivate(categoryId);
          toastService.success('Category deactivated successfully!');
          break;
      }
      loadCategories();
    } catch (err: any) {
      toastService.error(err.response?.data?.message || err.message || `Failed to ${action} category`);
    }
  };

  const handleBulkDelete = async () => {
    const count = bulkSelection.selectedCount;
    const categoryNames = bulkSelection.selectedItems.map((c) => c.name).join(', ');

    toastService.confirm({
      message: `Are you sure you want to delete ${count} categor${count > 1 ? 'ies' : 'y'}? (${categoryNames})`,
      onConfirm: async () => {
        try {
          await Promise.all(
            bulkSelection.selectedItems.map((category) =>
              categoryAdminRepository.delete(category.id)
            )
          );
          toastService.success(`Successfully deleted ${count} categor${count > 1 ? 'ies' : 'y'}!`);
          bulkSelection.clearSelection();
          loadCategories();
        } catch (err: any) {
          toastService.error(`Failed to delete categories: ${err.response?.data?.message || err.message}`);
        }
      },
    });
  };

  return (
    <AdminLayout>
      <div className={styles.categoriesPage}>
        <div className={styles.header}>
          <h1>Categories Management</h1>
          <button onClick={handleCreate} className="btn btn-primary">
            + Create Category
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        <div className={styles.filters}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Search categories..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <div className="form-group">
            <select
              value={filters.is_active}
              onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          {(filters.search || filters.is_active) && (
            <div className="form-group">
              <button
                onClick={() => setFilters({ search: '', is_active: '' })}
                className="btn btn-secondary"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        <BulkActionsToolbar
          selectedCount={bulkSelection.selectedCount}
          onClearSelection={bulkSelection.clearSelection}
          actions={[
            {
              label: 'Delete Selected',
              onClick: handleBulkDelete,
              variant: 'danger',
              icon: '🗑️',
            },
          ]}
        />

        {isLoading ? (
          <LoadingSpinner text="Loading categories..." />
        ) : (
          <div className={styles.tableWrapper}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={bulkSelection.isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = bulkSelection.isIndeterminate;
                      }}
                      onChange={bulkSelection.toggleAll}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th>Display Order</th>
                  <th>Businesses</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={bulkSelection.isSelected(category.id)}
                        onChange={() => bulkSelection.toggleSelection(category.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td>{category.id}</td>
                    <td>
                      <strong>{category.name}</strong>
                      {category.name_ar && (
                        <div className={styles.nameAr}>{category.name_ar}</div>
                      )}
                    </td>
                    <td>
                      <code>{category.slug}</code>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          category.is_active ? 'badge-success' : 'badge-secondary'
                        }`}
                      >
                        {category.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{category.display_order}</td>
                    <td>{category.businesses_count || 0}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          onClick={() => handleEdit(category)}
                          className="btn btn-primary btn-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleManageBadges(category)}
                          className="btn btn-info btn-sm"
                        >
                          Badges
                        </button>
                        {category.is_active ? (
                          <button
                            onClick={() =>
                              handleAction('deactivate', category.id, category.name)
                            }
                            className="btn btn-secondary btn-sm"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleAction('activate', category.id, category.name)
                            }
                            className="btn btn-success btn-sm"
                          >
                            Activate
                          </button>
                        )}
                        <button
                          onClick={() => handleAction('delete', category.id, category.name)}
                          className="btn btn-danger btn-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && categories.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}

        {showModal && (
          <div className={styles.modal} onClick={() => setShowModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h2>{editingCategory ? 'Edit Category' : 'Create Category'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Name (Arabic)</label>
                  <input
                    type="text"
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  />
                </div>

                {editingCategory && (
                  <div className="form-group">
                    <label>Slug (auto-generated)</label>
                    <input
                      type="text"
                      value={editingCategory.slug}
                      disabled
                      style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
                    />
                    <small style={{ color: '#666', fontSize: '12px' }}>
                      Slug is auto-generated and cannot be changed
                    </small>
                  </div>
                )}

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Description (Arabic)</label>
                  <textarea
                    value={formData.description_ar}
                    onChange={(e) =>
                      setFormData({ ...formData, description_ar: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <IconPicker
                    value={formData.icon}
                    onChange={(value) => setFormData({ ...formData, icon: value })}
                    label="Category Icon"
                  />
                </div>

                <div className="form-group">
                  <label>Display Order</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) =>
                      setFormData({ ...formData, display_order: parseInt(e.target.value) })
                    }
                  />
                </div>

                <SEOFields
                  pageTitle={formData.page_title}
                  pageDescription={formData.page_description}
                  metaTitle={formData.meta_title}
                  metaDescription={formData.meta_description}
                  pageTitleAr={formData.page_title_ar}
                  pageDescriptionAr={formData.page_description_ar}
                  metaTitleAr={formData.meta_title_ar}
                  metaDescriptionAr={formData.meta_description_ar}
                  ogImage={formData.og_image}
                  onChange={(field, value) => setFormData({ ...formData, [field]: value })}
                  showOgFields={false}
                />

                <div className={styles.modalActions}>
                  <button type="submit" className="btn btn-primary">
                    {editingCategory ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Badge Assignment Modal */}
        {showBadgeModal && selectedCategory && (
          <div className={styles.modal} onClick={() => setShowBadgeModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h2>Manage Badges for Category</h2>
              <p style={{ marginBottom: '20px', color: '#666' }}>
                Category: <strong>{selectedCategory.name}</strong>
              </p>
              <form onSubmit={handleBadgeAssignment}>
                <div className="form-group">
                  <label>Select Badges</label>
                  <div className={styles.badgeList}>
                    {badges.map((badge) => (
                      <label key={badge.id} className={styles.badgeItem}>
                        <input
                          type="checkbox"
                          checked={selectedBadgeIds.includes(badge.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBadgeIds([...selectedBadgeIds, badge.id]);
                            } else {
                              setSelectedBadgeIds(selectedBadgeIds.filter((id) => id !== badge.id));
                            }
                          }}
                        />
                        <div className={styles.badgeInfo}>
                          <span className={styles.badgeName}>{badge.name}</span>
                          <span className={styles.badgeNameAr}>{badge.name_ar}</span>
                          {badge.image_url_en && (
                            <img
                              src={badge.image_url_en}
                              alt={badge.name}
                              className={styles.badgePreview}
                            />
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className={styles.badgeCount}>
                    {selectedBadgeIds.length} {selectedBadgeIds.length === 1 ? 'badge' : 'badges'} selected
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button type="submit" className="btn btn-primary">
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBadgeModal(false)}
                    className="btn btn-secondary"
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
