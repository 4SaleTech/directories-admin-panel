'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/presentation/components/AdminLayout/AdminLayout';
import LoadingSpinner from '@/presentation/components/LoadingSpinner/LoadingSpinner';
import Pagination from '@/presentation/components/Pagination/Pagination';
import BulkActionsToolbar from '@/presentation/components/BulkActionsToolbar/BulkActionsToolbar';
import { useBulkSelection } from '@/application/hooks/useBulkSelection';
import { sectionAdminRepository } from '@/infrastructure/repositories/SectionAdminRepository';
import { categoryAdminRepository } from '@/infrastructure/repositories/CategoryAdminRepository';
import { tagAdminRepository } from '@/infrastructure/repositories/TagAdminRepository';
import { filterAdminRepository } from '@/infrastructure/repositories/FilterAdminRepository';
import { badgeAdminRepository } from '@/infrastructure/repositories/BadgeAdminRepository';
import { Section } from '@/domain/entities/Section';
import { Category } from '@/domain/entities/Category';
import { Tag } from '@/domain/entities/Tag';
import { Filter } from '@/domain/entities/Filter';
import { Badge } from '@/domain/entities/Badge';
import { toastService } from '@/application/services/toastService';
import styles from './sections.module.scss';

export default function SectionsPage() {
  const [sections, setSections] = useState<Section[]>([]);
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
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    title_ar: '',
    cta_title: '',
    cta_title_ar: '',
    background_color: '',
    background_color_dark: '',
    business_limit: 10,
    display_order: 0,
    category_id: undefined as number | undefined,
    tag_slugs: [] as string[],
    filter_criteria: {} as Record<string, string>,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [availableFilters, setAvailableFilters] = useState<Filter[]>([]);
  const [selectedFilterOptions, setSelectedFilterOptions] = useState<Record<number, number>>({});

  // Badge assignment state
  const [badges, setBadges] = useState<Badge[]>([]);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [selectedBadgeIds, setSelectedBadgeIds] = useState<number[]>([]);
  const [originalBadgeIds, setOriginalBadgeIds] = useState<number[]>([]);

  const bulkSelection = useBulkSelection({
    items: sections,
    getItemId: (section) => section.id,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    loadSections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearch, filters.is_active]);

  useEffect(() => {
    bulkSelection.clearSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]);

  useEffect(() => {
    loadCategories();
    loadTags();
    loadFilters();
    loadBadges();
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

  const loadFilters = async () => {
    try {
      const response = await filterAdminRepository.getAll();
      setAvailableFilters(response.data || []);
    } catch (err) {
      console.error('Failed to load filters:', err);
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

  const handleManageBadges = async (section: Section) => {
    setSelectedSection(section);
    setShowBadgeModal(true);

    // Fetch current badge assignments
    try {
      const response = await badgeAdminRepository.getSectionBadges(section.id);
      const badgeIds = response.data?.map((b) => b.id) || [];
      setSelectedBadgeIds(badgeIds);
      setOriginalBadgeIds(badgeIds);
    } catch (err: any) {
      console.error('Failed to load section badges:', err);
      setSelectedBadgeIds([]);
      setOriginalBadgeIds([]);
    }
  };

  const handleBadgeAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSection) return;

    try {
      await badgeAdminRepository.assignBadgesToSection(
        selectedSection.id,
        selectedBadgeIds
      );
      toastService.success('Section badges updated successfully!');
      setShowBadgeModal(false);
    } catch (err: any) {
      toastService.error(`Failed to update badges: ${err.response?.data?.message || err.message}`);
    }
  };

  const loadSections = async () => {
    try {
      setIsLoading(true);
      const params: any = { page: currentPage, limit: itemsPerPage };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.is_active) params.is_active = filters.is_active === 'true';

      const response = await sectionAdminRepository.getAll(params);
      setSections(response.data || []);
      setTotalPages(response.pagination?.total_pages || 1);
      setTotalItems(response.pagination?.total_count || 0);
    } catch (err: any) {
      console.error('Failed to load sections:', err);
      setError('Failed to load sections');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSection(null);
    setFormData({
      title: '',
      title_ar: '',
      cta_title: '',
      cta_title_ar: '',
      background_color: '',
      background_color_dark: '',
      business_limit: 10,
      display_order: 0,
      category_id: undefined,
      tag_slugs: [],
      filter_criteria: {},
    });
    setSelectedFilterOptions({});
    setShowModal(true);
  };

  const handleEdit = (section: Section) => {
    setEditingSection(section);
    setFormData({
      title: section.title,
      title_ar: section.title_ar || '',
      cta_title: section.cta_title || '',
      cta_title_ar: section.cta_title_ar || '',
      background_color: section.background_color || '',
      background_color_dark: section.background_color_dark || '',
      business_limit: section.business_limit,
      display_order: section.display_order,
      category_id: section.category_id,
      tag_slugs: section.tag_slugs || [],
      filter_criteria: section.filter_criteria || {},
    });
    // Parse filter criteria to populate selectedFilterOptions
    const filterOptions: Record<number, number> = {};
    if (section.filter_criteria) {
      Object.entries(section.filter_criteria).forEach(([filterSlug, optionSlug]) => {
        const filter = availableFilters.find(f => f.slug === filterSlug);
        if (filter) {
          const option = filter.options?.find(o => o.slug === optionSlug);
          if (option) {
            filterOptions[filter.id] = option.id;
          }
        }
      });
    }
    setSelectedFilterOptions(filterOptions);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Build filter_criteria from selectedFilterOptions
      const filter_criteria: Record<string, string> = {};
      Object.entries(selectedFilterOptions).forEach(([filterIdStr, optionId]) => {
        const filterId = parseInt(filterIdStr);
        const filter = availableFilters.find(f => f.id === filterId);
        if (filter) {
          const option = filter.options?.find(o => o.id === optionId);
          if (option) {
            filter_criteria[filter.slug] = option.slug;
          }
        }
      });

      const payload = {
        title: formData.title,
        title_ar: formData.title_ar || undefined,
        cta_title: formData.cta_title || undefined,
        cta_title_ar: formData.cta_title_ar || undefined,
        background_color: formData.background_color || undefined,
        background_color_dark: formData.background_color_dark || undefined,
        business_limit: formData.business_limit,
        display_order: formData.display_order,
        category_id: formData.category_id || undefined,
        tag_slugs: formData.tag_slugs.length > 0 ? formData.tag_slugs : undefined,
        filter_criteria: Object.keys(filter_criteria).length > 0 ? filter_criteria : undefined,
      };

      if (editingSection) {
        await sectionAdminRepository.update(editingSection.id, payload);
        toastService.success('Section updated successfully!');
      } else {
        await sectionAdminRepository.create(payload);
        toastService.success('Section created successfully!');
      }
      setShowModal(false);
      loadSections();
    } catch (err: any) {
      toastService.error(`Failed to save section: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleAction = async (action: string, sectionId: number, sectionTitle: string) => {
    if (action === 'delete') {
      toastService.confirm(
        `Are you sure you want to delete "${sectionTitle}"?`,
        async () => {
          try {
            await sectionAdminRepository.delete(sectionId);
            toastService.success('Section deleted successfully!');
            loadSections();
          } catch (err: any) {
            toastService.error(`Failed to delete section: ${err.response?.data?.message || err.message}`);
          }
        }
      );
      return;
    }

    try {
      switch (action) {
        case 'activate':
          await sectionAdminRepository.activate(sectionId);
          toastService.success('Section activated successfully!');
          break;
        case 'deactivate':
          await sectionAdminRepository.deactivate(sectionId);
          toastService.success('Section deactivated successfully!');
          break;
      }
      loadSections();
    } catch (err: any) {
      toastService.error(`Failed to ${action} section: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleBulkDelete = async () => {
    const count = bulkSelection.selectedCount;
    const sectionTitles = bulkSelection.selectedItems.map((s) => s.title).join(', ');

    toastService.confirm({
      message: `Are you sure you want to delete ${count} section${count > 1 ? 's' : ''}? (${sectionTitles})`,
      onConfirm: async () => {
        try {
          await Promise.all(
            bulkSelection.selectedItems.map((section) => sectionAdminRepository.delete(section.id))
          );
          toastService.success(`Successfully deleted ${count} section${count > 1 ? 's' : ''}!`);
          bulkSelection.clearSelection();
          loadSections();
        } catch (err: any) {
          toastService.error(`Failed to delete sections: ${err.response?.data?.message || err.message}`);
        }
      },
    });
  };

  return (
    <AdminLayout>
      <div className={styles.sectionsPage}>
        <div className={styles.header}>
          <h1>Sections Management</h1>
          <button onClick={handleCreate} className="btn btn-primary">
            + Create Section
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        <div className={styles.filters}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Search sections..."
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
          <LoadingSpinner text="Loading sections..." />
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
                  <th>Title</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th>Business Limit</th>
                  <th>Display Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((section) => (
                  <tr key={section.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={bulkSelection.isSelected(section.id)}
                        onChange={() => bulkSelection.toggleSelection(section.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td>{section.id}</td>
                    <td>
                      <strong>{section.title}</strong>
                      {section.title_ar && (
                        <div className={styles.titleAr}>{section.title_ar}</div>
                      )}
                    </td>
                    <td>
                      <code>{section.slug}</code>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          section.is_active ? 'badge-success' : 'badge-secondary'
                        }`}
                      >
                        {section.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{section.business_limit}</td>
                    <td>{section.display_order}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          onClick={() => handleEdit(section)}
                          className="btn btn-primary btn-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleManageBadges(section)}
                          className="btn btn-info btn-sm"
                        >
                          Badges
                        </button>
                        {section.is_active ? (
                          <button
                            onClick={() =>
                              handleAction('deactivate', section.id, section.title)
                            }
                            className="btn btn-secondary btn-sm"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAction('activate', section.id, section.title)}
                            className="btn btn-success btn-sm"
                          >
                            Activate
                          </button>
                        )}
                        <button
                          onClick={() => handleAction('delete', section.id, section.title)}
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

        {!isLoading && sections.length > 0 && (
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
              <h2>{editingSection ? 'Edit Section' : 'Create Section'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Title (Arabic)</label>
                  <input
                    type="text"
                    value={formData.title_ar}
                    onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>CTA Title (optional)</label>
                  <input
                    type="text"
                    value={formData.cta_title}
                    onChange={(e) => setFormData({ ...formData, cta_title: e.target.value })}
                    placeholder="e.g., View All, See More"
                  />
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    Call-to-action button text (English)
                  </small>
                </div>

                <div className="form-group">
                  <label>CTA Title (Arabic)</label>
                  <input
                    type="text"
                    value={formData.cta_title_ar}
                    onChange={(e) => setFormData({ ...formData, cta_title_ar: e.target.value })}
                    placeholder="e.g., عرض الكل"
                  />
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    Call-to-action button text (Arabic)
                  </small>
                </div>

                <div className="form-group">
                  <label>Background Color - Light Mode (optional)</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={formData.background_color || '#ffffff'}
                      onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                      style={{ width: '60px', height: '40px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                    <input
                      type="text"
                      value={formData.background_color}
                      onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                      placeholder="#ffffff"
                      style={{ flex: 1 }}
                    />
                  </div>
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    Section background color for light mode (hex code)
                  </small>
                </div>

                <div className="form-group">
                  <label>Background Color - Dark Mode (optional)</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={formData.background_color_dark || '#000000'}
                      onChange={(e) => setFormData({ ...formData, background_color_dark: e.target.value })}
                      style={{ width: '60px', height: '40px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                    <input
                      type="text"
                      value={formData.background_color_dark}
                      onChange={(e) => setFormData({ ...formData, background_color_dark: e.target.value })}
                      placeholder="#000000"
                      style={{ flex: 1 }}
                    />
                  </div>
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    Section background color for dark mode (hex code) - Falls back to light mode color if empty
                  </small>
                </div>

                {editingSection && (
                  <div className="form-group">
                    <label>Slug (auto-generated)</label>
                    <input
                      type="text"
                      value={editingSection.slug}
                      disabled
                      style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
                    />
                    <small style={{ color: '#666', fontSize: '12px' }}>
                      Slug is auto-generated and cannot be changed
                    </small>
                  </div>
                )}

                <div className="form-group">
                  <label>Business Limit *</label>
                  <input
                    type="number"
                    value={formData.business_limit}
                    onChange={(e) =>
                      setFormData({ ...formData, business_limit: parseInt(e.target.value) })
                    }
                    required
                    min="1"
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

                <div className="form-group">
                  <label>Category (optional)</label>
                  <select
                    value={formData.category_id || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, category_id: e.target.value ? parseInt(e.target.value) : undefined })
                    }
                  >
                    <option value="">No category filter</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name} {category.name_ar && `(${category.name_ar})`}
                      </option>
                    ))}
                  </select>
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    Only show businesses from this category
                  </small>
                </div>

                <div className="form-group">
                  <label>Tags (optional)</label>
                  <div className={styles.tagList}>
                    {tags.map((tag) => (
                      <label key={tag.id} className={styles.tagItem}>
                        <input
                          type="checkbox"
                          checked={formData.tag_slugs.includes(tag.slug)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, tag_slugs: [...formData.tag_slugs, tag.slug] });
                            } else {
                              setFormData({ ...formData, tag_slugs: formData.tag_slugs.filter((slug) => slug !== tag.slug) });
                            }
                          }}
                        />
                        <span>{tag.name}</span>
                        {tag.name_ar && <span className={styles.tagNameAr}>({tag.name_ar})</span>}
                      </label>
                    ))}
                  </div>
                  {formData.tag_slugs.length > 0 && (
                    <div className={styles.tagCount}>
                      {formData.tag_slugs.length} {formData.tag_slugs.length === 1 ? 'tag' : 'tags'} selected
                    </div>
                  )}
                  <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '8px' }}>
                    Only show businesses with ALL selected tags
                  </small>
                </div>

                <div className="form-group">
                  <label>Filters (optional)</label>
                  {availableFilters.length > 0 && (
                    <div className={styles.filterList}>
                      {availableFilters.map((filter) => (
                        <div key={filter.id} className={styles.filterGroup}>
                          <label className={styles.filterLabel}>{filter.label}</label>
                          <select
                            value={selectedFilterOptions[filter.id] || ''}
                            onChange={(e) => {
                              const newOptions = { ...selectedFilterOptions };
                              if (e.target.value) {
                                newOptions[filter.id] = parseInt(e.target.value);
                              } else {
                                delete newOptions[filter.id];
                              }
                              setSelectedFilterOptions(newOptions);
                            }}
                          >
                            <option value="">No filter</option>
                            {filter.options?.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.label} {option.label_ar && `(${option.label_ar})`}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    Only show businesses matching ALL selected filter options
                  </small>
                </div>

                <div className={styles.modalActions}>
                  <button type="submit" className="btn btn-primary">
                    {editingSection ? 'Update' : 'Create'}
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

        {showBadgeModal && selectedSection && (
          <div className={styles.modal} onClick={() => setShowBadgeModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h2>Manage Badges for Section</h2>
              <p style={{ marginBottom: '20px', color: '#666' }}>
                Section: <strong>{selectedSection.title}</strong>
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
                  <button type="submit" className="btn btn-primary">Save</button>
                  <button type="button" onClick={() => setShowBadgeModal(false)} className="btn btn-secondary">
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
