'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/presentation/components/AdminLayout/AdminLayout';
import LoadingSpinner from '@/presentation/components/LoadingSpinner/LoadingSpinner';
import Pagination from '@/presentation/components/Pagination/Pagination';
import BulkActionsToolbar from '@/presentation/components/BulkActionsToolbar/BulkActionsToolbar';
import { useBulkSelection } from '@/application/hooks/useBulkSelection';
import { filterAdminRepository } from '@/infrastructure/repositories/FilterAdminRepository';
import { categoryAdminRepository } from '@/infrastructure/repositories/CategoryAdminRepository';
import { Filter, FilterOption } from '@/domain/entities/Filter';
import { Category } from '@/domain/entities/Category';
import { toastService } from '@/application/services/toastService';
import styles from './filters.module.scss';

export default function FiltersPage() {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 15;
  const [searchFilters, setSearchFilters] = useState({
    search: '',
    type: '',
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<Filter | null>(null);
  const [editingFilter, setEditingFilter] = useState<Filter | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    label_ar: '',
    type: 'dropdown' as 'dropdown' | 'checkbox' | 'radio',
    display_order: 0,
  });
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [originalCategoryIds, setOriginalCategoryIds] = useState<number[]>([]);

  // Filter options management state
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [optionsFilter, setOptionsFilter] = useState<Filter | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [showOptionFormModal, setShowOptionFormModal] = useState(false);
  const [editingOption, setEditingOption] = useState<FilterOption | null>(null);
  const [optionFormData, setOptionFormData] = useState({
    label: '',
    label_ar: '',
    value: '',
    is_default: false,
    display_order: 0,
  });

  const bulkSelection = useBulkSelection({
    items: filters,
    getItemId: (filter) => filter.id,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchFilters.search);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchFilters.search]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearch, searchFilters.type]);

  useEffect(() => {
    bulkSelection.clearSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const params: any = { page: currentPage, limit: itemsPerPage };
      if (debouncedSearch) params.search = debouncedSearch;
      if (searchFilters.type) params.type = searchFilters.type;

      const [filtersRes, categoriesRes] = await Promise.all([
        filterAdminRepository.getAll(params),
        categoryAdminRepository.getAll(),
      ]);
      setFilters(filtersRes.data || []);
      setTotalPages(filtersRes.pagination?.total_pages || 1);
      setTotalItems(filtersRes.pagination?.total_count || 0);
      setCategories(categoriesRes.data || []);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError('Failed to load filters');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingFilter(null);
    setFormData({
      label: '',
      label_ar: '',
      type: 'dropdown',
      display_order: 0,
    });
    setShowModal(true);
  };

  const handleEdit = async (filter: Filter) => {
    try {
      const fullFilter = await filterAdminRepository.getBySlug(filter.slug);
      if (!fullFilter.data) {
        toastService.error('Filter not found');
        return;
      }
      setEditingFilter(fullFilter.data);
      setFormData({
        label: fullFilter.data.label,
        label_ar: fullFilter.data.label_ar || '',
        type: fullFilter.data.type,
        display_order: fullFilter.data.display_order,
      });
      setShowModal(true);
    } catch (err: any) {
      toastService.error(`Failed to load filter: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFilter) {
        await filterAdminRepository.update(editingFilter.slug, {
          label: formData.label,
          label_ar: formData.label_ar,
          type: formData.type,
          display_order: formData.display_order,
        });
        toastService.success('Filter updated successfully!');
      } else {
        await filterAdminRepository.create(formData);
        toastService.success('Filter created successfully!');
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      toastService.error(`Failed to save filter: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDelete = async (slug: string, label: string) => {
    toastService.confirm({
      message: `Are you sure you want to delete "${label}"?`,
      onConfirm: async () => {
        try {
          await filterAdminRepository.delete(slug);
          toastService.success('Filter deleted successfully!');
          loadData();
        } catch (err: any) {
          toastService.error(`Failed to delete filter: ${err.response?.data?.message || err.message}`);
        }
      },
    });
  };

  const handleBulkDelete = async () => {
    const count = bulkSelection.selectedCount;
    const filterLabels = bulkSelection.selectedItems.map((f) => f.label).join(', ');

    toastService.confirm({
      message: `Are you sure you want to delete ${count} filter${count > 1 ? 's' : ''}? (${filterLabels})`,
      onConfirm: async () => {
        try {
          await Promise.all(
            bulkSelection.selectedItems.map((filter) => filterAdminRepository.delete(filter.slug))
          );
          toastService.success(`Successfully deleted ${count} filter${count > 1 ? 's' : ''}!`);
          bulkSelection.clearSelection();
          loadData();
        } catch (err: any) {
          toastService.error(`Failed to delete filters: ${err.response?.data?.message || err.message}`);
        }
      },
    });
  };

  const handleManageAssignments = async (filter: Filter) => {
    setSelectedFilter(filter);
    setShowAssignModal(true);

    // Fetch current category assignments and pre-select them
    try {
      const response = await filterAdminRepository.getFilterCategories(filter.id);
      const categoryIds = response.data || [];
      setSelectedCategoryIds(categoryIds);
      setOriginalCategoryIds(categoryIds);
    } catch (err: any) {
      console.error('Failed to load filter categories:', err);
      // Default to empty if fetch fails
      setSelectedCategoryIds([]);
      setOriginalCategoryIds([]);
    }
  };

  const handleAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFilter) return;

    try {
      // Calculate which categories to add and which to remove
      const toAdd = selectedCategoryIds.filter(id => !originalCategoryIds.includes(id));
      const toRemove = originalCategoryIds.filter(id => !selectedCategoryIds.includes(id));

      // Make API calls for assignments and removals
      if (toAdd.length > 0) {
        await filterAdminRepository.batchAssignToCategories(
          selectedFilter.id,
          toAdd,
          'assign'
        );
      }

      if (toRemove.length > 0) {
        await filterAdminRepository.batchAssignToCategories(
          selectedFilter.id,
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
      toastService.error(`Failed to update filter assignments: ${err.response?.data?.message || err.message}`);
    }
  };

  // Filter options handlers
  const handleManageOptions = async (filter: Filter) => {
    setOptionsFilter(filter);
    setShowOptionsModal(true);
    await loadFilterOptions(filter.slug);
  };

  const loadFilterOptions = async (filterSlug: string) => {
    try {
      setIsLoadingOptions(true);
      const response = await filterAdminRepository.getOptions(filterSlug);
      setFilterOptions(response.data || []);
    } catch (err: any) {
      toastService.error(`Failed to load options: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const handleCreateOption = () => {
    setEditingOption(null);
    setOptionFormData({
      label: '',
      label_ar: '',
      value: '',
      is_default: false,
      display_order: 0,
    });
    setShowOptionFormModal(true);
  };

  const handleEditOption = (option: FilterOption) => {
    setEditingOption(option);
    setOptionFormData({
      label: option.label,
      label_ar: option.label_ar || '',
      value: option.value,
      is_default: option.is_default,
      display_order: option.display_order,
    });
    setShowOptionFormModal(true);
  };

  const handleSubmitOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!optionsFilter) return;

    try {
      if (editingOption) {
        await filterAdminRepository.updateOption(
          optionsFilter.slug,
          editingOption.id,
          optionFormData
        );
        toastService.success('Option updated successfully!');
      } else {
        await filterAdminRepository.createOption(optionsFilter.slug, optionFormData);
        toastService.success('Option created successfully!');
      }
      setShowOptionFormModal(false);
      await loadFilterOptions(optionsFilter.slug);
    } catch (err: any) {
      toastService.error(`Failed to save option: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDeleteOption = async (optionId: number, label: string) => {
    if (!optionsFilter) return;

    toastService.confirm({
      message: `Are you sure you want to delete option "${label}"?`,
      onConfirm: async () => {
        try {
          await filterAdminRepository.deleteOption(optionsFilter.slug, optionId);
          toastService.success('Option deleted successfully!');
          await loadFilterOptions(optionsFilter.slug);
        } catch (err: any) {
          toastService.error(`Failed to delete option: ${err.response?.data?.message || err.message}`);
        }
      },
    });
  };

  return (
    <AdminLayout>
      <div className={styles.filtersPage}>
        <div className={styles.header}>
          <h1>Filters Management</h1>
          <button onClick={handleCreate} className="btn btn-primary">
            + Create Filter
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        <div className={styles.filters}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Search filters..."
              value={searchFilters.search}
              onChange={(e) => setSearchFilters({ ...searchFilters, search: e.target.value })}
            />
          </div>

          <div className="form-group">
            <select
              value={searchFilters.type}
              onChange={(e) => setSearchFilters({ ...searchFilters, type: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="dropdown">Dropdown</option>
              <option value="checkbox">Checkbox</option>
              <option value="radio">Radio</option>
            </select>
          </div>

          {(searchFilters.search || searchFilters.type) && (
            <div className="form-group">
              <button
                onClick={() => setSearchFilters({ search: '', type: '' })}
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
          <LoadingSpinner text="Loading filters..." />
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
                  <th>Label</th>
                  <th>Slug</th>
                  <th>Type</th>
                  <th>Display Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filters.map((filter) => (
                  <tr key={filter.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={bulkSelection.isSelected(filter.id)}
                        onChange={() => bulkSelection.toggleSelection(filter.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td>{filter.id}</td>
                    <td>
                      <strong>{filter.label}</strong>
                      {filter.label_ar && (
                        <div className={styles.labelAr}>{filter.label_ar}</div>
                      )}
                    </td>
                    <td>
                      <code>{filter.slug}</code>
                    </td>
                    <td>
                      <span className="badge badge-info">{filter.type}</span>
                    </td>
                    <td>{filter.display_order}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          onClick={() => handleEdit(filter)}
                          className="btn btn-primary btn-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleManageOptions(filter)}
                          className="btn btn-info btn-sm"
                        >
                          Options
                        </button>
                        <button
                          onClick={() => handleManageAssignments(filter)}
                          className="btn btn-warning btn-sm"
                        >
                          Assign
                        </button>
                        <button
                          onClick={() => handleDelete(filter.slug, filter.label)}
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

        {!isLoading && filters.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className={styles.modal} onClick={() => setShowModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h2>{editingFilter ? 'Edit Filter' : 'Create Filter'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Label *</label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Label (Arabic)</label>
                  <input
                    type="text"
                    value={formData.label_ar}
                    onChange={(e) => setFormData({ ...formData, label_ar: e.target.value })}
                  />
                </div>

                {editingFilter && (
                  <div className="form-group">
                    <label>Slug (auto-generated)</label>
                    <input
                      type="text"
                      value={editingFilter.slug}
                      disabled
                      style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
                    />
                    <small style={{ color: '#666', fontSize: '12px' }}>
                      Slug is auto-generated and cannot be changed
                    </small>
                  </div>
                )}

                <div className="form-group">
                  <label>Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as 'dropdown' | 'checkbox' | 'radio',
                      })
                    }
                    required
                  >
                    <option value="dropdown">Dropdown</option>
                    <option value="checkbox">Checkbox</option>
                    <option value="radio">Radio</option>
                  </select>
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

                <div className={styles.modalActions}>
                  <button type="submit" className="btn btn-primary">
                    {editingFilter ? 'Update' : 'Create'}
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
        {showAssignModal && selectedFilter && (
          <div className={styles.modal} onClick={() => setShowAssignModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h2>Manage Categories for Filter</h2>
              <p style={{ marginBottom: '20px', color: '#666' }}>
                Filter: <strong>{selectedFilter.label}</strong>
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

        {/* Filter Options Management Modal */}
        {showOptionsModal && optionsFilter && (
          <div className={styles.modal} onClick={() => setShowOptionsModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
              <h2>Manage Options: {optionsFilter.label}</h2>
              <p style={{ marginBottom: '20px' }}>
                Filter Type: <span className="badge badge-info">{optionsFilter.type}</span>
              </p>

              <button onClick={handleCreateOption} className="btn btn-primary" style={{ marginBottom: '15px' }}>
                + Add Option
              </button>

              {isLoadingOptions ? (
                <LoadingSpinner text="Loading options..." />
              ) : (
                <div className={styles.tableWrapper}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Label</th>
                        <th>Slug</th>
                        <th>Value</th>
                        <th>Default</th>
                        <th>Order</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterOptions.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>
                            No options found. Click "Add Option" to create one.
                          </td>
                        </tr>
                      ) : (
                        filterOptions.map((option) => (
                          <tr key={option.id}>
                            <td>{option.id}</td>
                            <td>
                              <strong>{option.label}</strong>
                              {option.label_ar && (
                                <div className={styles.labelAr}>{option.label_ar}</div>
                              )}
                            </td>
                            <td>
                              <code>{option.slug}</code>
                            </td>
                            <td>{option.value}</td>
                            <td>
                              {option.is_default && <span className="badge badge-success">Yes</span>}
                            </td>
                            <td>{option.display_order}</td>
                            <td>
                              <div className={styles.actions}>
                                <button
                                  onClick={() => handleEditOption(option)}
                                  className="btn btn-primary btn-sm"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteOption(option.id, option.label)}
                                  className="btn btn-danger btn-sm"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <div className={styles.modalActions} style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowOptionsModal(false)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Option Create/Edit Modal */}
        {showOptionFormModal && optionsFilter && (
          <div className={styles.modal} onClick={() => setShowOptionFormModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h2>{editingOption ? 'Edit Option' : 'Create Option'}</h2>
              <form onSubmit={handleSubmitOption}>
                <div className="form-group">
                  <label>Label *</label>
                  <input
                    type="text"
                    value={optionFormData.label}
                    onChange={(e) => setOptionFormData({ ...optionFormData, label: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Label (Arabic)</label>
                  <input
                    type="text"
                    value={optionFormData.label_ar}
                    onChange={(e) => setOptionFormData({ ...optionFormData, label_ar: e.target.value })}
                  />
                </div>

                {editingOption && (
                  <div className="form-group">
                    <label>Slug (auto-generated)</label>
                    <input
                      type="text"
                      value={editingOption.slug}
                      disabled
                      style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
                    />
                    <small style={{ color: '#666', fontSize: '12px' }}>
                      Slug is auto-generated and cannot be changed
                    </small>
                  </div>
                )}

                <div className="form-group">
                  <label>Value *</label>
                  <input
                    type="text"
                    value={optionFormData.value}
                    onChange={(e) => setOptionFormData({ ...optionFormData, value: e.target.value })}
                    required
                  />
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    The actual value used in filtering (e.g., "asc", "desc", "1", "2")
                  </small>
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={optionFormData.is_default}
                      onChange={(e) => setOptionFormData({ ...optionFormData, is_default: e.target.checked })}
                      style={{ marginRight: '8px' }}
                    />
                    Set as Default Option
                  </label>
                </div>

                <div className="form-group">
                  <label>Display Order</label>
                  <input
                    type="number"
                    value={optionFormData.display_order}
                    onChange={(e) =>
                      setOptionFormData({ ...optionFormData, display_order: parseInt(e.target.value) })
                    }
                  />
                </div>

                <div className={styles.modalActions}>
                  <button type="submit" className="btn btn-primary">
                    {editingOption ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOptionFormModal(false)}
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
