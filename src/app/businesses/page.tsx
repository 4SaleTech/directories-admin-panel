'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import AdminLayout from '@/presentation/components/AdminLayout/AdminLayout';
import LoadingSpinner from '@/presentation/components/LoadingSpinner/LoadingSpinner';
import Pagination from '@/presentation/components/Pagination/Pagination';
import BulkActionsToolbar from '@/presentation/components/BulkActionsToolbar/BulkActionsToolbar';
import IconPicker from '@/presentation/components/IconPicker/IconPicker';
import { useBulkSelection } from '@/application/hooks/useBulkSelection';
import { businessAdminRepository } from '@/infrastructure/repositories/BusinessAdminRepository';
import { categoryAdminRepository } from '@/infrastructure/repositories/CategoryAdminRepository';
import { tagAdminRepository } from '@/infrastructure/repositories/TagAdminRepository';
import { Business } from '@/domain/entities/Business';
import { Category } from '@/domain/entities/Category';
import { Tag } from '@/domain/entities/Tag';
import { Filter } from '@/domain/entities/Filter';
import { toastService } from '@/application/services/toastService';
import {
  FiCheck,
  FiX,
  FiStar,
  FiEdit2,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiPause,
  FiPlay,
  FiPlus
} from 'react-icons/fi';
import 'react-quill/dist/quill.snow.css';
import styles from './businesses.module.scss';

// Dynamic import to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    is_verified: '',
    is_featured: '',
    sort: 'newest',
  });
  const [showModal, setShowModal] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [formData, setFormData] = useState({
    user_id: 1,
    category_id: 1,
    slug: '',
    name: '',
    name_ar: '',
    about: '',
    about_ar: '',
    email: '',
    website: '',
    contact_numbers: '',
    address: '',
    address_ar: '',
    logo: '',
    tag_ids: [] as number[],
    filter_values: {} as Record<string, string>,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<Filter[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(false);

  const bulkSelection = useBulkSelection({
    items: businesses,
    getItemId: (business) => business.id,
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.status, filters.search, filters.is_verified, filters.is_featured, filters.sort]);

  useEffect(() => {
    loadBusinesses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filters.status, filters.search, filters.is_verified, filters.is_featured, filters.sort]);

  useEffect(() => {
    bulkSelection.clearSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businesses]);

  useEffect(() => {
    loadCategories();
    loadTags();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoryAdminRepository.getAll();
      setCategories(response.data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadTags = async () => {
    try {
      const response = await tagAdminRepository.getAll();
      setTags(response.data || []);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  const loadCategoryFilters = async (categoryId: number) => {
    try {
      setLoadingFilters(true);
      const response = await categoryAdminRepository.getCategoryFilters(categoryId);
      const filters = response.data || [];
      setCategoryFilters(filters);

      // Initialize default filter values
      const defaultFilterValues: Record<string, string> = {};
      filters.forEach((filter) => {
        const defaultOption = filter.options?.find((opt) => opt.is_default);
        if (defaultOption) {
          defaultFilterValues[filter.slug] = defaultOption.value;
        }
      });

      setFormData((prev) => ({
        ...prev,
        filter_values: { ...defaultFilterValues, ...prev.filter_values }
      }));
    } catch (err) {
      console.error('Failed to load category filters:', err);
      toastService.error('Failed to load filters for this category');
    } finally {
      setLoadingFilters(false);
    }
  };

  const loadBusinesses = async () => {
    try {
      setIsLoading(true);
      const params: any = { page: currentPage, limit: 10 };
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.is_verified) params.is_verified = filters.is_verified === 'true';
      if (filters.is_featured) params.is_featured = filters.is_featured === 'true';
      if (filters.sort) params.sort = filters.sort;

      const response = await businessAdminRepository.getAll(params);
      setBusinesses(response.data || []);
      setTotalPages(response.pagination?.total_pages || 1);
      setTotalItems(response.pagination?.total || 0);
    } catch (err: any) {
      console.error('Failed to load businesses:', err);
      setError('Failed to load businesses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingBusiness(null);
    setFormData({
      user_id: 1,
      category_id: 1,
      slug: '',
      name: '',
      name_ar: '',
      about: '',
      about_ar: '',
      email: '',
      website: '',
      contact_numbers: '',
      address: '',
      address_ar: '',
      logo: '',
      tag_ids: [],
      filter_values: {},
    });
    setCategoryFilters([]);
    setShowModal(true);
    // Load filters for default category (1)
    loadCategoryFilters(1);
  };

  const handleEdit = (business: Business) => {
    setEditingBusiness(business);
    setFormData({
      user_id: business.user_id,
      category_id: business.category_id,
      slug: business.slug,
      name: business.name,
      name_ar: business.name_ar || '',
      about: business.about || '',
      about_ar: business.about_ar || '',
      email: business.email || '',
      website: business.website || '',
      contact_numbers: business.contact_numbers || '',
      address: business.address || '',
      address_ar: business.address_ar || '',
      logo: business.logo || '',
      tag_ids: business.tags?.map(tag => tag.id) || [],
      filter_values: business.attributes || {},
    });
    setShowModal(true);
    // Load filters for this business's category
    loadCategoryFilters(business.category_id);
  };

  // Helper function to clean form data before submission
  const cleanFormData = (data: any) => {
    const cleaned: any = { ...data };

    // Helper to check if string is empty or just HTML whitespace from ReactQuill
    const isEmptyString = (value: string) => {
      if (!value) return true;
      // Remove HTML tags and check if there's any actual content
      const textOnly = value.replace(/<[^>]*>/g, '').trim();
      return textOnly === '';
    };

    // Remove empty optional fields to avoid validation errors
    Object.keys(cleaned).forEach(key => {
      const value = cleaned[key];
      if (typeof value === 'string' && isEmptyString(value)) {
        delete cleaned[key];
      }
    });

    // Ensure required fields are present
    if (!cleaned.user_id) cleaned.user_id = 1;
    if (!cleaned.category_id) cleaned.category_id = 1;
    if (!cleaned.name) cleaned.name = '';
    if (!cleaned.slug && !editingBusiness) cleaned.slug = '';

    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleanedData = cleanFormData(formData);

      if (editingBusiness) {
        await businessAdminRepository.update(editingBusiness.id, cleanedData);
        toastService.success('Business updated successfully!');
      } else {
        await businessAdminRepository.create(cleanedData);
        toastService.success('Business created successfully!');
        // Reset to page 1 and sort by newest to show the new business
        setCurrentPage(1);
        setFilters(prev => ({ ...prev, sort: 'newest', status: '' }));
      }
      setShowModal(false);
      loadBusinesses();
    } catch (err: any) {
      toastService.error(`Failed to save business: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleAction = async (action: string, businessId: number, businessName: string) => {
    toastService.confirm(
      `Are you sure you want to ${action} "${businessName}"?`,
      async () => {
        try {
          switch (action) {
            case 'verify':
              await businessAdminRepository.verify(businessId);
              break;
            case 'unverify':
              await businessAdminRepository.unverify(businessId);
              break;
            case 'feature':
              await businessAdminRepository.feature(businessId);
              break;
            case 'unfeature':
              await businessAdminRepository.unfeature(businessId);
              break;
            case 'suspend':
              await businessAdminRepository.suspend(businessId);
              break;
            case 'unsuspend':
              await businessAdminRepository.unsuspend(businessId);
              break;
            case 'activate':
              await businessAdminRepository.activate(businessId);
              break;
            case 'deactivate':
              await businessAdminRepository.deactivate(businessId);
              break;
            case 'delete':
              await businessAdminRepository.delete(businessId);
              break;
          }
          toastService.success(`Business ${action}d successfully!`);
          loadBusinesses();
        } catch (err: any) {
          toastService.error(`Failed to ${action} business: ${err.response?.data?.message || err.message}`);
        }
      }
    );
  };

  const handleBulkDelete = async () => {
    const count = bulkSelection.selectedCount;
    const businessNames = bulkSelection.selectedItems.map((b) => b.name).join(', ');

    toastService.confirm(
      `Are you sure you want to delete ${count} business${count > 1 ? 'es' : ''}? (${businessNames})`,
      async () => {
        try {
          await Promise.all(
            bulkSelection.selectedItems.map((business) => businessAdminRepository.delete(business.id))
          );
          toastService.success(`Successfully deleted ${count} business${count > 1 ? 'es' : ''}!`);
          bulkSelection.clearSelection();
          loadBusinesses();
        } catch (err: any) {
          toastService.error(`Failed to delete businesses: ${err.response?.data?.message || err.message}`);
        }
      }
    );
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      active: 'badge-success',
      pending: 'badge-warning',
      inactive: 'badge-secondary',
      suspended: 'badge-danger',
    };
    return badges[status] || 'badge-secondary';
  };

  return (
    <AdminLayout>
      <div className={styles.businessesPage}>
        <div className={styles.header}>
          <h1>Businesses Management</h1>
          <button onClick={handleCreate} className="btn btn-primary">
            <FiPlus /> Create Business
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        <div className={styles.filters}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Search businesses..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          <div className="form-group">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="form-group">
            <select
              value={filters.is_verified}
              onChange={(e) => setFilters({ ...filters, is_verified: e.target.value })}
            >
              <option value="">All Verification</option>
              <option value="true">Verified</option>
              <option value="false">Not Verified</option>
            </select>
          </div>

          <div className="form-group">
            <select
              value={filters.is_featured}
              onChange={(e) => setFilters({ ...filters, is_featured: e.target.value })}
            >
              <option value="">All Featured</option>
              <option value="true">Featured</option>
              <option value="false">Not Featured</option>
            </select>
          </div>

          <div className="form-group">
            <select
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            >
              <option value="newest">Newest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="rating">Highest Rated</option>
              <option value="views">Most Popular</option>
            </select>
          </div>
        </div>

        <BulkActionsToolbar
          selectedCount={bulkSelection.selectedCount}
          onClearSelection={bulkSelection.clearSelection}
          actions={[
            {
              label: 'Delete Selected',
              onClick: handleBulkDelete,
              variant: 'danger',
            },
          ]}
        />

        {isLoading ? (
          <LoadingSpinner text="Loading businesses..." />
        ) : (
          <>
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
                    <th>Category ID</th>
                    <th>Status</th>
                    <th>Verified</th>
                    <th>Featured</th>
                    <th>Rating</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {businesses.map((business) => (
                    <tr key={business.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={bulkSelection.isSelected(business.id)}
                          onChange={() => bulkSelection.toggleSelection(business.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td>{business.id}</td>
                      <td>
                        <strong>{business.name}</strong>
                        {business.name_ar && (
                          <div className={styles.nameAr}>{business.name_ar}</div>
                        )}
                      </td>
                      <td>{business.category_id}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(business.status)}`}>
                          {business.status}
                        </span>
                      </td>
                      <td>
                        {business.is_verified ? (
                          <span className="badge badge-success"><FiCheck /> Yes</span>
                        ) : (
                          <span className="badge badge-secondary"><FiX /> No</span>
                        )}
                      </td>
                      <td>
                        {business.is_featured ? (
                          <span className="badge badge-warning"><FiStar /> Yes</span>
                        ) : (
                          <span className="badge badge-secondary"><FiX /> No</span>
                        )}
                      </td>
                      <td>{business.rating ? business.rating.toFixed(1) : 'N/A'}</td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            onClick={() => handleEdit(business)}
                            className="btn btn-primary btn-sm"
                          >
                            <FiEdit2 /> Edit
                          </button>
                          {!business.is_verified && (
                            <button
                              onClick={() => handleAction('verify', business.id, business.name)}
                              className="btn btn-success btn-sm"
                            >
                              Verify
                            </button>
                          )}
                          {business.is_verified && (
                            <button
                              onClick={() => handleAction('unverify', business.id, business.name)}
                              className="btn btn-secondary btn-sm"
                            >
                              Unverify
                            </button>
                          )}
                          {business.status === 'pending' && (
                            <button
                              onClick={() => handleAction('activate', business.id, business.name)}
                              className="btn btn-success btn-sm"
                            >
                              <FiPlay /> Activate
                            </button>
                          )}
                          {!business.is_featured && business.status === 'active' && (
                            <button
                              onClick={() => handleAction('feature', business.id, business.name)}
                              className="btn btn-warning btn-sm"
                            >
                              Feature
                            </button>
                          )}
                          {business.is_featured && (
                            <button
                              onClick={() => handleAction('unfeature', business.id, business.name)}
                              className="btn btn-secondary btn-sm"
                            >
                              Unfeature
                            </button>
                          )}
                          {business.status === 'active' && (
                            <>
                              <button
                                onClick={() => handleAction('suspend', business.id, business.name)}
                                className="btn btn-danger btn-sm"
                              >
                                Suspend
                              </button>
                              <button
                                onClick={() => handleAction('deactivate', business.id, business.name)}
                                className="btn btn-secondary btn-sm"
                              >
                                Deactivate
                              </button>
                            </>
                          )}
                          {business.status === 'suspended' && (
                            <button
                              onClick={() => handleAction('unsuspend', business.id, business.name)}
                              className="btn btn-success btn-sm"
                            >
                              Unsuspend
                            </button>
                          )}
                          {business.status === 'inactive' && (
                            <button
                              onClick={() => handleAction('activate', business.id, business.name)}
                              className="btn btn-success btn-sm"
                            >
                              Activate
                            </button>
                          )}
                          <button
                            onClick={() => handleAction('delete', business.id, business.name)}
                            className="btn btn-danger btn-sm"
                          >
                            <FiTrash2 /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </>
        )}

        {showModal && (
          <div className={styles.modal} onClick={() => setShowModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h2>{editingBusiness ? 'Edit Business' : 'Create Business'}</h2>
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

                {editingBusiness && (
                  <div className="form-group">
                    <label>Slug (auto-generated)</label>
                    <input
                      type="text"
                      value={editingBusiness.slug}
                      disabled
                      style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
                    />
                    <small style={{ color: '#666', fontSize: '12px' }}>
                      Slug is auto-generated and cannot be changed
                    </small>
                  </div>
                )}

                <div className="form-group">
                  <IconPicker
                    value={formData.logo}
                    onChange={(value) => setFormData({ ...formData, logo: value })}
                    label="Business Logo"
                  />
                </div>

                <div className="form-group">
                  <label>User ID</label>
                  <input
                    type="number"
                    value={formData.user_id}
                    onChange={(e) => setFormData({ ...formData, user_id: parseInt(e.target.value) || 1 })}
                    placeholder="Default: 1"
                  />
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    Optional - defaults to user ID 1
                  </small>
                </div>

                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => {
                      const newCategoryId = parseInt(e.target.value);
                      setFormData({ ...formData, category_id: newCategoryId });
                      if (newCategoryId) {
                        loadCategoryFilters(newCategoryId);
                      }
                    }}
                    required
                  >
                    <option value="">Select a category...</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name} {category.name_ar && `(${category.name_ar})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Tags</label>
                  <div className={styles.tagList}>
                    {tags.map((tag) => (
                      <label key={tag.id} className={styles.tagItem}>
                        <input
                          type="checkbox"
                          checked={formData.tag_ids.includes(tag.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, tag_ids: [...formData.tag_ids, tag.id] });
                            } else {
                              setFormData({ ...formData, tag_ids: formData.tag_ids.filter((id) => id !== tag.id) });
                            }
                          }}
                        />
                        <span>{tag.name}</span>
                        {tag.name_ar && <span className={styles.tagNameAr}>({tag.name_ar})</span>}
                      </label>
                    ))}
                  </div>
                  <div className={styles.tagCount}>
                    {formData.tag_ids.length} {formData.tag_ids.length === 1 ? 'tag' : 'tags'} selected
                  </div>
                </div>

                {categoryFilters.length > 0 && (
                  <div className="form-group">
                    <label>Filters</label>
                    {loadingFilters ? (
                      <p style={{ color: '#666', fontSize: '14px' }}>Loading filters...</p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                        {categoryFilters.map((filter) => (
                          <div key={filter.slug}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                              {filter.label}
                            </label>
                            <select
                              value={formData.filter_values[filter.slug] || ''}
                              onChange={(e) => setFormData({
                                ...formData,
                                filter_values: {
                                  ...formData.filter_values,
                                  [filter.slug]: e.target.value
                                }
                              })}
                              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            >
                              {filter.options?.map((option) => (
                                <option key={option.id} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label>About</label>
                  <ReactQuill
                    value={formData.about}
                    onChange={(content) => setFormData(prev => ({ ...prev, about: content }))}
                    modules={{
                      toolbar: [
                        ['bold', 'italic', 'underline'],
                        ['link'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        ['clean']
                      ],
                    }}
                    placeholder="Describe the business..."
                    theme="snow"
                  />
                </div>

                <div className="form-group">
                  <label>About (Arabic)</label>
                  <ReactQuill
                    value={formData.about_ar}
                    onChange={(content) => setFormData(prev => ({ ...prev, about_ar: content }))}
                    modules={{
                      toolbar: [
                        ['bold', 'italic', 'underline'],
                        ['link'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        ['clean']
                      ],
                    }}
                    placeholder="وصف العمل..."
                    theme="snow"
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Contact Numbers</label>
                  <input
                    type="text"
                    value={formData.contact_numbers}
                    onChange={(e) => setFormData({ ...formData, contact_numbers: e.target.value })}
                    placeholder="e.g., +965 1234 5678, +965 8765 4321"
                  />
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Address (Arabic)</label>
                  <input
                    type="text"
                    value={formData.address_ar}
                    onChange={(e) => setFormData({ ...formData, address_ar: e.target.value })}
                  />
                </div>

                <div className={styles.modalActions}>
                  <button type="submit" className="btn btn-primary">
                    {editingBusiness ? 'Update' : 'Create'}
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
      </div>
    </AdminLayout>
  );
}
