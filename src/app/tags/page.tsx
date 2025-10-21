'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/presentation/components/AdminLayout/AdminLayout';
import LoadingSpinner from '@/presentation/components/LoadingSpinner/LoadingSpinner';
import Pagination from '@/presentation/components/Pagination/Pagination';
import BulkActionsToolbar from '@/presentation/components/BulkActionsToolbar/BulkActionsToolbar';
import IconPicker from '@/presentation/components/IconPicker/IconPicker';
import { useBulkSelection } from '@/application/hooks/useBulkSelection';
import { tagAdminRepository } from '@/infrastructure/repositories/TagAdminRepository';
import { categoryAdminRepository } from '@/infrastructure/repositories/CategoryAdminRepository';
import { Tag } from '@/domain/entities/Tag';
import { Category } from '@/domain/entities/Category';
import { toastService } from '@/application/services/toastService';
import styles from './tags.module.scss';

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 15;
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    type: 'amenity',
    icon: '',
    display_order: 0,
  });

  // Category assignment state
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [originalCategoryIds, setOriginalCategoryIds] = useState<number[]>([]);

  const bulkSelection = useBulkSelection({
    items: tags,
    getItemId: (tag) => tag.id,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    loadTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearch]);

  useEffect(() => {
    bulkSelection.clearSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tags]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadTags = async () => {
    try {
      setIsLoading(true);
      const params: any = { page: currentPage, limit: itemsPerPage };
      if (debouncedSearch) params.search = debouncedSearch;

      const response = await tagAdminRepository.getAll(params);
      setTags(response.data || []);
      setTotalPages(response.pagination?.total_pages || 1);
      setTotalItems(response.pagination?.total_count || 0);
    } catch (err: any) {
      console.error('Failed to load tags:', err);
      setError('Failed to load tags');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await categoryAdminRepository.getAll();
      setCategories(response.data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const handleManageAssignments = async (tag: Tag) => {
    setSelectedTag(tag);
    setShowAssignModal(true);

    // Fetch current category assignments and pre-select them
    try {
      const response = await tagAdminRepository.getTagCategories(tag.id);
      const categoryIds = response.data || [];
      setSelectedCategoryIds(categoryIds);
      setOriginalCategoryIds(categoryIds);
    } catch (err: any) {
      console.error('Failed to load tag categories:', err);
      // Default to empty if fetch fails
      setSelectedCategoryIds([]);
      setOriginalCategoryIds([]);
    }
  };

  const handleAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTag) return;

    try {
      // Calculate which categories to add and which to remove
      const toAdd = selectedCategoryIds.filter(id => !originalCategoryIds.includes(id));
      const toRemove = originalCategoryIds.filter(id => !selectedCategoryIds.includes(id));

      // Make API calls for assignments and removals
      if (toAdd.length > 0) {
        await tagAdminRepository.batchAssignToCategories(
          selectedTag.id,
          toAdd,
          'assign'
        );
      }

      if (toRemove.length > 0) {
        await tagAdminRepository.batchAssignToCategories(
          selectedTag.id,
          toRemove,
          'remove'
        );
      }

      if (toAdd.length === 0 && toRemove.length === 0) {
        toastService.info('No changes were made');
      } else {
        const messages = [];
        if (toAdd.length > 0) {
          messages.push(`Added to ${toAdd.length} ${toAdd.length === 1 ? 'category' : 'categories'}`);
        }
        if (toRemove.length > 0) {
          messages.push(`Removed from ${toRemove.length} ${toRemove.length === 1 ? 'category' : 'categories'}`);
        }
        toastService.success(messages.join(', '));
      }

      setShowAssignModal(false);
    } catch (err: any) {
      toastService.error(`Failed to update tag assignments: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleCreate = () => {
    setEditingTag(null);
    setFormData({
      name: '',
      name_ar: '',
      type: 'amenity',
      icon: '',
      display_order: 0,
    });
    setShowModal(true);
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      name_ar: tag.name_ar || '',
      type: tag.type || 'amenity',
      icon: tag.icon || '',
      display_order: tag.display_order || 0,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTag) {
        await tagAdminRepository.update(editingTag.id, formData);
        toastService.success('Tag updated successfully!');
      } else {
        await tagAdminRepository.create(formData);
        toastService.success('Tag created successfully!');
      }
      setShowModal(false);
      loadTags();
    } catch (err: any) {
      toastService.error(`Failed to save tag: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDelete = async (tagId: number, tagName: string) => {
    toastService.confirm(
      `Are you sure you want to delete "${tagName}"?`,
      async () => {
        try {
          await tagAdminRepository.delete(tagId);
          toastService.success('Tag deleted successfully!');
          loadTags();
        } catch (err: any) {
          toastService.error(`Failed to delete tag: ${err.response?.data?.message || err.message}`);
        }
      }
    );
  };

  const handleBulkDelete = async () => {
    const count = bulkSelection.selectedCount;
    const tagNames = bulkSelection.selectedItems.map((t) => t.name).join(', ');

    toastService.confirm({
      message: `Are you sure you want to delete ${count} tag${count > 1 ? 's' : ''}? (${tagNames})`,
      onConfirm: async () => {
        try {
          await Promise.all(
            bulkSelection.selectedItems.map((tag) => tagAdminRepository.delete(tag.id))
          );
          toastService.success(`Successfully deleted ${count} tag${count > 1 ? 's' : ''}!`);
          bulkSelection.clearSelection();
          loadTags();
        } catch (err: any) {
          toastService.error(`Failed to delete tags: ${err.response?.data?.message || err.message}`);
        }
      },
    });
  };

  return (
    <AdminLayout>
      <div className={styles.tagsPage}>
        <div className={styles.header}>
          <h1>Tags Management</h1>
          <button onClick={handleCreate} className="btn btn-primary">
            + Create Tag
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        <div className={styles.filters}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {searchQuery && (
            <div className="form-group">
              <button
                onClick={() => setSearchQuery('')}
                className="btn btn-secondary"
              >
                Clear Search
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
          <LoadingSpinner text="Loading tags..." />
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
                  <th>Usage Count</th>
                  <th>Display Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tags.map((tag) => (
                  <tr key={tag.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={bulkSelection.isSelected(tag.id)}
                        onChange={() => bulkSelection.toggleSelection(tag.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td>{tag.id}</td>
                    <td>
                      <strong>{tag.name}</strong>
                      {tag.name_ar && (
                        <div className={styles.nameAr}>{tag.name_ar}</div>
                      )}
                    </td>
                    <td>
                      <code>{tag.slug}</code>
                    </td>
                    <td>
                      <span className="badge badge-info">{tag.usage_count || 0}</span>
                    </td>
                    <td>{tag.display_order || 0}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          onClick={() => handleEdit(tag)}
                          className="btn btn-primary btn-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleManageAssignments(tag)}
                          className="btn btn-secondary btn-sm"
                        >
                          Assign
                        </button>
                        <button
                          onClick={() => handleDelete(tag.id, tag.name)}
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

        {!isLoading && tags.length > 0 && (
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
              <h2>{editingTag ? 'Edit Tag' : 'Create Tag'}</h2>
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

                <div className="form-group">
                  <label>Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                  >
                    <option value="amenity">Amenity (parking, wifi, wheelchair-access)</option>
                    <option value="service">Service (delivery, online-booking, 24-7)</option>
                    <option value="feature">Feature (luxury, family-friendly, pet-friendly)</option>
                    <option value="price-range">Price Range (budget, mid-range, premium)</option>
                  </select>
                </div>

                {editingTag && (
                  <div className="form-group">
                    <label>Slug (auto-generated)</label>
                    <input
                      type="text"
                      value={editingTag.slug}
                      disabled
                      style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
                    />
                    <small style={{ color: '#666', fontSize: '12px' }}>
                      Slug is auto-generated and cannot be changed
                    </small>
                  </div>
                )}

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

                <div className="form-group">
                  <IconPicker
                    value={formData.icon}
                    onChange={(value) => setFormData({ ...formData, icon: value })}
                    label="Tag Icon"
                  />
                </div>

                <div className={styles.modalActions}>
                  <button type="submit" className="btn btn-primary">
                    {editingTag ? 'Update' : 'Create'}
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

        {/* Assignment Modal */}
        {showAssignModal && selectedTag && (
          <div className={styles.modal} onClick={() => setShowAssignModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h2>Manage Categories for Tag</h2>
              <p style={{ marginBottom: '20px', color: '#666' }}>
                Tag: <strong>{selectedTag.name}</strong>
              </p>
              <form onSubmit={handleAssignment}>
                <div className="form-group">
                  <label>Select Categories</label>
                  <div className={styles.categoryList}>
                    {categories.map((category) => (
                      <label key={category.id} className={styles.categoryItem}>
                        <input
                          type="checkbox"
                          checked={selectedCategoryIds.includes(category.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCategoryIds([...selectedCategoryIds, category.id]);
                            } else {
                              setSelectedCategoryIds(selectedCategoryIds.filter((id) => id !== category.id));
                            }
                          }}
                        />
                        <span>{category.name}</span>
                      </label>
                    ))}
                  </div>
                  <div className={styles.categoryCount}>
                    {selectedCategoryIds.length} {selectedCategoryIds.length === 1 ? 'category' : 'categories'} selected
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button type="submit" className="btn btn-primary">
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
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
