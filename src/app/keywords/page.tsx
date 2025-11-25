'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/presentation/components/AdminLayout/AdminLayout';
import LoadingSpinner from '@/presentation/components/LoadingSpinner/LoadingSpinner';
import Pagination from '@/presentation/components/Pagination/Pagination';
import BulkActionsToolbar from '@/presentation/components/BulkActionsToolbar/BulkActionsToolbar';
import { useBulkSelection } from '@/application/hooks/useBulkSelection';
import { searchKeywordAdminRepository } from '@/infrastructure/repositories/SearchKeywordAdminRepository';
import { categoryAdminRepository } from '@/infrastructure/repositories/CategoryAdminRepository';
import { SearchKeyword } from '@/domain/entities/SearchKeyword';
import { Category } from '@/domain/entities/Category';
import { toastService } from '@/application/services/toastService';
import styles from './keywords.module.scss';

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<SearchKeyword[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 15;
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<SearchKeyword | null>(null);
  const [formData, setFormData] = useState({
    keyword: '',
    keyword_ar: '',
    description: '',
    description_ar: '',
  });

  // Category assignment state
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<SearchKeyword | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [originalCategoryIds, setOriginalCategoryIds] = useState<number[]>([]);

  const bulkSelection = useBulkSelection({
    items: keywords,
    getItemId: (keyword) => keyword.id,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    loadKeywords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearch]);

  useEffect(() => {
    bulkSelection.clearSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keywords]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadKeywords = async () => {
    try {
      setIsLoading(true);
      const params: any = { page: currentPage, limit: itemsPerPage };
      if (debouncedSearch) params.search = debouncedSearch;

      const response = await searchKeywordAdminRepository.getAll(params);
      setKeywords(response.data || []);
      setTotalPages(response.pagination?.total_pages || 1);
      setTotalItems(response.pagination?.total_count || 0);
    } catch (err: any) {
      console.error('Failed to load keywords:', err);
      setError('Failed to load keywords');
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

  const handleManageAssignments = async (keyword: SearchKeyword) => {
    setSelectedKeyword(keyword);
    setShowAssignModal(true);

    // Fetch current category assignments and pre-select them
    try {
      const response = await searchKeywordAdminRepository.getKeywordCategories(keyword.id);
      const categoryIds = (response.data || []).map((cat: Category) => cat.id);
      setSelectedCategoryIds(categoryIds);
      setOriginalCategoryIds(categoryIds);
    } catch (err: any) {
      console.error('Failed to load keyword categories:', err);
      setSelectedCategoryIds([]);
      setOriginalCategoryIds([]);
    }
  };

  const handleAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKeyword) return;

    try {
      // Calculate which categories to add and which to remove
      const toAdd = selectedCategoryIds.filter(id => !originalCategoryIds.includes(id));
      const toRemove = originalCategoryIds.filter(id => !selectedCategoryIds.includes(id));

      // Make API calls for assignments and removals
      for (const categoryId of toAdd) {
        await searchKeywordAdminRepository.assignToCategory(selectedKeyword.id, categoryId, 0);
      }

      for (const categoryId of toRemove) {
        await searchKeywordAdminRepository.removeFromCategory(selectedKeyword.id, categoryId);
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
      toastService.error(`Failed to update keyword assignments: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleCreate = () => {
    setEditingKeyword(null);
    setFormData({
      keyword: '',
      keyword_ar: '',
      description: '',
      description_ar: '',
    });
    setShowModal(true);
  };

  const handleEdit = (keyword: SearchKeyword) => {
    setEditingKeyword(keyword);
    setFormData({
      keyword: keyword.keyword,
      keyword_ar: keyword.keyword_ar || '',
      description: keyword.description || '',
      description_ar: keyword.description_ar || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingKeyword) {
        await searchKeywordAdminRepository.update(editingKeyword.id, formData);
        toastService.success('Keyword updated successfully!');
      } else {
        await searchKeywordAdminRepository.create(formData);
        toastService.success('Keyword created successfully!');
      }
      setShowModal(false);
      loadKeywords();
    } catch (err: any) {
      toastService.error(`Failed to save keyword: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDelete = async (keywordId: number, keyword: string) => {
    toastService.confirm(
      `Are you sure you want to delete "${keyword}"?`,
      async () => {
        try {
          await searchKeywordAdminRepository.delete(keywordId);
          toastService.success('Keyword deleted successfully!');
          loadKeywords();
        } catch (err: any) {
          toastService.error(`Failed to delete keyword: ${err.response?.data?.message || err.message}`);
        }
      }
    );
  };

  const handleBulkDelete = async () => {
    const count = bulkSelection.selectedCount;
    const keywordNames = bulkSelection.selectedItems.map((k) => k.keyword).join(', ');

    toastService.confirm({
      message: `Are you sure you want to delete ${count} keyword${count > 1 ? 's' : ''}? (${keywordNames})`,
      onConfirm: async () => {
        try {
          await Promise.all(
            bulkSelection.selectedItems.map((keyword) => searchKeywordAdminRepository.delete(keyword.id))
          );
          toastService.success(`Successfully deleted ${count} keyword${count > 1 ? 's' : ''}!`);
          bulkSelection.clearSelection();
          loadKeywords();
        } catch (err: any) {
          toastService.error(`Failed to delete keywords: ${err.response?.data?.message || err.message}`);
        }
      },
    });
  };

  const handleToggleActive = async (keyword: SearchKeyword) => {
    try {
      await searchKeywordAdminRepository.update(keyword.id, {
        is_active: !keyword.is_active,
      });
      toastService.success(`Keyword ${!keyword.is_active ? 'activated' : 'deactivated'} successfully!`);
      loadKeywords();
    } catch (err: any) {
      toastService.error(`Failed to update keyword: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <AdminLayout>
      <div className={styles.keywordsPage}>
        <div className={styles.header}>
          <h1>Search Keywords Management</h1>
          <button onClick={handleCreate} className="btn btn-primary">
            + Create Keyword
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        <div className={styles.filters}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Search keywords..."
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
          <LoadingSpinner text="Loading keywords..." />
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
                  <th>Keyword</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {keywords.map((keyword) => (
                  <tr key={keyword.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={bulkSelection.isSelected(keyword.id)}
                        onChange={() => bulkSelection.toggleSelection(keyword.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td>{keyword.id}</td>
                    <td>
                      <strong>{keyword.keyword}</strong>
                      {keyword.keyword_ar && (
                        <div className={styles.keywordAr}>{keyword.keyword_ar}</div>
                      )}
                    </td>
                    <td>
                      <div className={styles.description}>
                        {keyword.description || '-'}
                        {keyword.description_ar && (
                          <div className={styles.descriptionAr}>{keyword.description_ar}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${keyword.is_active ? 'badge-success' : 'badge-secondary'}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleToggleActive(keyword)}
                        title="Click to toggle"
                      >
                        {keyword.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          onClick={() => handleEdit(keyword)}
                          className="btn btn-primary btn-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleManageAssignments(keyword)}
                          className="btn btn-secondary btn-sm"
                        >
                          Assign
                        </button>
                        <button
                          onClick={() => handleDelete(keyword.id, keyword.keyword)}
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

        {!isLoading && keywords.length > 0 && (
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
              <h2>{editingKeyword ? 'Edit Keyword' : 'Create Keyword'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Keyword (English) *</label>
                  <input
                    type="text"
                    value={formData.keyword}
                    onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                    required
                    placeholder="e.g., restaurant, cafe, hotel"
                  />
                </div>

                <div className="form-group">
                  <label>Keyword (Arabic)</label>
                  <input
                    type="text"
                    value={formData.keyword_ar}
                    onChange={(e) => setFormData({ ...formData, keyword_ar: e.target.value })}
                    placeholder="e.g., مطعم, مقهى, فندق"
                  />
                </div>

                <div className="form-group">
                  <label>Description (English)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="Brief description of this keyword"
                  />
                </div>

                <div className="form-group">
                  <label>Description (Arabic)</label>
                  <textarea
                    value={formData.description_ar}
                    onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                    rows={3}
                    placeholder="وصف مختصر لهذه الكلمة المفتاحية"
                  />
                </div>

                <div className={styles.modalActions}>
                  <button type="submit" className="btn btn-primary">
                    {editingKeyword ? 'Update' : 'Create'}
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
        {showAssignModal && selectedKeyword && (
          <div className={styles.modal} onClick={() => setShowAssignModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h2>Manage Categories for Keyword</h2>
              <p style={{ marginBottom: '20px', color: '#666' }}>
                Keyword: <strong>{selectedKeyword.keyword}</strong>
                {selectedKeyword.keyword_ar && ` (${selectedKeyword.keyword_ar})`}
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
                        <span>
                          {category.icon} {category.name}
                          {category.name_ar && ` (${category.name_ar})`}
                        </span>
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
