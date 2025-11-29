'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import AdminLayout from '@/presentation/components/AdminLayout/AdminLayout';
import LoadingSpinner from '@/presentation/components/LoadingSpinner/LoadingSpinner';
import Pagination from '@/presentation/components/Pagination/Pagination';
import BulkActionsToolbar from '@/presentation/components/BulkActionsToolbar/BulkActionsToolbar';
import IconPicker from '@/presentation/components/IconPicker/IconPicker';
import SEOFields from '@/presentation/components/SEOFields/SEOFields';
import { useBulkSelection } from '@/application/hooks/useBulkSelection';
import { businessAdminRepository } from '@/infrastructure/repositories/BusinessAdminRepository';
import { categoryAdminRepository } from '@/infrastructure/repositories/CategoryAdminRepository';
import { tagAdminRepository } from '@/infrastructure/repositories/TagAdminRepository';
import { badgeAdminRepository } from '@/infrastructure/repositories/BadgeAdminRepository';
import { Business } from '@/domain/entities/Business';
import { Category } from '@/domain/entities/Category';
import { Tag } from '@/domain/entities/Tag';
import { Badge } from '@/domain/entities/Badge';
import { Filter } from '@/domain/entities/Filter';
import { toastService } from '@/application/services/toastService';
import { logoGenerationService } from '@/infrastructure/services/LogoGenerationService';
import { socialMediaFetchService, SocialMediaLink } from '@/infrastructure/services/SocialMediaFetchService';
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
  FiPlus,
  FiEye,
  FiImage,
  FiShare2
} from 'react-icons/fi';
import 'react-quill/dist/quill.snow.css';
import styles from './businesses.module.scss';

// Dynamic import to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export default function BusinessesPage() {
  const router = useRouter();
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
    category_id: '',
  });
  const [dynamicFilters, setDynamicFilters] = useState<Record<string, string | string[]>>({});
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
    contact_info: {
      email: '',
      website: '',
      contact_numbers: '',
      whatsapp: '',
    },
    address: '',
    address_ar: '',
    logo: '',
    tag_ids: [] as number[],
    filter_values: {} as Record<string, string>,
    page_title: '',
    page_description: '',
    meta_title: '',
    meta_description: '',
    page_title_ar: '',
    page_description_ar: '',
    meta_title_ar: '',
    meta_description_ar: '',
    og_title: '',
    og_description: '',
    og_title_ar: '',
    og_description_ar: '',
    og_image: '',
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<Filter[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(false);

  // Logo generation state
  const [hasLogoFilter, setHasLogoFilter] = useState<string>('');
  const [logoSuggestion, setLogoSuggestion] = useState<string | null>(null);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [showLogoSuggestion, setShowLogoSuggestion] = useState(false);
  const [generatingForBusinessId, setGeneratingForBusinessId] = useState<number | null>(null);

  // Social media fetch state
  const [socialMediaSuggestions, setSocialMediaSuggestions] = useState<SocialMediaLink[]>([]);
  const [isFetchingSocialMedia, setIsFetchingSocialMedia] = useState(false);
  const [showSocialMediaSuggestions, setShowSocialMediaSuggestions] = useState(false);
  const [selectedSocialMediaLinks, setSelectedSocialMediaLinks] = useState<Set<number>>(new Set());

  // Badge assignment state
  const [badges, setBadges] = useState<Badge[]>([]);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [selectedBadgeIds, setSelectedBadgeIds] = useState<number[]>([]);
  const [originalBadgeIds, setOriginalBadgeIds] = useState<number[]>([]);

  const bulkSelection = useBulkSelection({
    items: businesses,
    getItemId: (business) => business.id,
  });

  // Load category filters when category changes
  useEffect(() => {
    if (filters.category_id) {
      loadCategoryFiltersForBusinessList(parseInt(filters.category_id));
    } else {
      setCategoryFilters([]);
      setDynamicFilters({});
    }
  }, [filters.category_id]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.status, filters.search, filters.is_verified, filters.is_featured, filters.sort, filters.category_id, dynamicFilters, hasLogoFilter]);

  useEffect(() => {
    loadBusinesses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filters.status, filters.search, filters.is_verified, filters.is_featured, filters.sort, filters.category_id, dynamicFilters, hasLogoFilter]);

  useEffect(() => {
    bulkSelection.clearSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businesses]);

  useEffect(() => {
    loadCategories();
    loadTags();
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

  const loadBadges = async () => {
    try {
      const response = await badgeAdminRepository.getAll();
      setBadges(response.data || []);
    } catch (err) {
      console.error('Failed to load badges:', err);
    }
  };

  const handleManageBadges = async (business: Business) => {
    setSelectedBusiness(business);
    setShowBadgeModal(true);

    // Fetch current badge assignments
    try {
      const response = await badgeAdminRepository.getBusinessBadges(business.id);
      const badgeIds = response.data?.map((b) => b.id) || [];
      setSelectedBadgeIds(badgeIds);
      setOriginalBadgeIds(badgeIds);
    } catch (err: any) {
      console.error('Failed to load business badges:', err);
      setSelectedBadgeIds([]);
      setOriginalBadgeIds([]);
    }
  };

  const handleBadgeAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusiness) return;

    try {
      // Assign all selected badges
      await badgeAdminRepository.assignBadgesToBusiness(
        selectedBusiness.id,
        selectedBadgeIds
      );

      toastService.success('Business badges updated successfully!');
      setShowBadgeModal(false);
    } catch (err: any) {
      toastService.error(`Failed to update badges: ${err.response?.data?.message || err.message}`);
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

  const loadCategoryFiltersForBusinessList = async (categoryId: number) => {
    try {
      setLoadingFilters(true);
      const response = await categoryAdminRepository.getCategoryFilters(categoryId);
      const filters = response.data || [];
      setCategoryFilters(filters);

      // Reset dynamic filters when category changes
      setDynamicFilters({});
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
      if (filters.category_id) params.category_id = parseInt(filters.category_id);
      if (hasLogoFilter) params.has_logo = hasLogoFilter === 'true';

      // Add dynamic filters if any are set
      if (Object.keys(dynamicFilters).length > 0) {
        params.filters = dynamicFilters;
      }

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
      contact_info: {
        email: '',
        website: '',
        contact_numbers: '',
        whatsapp: '',
      },
      address: '',
      address_ar: '',
      logo: '',
      tag_ids: [],
      filter_values: {},
      page_title: '',
      page_description: '',
      meta_title: '',
      meta_description: '',
      page_title_ar: '',
      page_description_ar: '',
      meta_title_ar: '',
      meta_description_ar: '',
      og_title: '',
      og_description: '',
      og_title_ar: '',
      og_description_ar: '',
      og_image: '',
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
      contact_info: {
        email: business.contact_info?.email || '',
        website: business.contact_info?.website || '',
        contact_numbers: business.contact_info?.contact_numbers?.join(', ') || '',
        whatsapp: business.contact_info?.whatsapp?.join(', ') || '',
      },
      address: business.address || '',
      address_ar: business.address_ar || '',
      logo: business.logo || '',
      tag_ids: business.tags?.map(tag => tag.id) || [],
      filter_values: business.attributes || {},
      page_title: business.page_title || '',
      page_description: business.page_description || '',
      meta_title: business.meta_title || '',
      meta_description: business.meta_description || '',
      page_title_ar: business.page_title_ar || '',
      page_description_ar: business.page_description_ar || '',
      meta_title_ar: business.meta_title_ar || '',
      meta_description_ar: business.meta_description_ar || '',
      og_title: business.og_title || '',
      og_description: business.og_description || '',
      og_title_ar: business.og_title_ar || '',
      og_description_ar: business.og_description_ar || '',
      og_image: business.og_image || '',
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

    // Convert contact_info from string format to array format
    if (cleaned.contact_info) {
      const contactInfo = cleaned.contact_info;
      cleaned.contact_info = {
        email: contactInfo.email || '',
        website: contactInfo.website || '',
        contact_numbers: contactInfo.contact_numbers
          ? contactInfo.contact_numbers.split(',').map((s: string) => s.trim()).filter((s: string) => s)
          : [],
        whatsapp: contactInfo.whatsapp
          ? contactInfo.whatsapp.split(',').map((s: string) => s.trim()).filter((s: string) => s)
          : [],
      };
    }

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

  // Logo generation handlers
  const handleGenerateLogo = async (businessName: string, forBusinessId?: number) => {
    try {
      setIsGeneratingLogo(true);
      if (forBusinessId) {
        setGeneratingForBusinessId(forBusinessId);
      }

      const logoUrl = await logoGenerationService.generateLogo(businessName);
      setLogoSuggestion(logoUrl);
      setShowLogoSuggestion(true);
      toastService.success('Logo generated successfully!');
    } catch (err: any) {
      toastService.error(`Failed to generate logo: ${err.message}`);
    } finally {
      setIsGeneratingLogo(false);
      if (forBusinessId) {
        setGeneratingForBusinessId(null);
      }
    }
  };

  const handleAcceptLogo = async () => {
    if (!logoSuggestion) return;

    try {
      // If generating for a business from the table
      if (generatingForBusinessId) {
        await businessAdminRepository.update(generatingForBusinessId, { logo: logoSuggestion });
        toastService.success('Logo updated successfully!');
        loadBusinesses();
      }
      // If editing a business in the modal
      else if (editingBusiness) {
        await businessAdminRepository.update(editingBusiness.id, { logo: logoSuggestion });
        toastService.success('Logo updated successfully!');
        loadBusinesses();
        setFormData({ ...formData, logo: logoSuggestion });
      }
      // If creating a new business, just update form data
      else {
        setFormData({ ...formData, logo: logoSuggestion });
        toastService.success('Logo added to form!');
      }

      setShowLogoSuggestion(false);
      setLogoSuggestion(null);
      setGeneratingForBusinessId(null);
    } catch (err: any) {
      toastService.error(`Failed to update logo: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleRejectLogo = () => {
    setShowLogoSuggestion(false);
    setLogoSuggestion(null);
    setGeneratingForBusinessId(null);
    toastService.info('Logo suggestion rejected');
  };

  // Social media fetch handlers
  const handleFetchSocialMedia = async (businessName: string) => {
    try {
      setIsFetchingSocialMedia(true);
      const links = await socialMediaFetchService.fetchSocialMedia(businessName);
      setSocialMediaSuggestions(links);
      setShowSocialMediaSuggestions(true);
      setSelectedSocialMediaLinks(new Set(links.map((_, index) => index))); // Select all by default
      toastService.success(`Found ${links.length} social media link(s)!`);
    } catch (err: any) {
      toastService.error(`Failed to fetch social media: ${err.message}`);
    } finally {
      setIsFetchingSocialMedia(false);
    }
  };

  const handleToggleSocialMediaLink = (index: number) => {
    const newSelected = new Set(selectedSocialMediaLinks);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSocialMediaLinks(newSelected);
  };

  const handleApproveSelectedSocialMedia = () => {
    const selectedLinks = socialMediaSuggestions
      .filter((_, index) => selectedSocialMediaLinks.has(index))
      .map(link => `${link.platform}: ${link.url}`)
      .join('\n');

    toastService.success(`Approved ${selectedSocialMediaLinks.size} social media link(s)!`);
    toastService.info(`Selected links:\n${selectedLinks}`);

    setShowSocialMediaSuggestions(false);
    setSocialMediaSuggestions([]);
    setSelectedSocialMediaLinks(new Set());
  };

  const handleRejectSocialMedia = () => {
    setShowSocialMediaSuggestions(false);
    setSocialMediaSuggestions([]);
    setSelectedSocialMediaLinks(new Set());
    toastService.info('Social media suggestions rejected');
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
              value={filters.category_id}
              onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
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
              value={hasLogoFilter}
              onChange={(e) => setHasLogoFilter(e.target.value)}
            >
              <option value="">Has Logo (All)</option>
              <option value="true">Has Logo</option>
              <option value="false">No Logo</option>
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

          {/* Dynamic category filters */}
          {categoryFilters.length > 0 && (
            <>
              {categoryFilters.map((filter) => {
                const hasSubtypeMultiSelect = filter.options?.some(
                  (opt) => opt.label.includes('multi') || filter.type === 'checkbox'
                );

                if (hasSubtypeMultiSelect) {
                  // Multi-select filter: render as checkboxes
                  const selectedValues = (dynamicFilters[filter.slug] as string[]) || [];

                  return (
                    <div key={filter.slug} className="form-group" style={{ minWidth: '200px' }}>
                      <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
                        {filter.label}
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {filter.options?.map((option) => (
                          <label key={option.value} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="checkbox"
                              checked={selectedValues.includes(option.value)}
                              onChange={(e) => {
                                const newValues = e.target.checked
                                  ? [...selectedValues, option.value]
                                  : selectedValues.filter((v) => v !== option.value);

                                setDynamicFilters((prev) => {
                                  const updated = { ...prev };
                                  if (newValues.length > 0) {
                                    updated[filter.slug] = newValues;
                                  } else {
                                    delete updated[filter.slug];
                                  }
                                  return updated;
                                });
                              }}
                            />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                } else {
                  // Single-select filter: render as dropdown
                  return (
                    <div key={filter.slug} className="form-group">
                      <select
                        value={(dynamicFilters[filter.slug] as string) || ''}
                        onChange={(e) => {
                          setDynamicFilters((prev) => {
                            const updated = { ...prev };
                            if (e.target.value) {
                              updated[filter.slug] = e.target.value;
                            } else {
                              delete updated[filter.slug];
                            }
                            return updated;
                          });
                        }}
                      >
                        <option value="">{filter.label} (All)</option>
                        {filter.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }
              })}
            </>
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
            },
          ]}
        />

        {/* Global Logo Suggestion Preview */}
        {showLogoSuggestion && logoSuggestion && generatingForBusinessId && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1000,
            padding: '20px',
            border: '2px solid #4caf50',
            borderRadius: '8px',
            backgroundColor: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            minWidth: '300px'
          }}>
            <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#2e7d32' }}>
              Generated Logo Preview
            </p>
            <img
              src={logoSuggestion}
              alt="Generated logo"
              style={{
                width: '100px',
                height: '100px',
                objectFit: 'contain',
                marginBottom: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: 'white',
                padding: '5px'
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleAcceptLogo}
                className="btn btn-success btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <FiCheck /> Accept
              </button>
              <button
                onClick={handleRejectLogo}
                className="btn btn-danger btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <FiX /> Reject
              </button>
            </div>
          </div>
        )}

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
                    <th>Logo</th>
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
                        {business.logo ? (
                          <img
                            src={business.logo}
                            alt={business.name}
                            style={{
                              width: '40px',
                              height: '40px',
                              objectFit: 'contain',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              padding: '2px'
                            }}
                          />
                        ) : (
                          <button
                            onClick={() => handleGenerateLogo(business.name, business.id)}
                            disabled={isGeneratingLogo && generatingForBusinessId === business.id}
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', padding: '4px 8px' }}
                          >
                            <FiImage size={12} />
                            {isGeneratingLogo && generatingForBusinessId === business.id ? 'Gen...' : 'Generate'}
                          </button>
                        )}
                      </td>
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
                            onClick={() => router.push(`/businesses/${business.id}`)}
                            className="btn btn-info btn-sm"
                          >
                            <FiEye /> Details
                          </button>
                          <button
                            onClick={() => handleEdit(business)}
                            className="btn btn-primary btn-sm"
                          >
                            <FiEdit2 /> Edit
                          </button>
                          <button
                            onClick={() => handleManageBadges(business)}
                            className="btn btn-info btn-sm"
                          >
                            Badges
                          </button>
                          {business.status === 'pending' && (
                            <button
                              onClick={() => handleAction('activate', business.id, business.name)}
                              className="btn btn-success btn-sm"
                            >
                              <FiPlay /> Activate
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

                  {/* Logo Generation */}
                  <div style={{ marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => handleGenerateLogo(formData.name)}
                      disabled={isGeneratingLogo || !formData.name}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <FiImage />
                      {isGeneratingLogo ? 'Generating Logo...' : 'Generate Logo'}
                    </button>
                    {!formData.name && (
                      <small style={{ color: '#999', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                        Enter business name first to generate logo
                      </small>
                    )}
                  </div>

                  {/* Logo Suggestion Preview */}
                  {showLogoSuggestion && logoSuggestion && (
                    <div style={{
                      marginTop: '15px',
                      padding: '15px',
                      border: '2px solid #4caf50',
                      borderRadius: '8px',
                      backgroundColor: '#f0f9f4'
                    }}>
                      <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#2e7d32' }}>
                        Generated Logo Preview
                      </p>
                      <img
                        src={logoSuggestion}
                        alt="Generated logo"
                        style={{
                          width: '100px',
                          height: '100px',
                          objectFit: 'contain',
                          marginBottom: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          backgroundColor: 'white',
                          padding: '5px'
                        }}
                      />
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={handleAcceptLogo}
                          className="btn btn-success btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                          <FiCheck /> Accept
                        </button>
                        <button
                          type="button"
                          onClick={handleRejectLogo}
                          className="btn btn-danger btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                          <FiX /> Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Social Media Fetch - Separate Form Group */}
                <div className="form-group">
                  <label>Social Media Discovery</label>
                  <button
                    type="button"
                    onClick={() => handleFetchSocialMedia(formData.name)}
                    disabled={isFetchingSocialMedia || !formData.name}
                    className="btn btn-info btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <FiShare2 />
                    {isFetchingSocialMedia ? 'Fetching Social Media...' : 'Fetch Social Media Links'}
                  </button>
                  {!formData.name && (
                    <small style={{ color: '#999', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                      Enter business name first to fetch social media
                    </small>
                  )}

                  {/* Social Media Suggestions Preview */}
                  {showSocialMediaSuggestions && socialMediaSuggestions.length > 0 && (
                    <div style={{
                      marginTop: '15px',
                      padding: '15px',
                      border: '2px solid #2196f3',
                      borderRadius: '8px',
                      backgroundColor: '#e3f2fd'
                    }}>
                      <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#1565c0' }}>
                        Found Social Media Links ({socialMediaSuggestions.length})
                      </p>
                      <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '10px' }}>
                        {socialMediaSuggestions.map((link, index) => (
                          <div
                            key={index}
                            style={{
                              padding: '8px',
                              marginBottom: '6px',
                              backgroundColor: 'white',
                              borderRadius: '4px',
                              border: selectedSocialMediaLinks.has(index) ? '2px solid #2196f3' : '1px solid #ddd',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onClick={() => handleToggleSocialMediaLink(index)}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="checkbox"
                                checked={selectedSocialMediaLinks.has(index)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleToggleSocialMediaLink(index);
                                }}
                                style={{ cursor: 'pointer' }}
                              />
                              <div style={{ flex: 1 }}>
                                <strong style={{ color: '#1565c0', fontSize: '14px' }}>{link.platform}</strong>
                                <br />
                                <small style={{ color: '#666', wordBreak: 'break-all', fontSize: '12px' }}>{link.url}</small>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button
                          type="button"
                          onClick={handleApproveSelectedSocialMedia}
                          className="btn btn-success btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                          disabled={selectedSocialMediaLinks.size === 0}
                        >
                          <FiCheck /> Approve Selected ({selectedSocialMediaLinks.size})
                        </button>
                        <button
                          type="button"
                          onClick={handleRejectSocialMedia}
                          className="btn btn-danger btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                          <FiX /> Reject All
                        </button>
                      </div>
                    </div>
                  )}
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
                    value={formData.contact_info.email}
                    onChange={(e) => setFormData({ ...formData, contact_info: { ...formData.contact_info, email: e.target.value } })}
                  />
                </div>

                <div className="form-group">
                  <label>Website</label>
                  <input
                    type="url"
                    value={formData.contact_info.website}
                    onChange={(e) => setFormData({ ...formData, contact_info: { ...formData.contact_info, website: e.target.value } })}
                  />
                </div>

                <div className="form-group">
                  <label>Contact Numbers</label>
                  <input
                    type="text"
                    value={formData.contact_info.contact_numbers}
                    onChange={(e) => setFormData({ ...formData, contact_info: { ...formData.contact_info, contact_numbers: e.target.value } })}
                    placeholder="e.g., +965 1234 5678, +965 8765 4321"
                  />
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    Separate multiple numbers with commas
                  </small>
                </div>

                <div className="form-group">
                  <label>WhatsApp Numbers</label>
                  <input
                    type="text"
                    value={formData.contact_info.whatsapp}
                    onChange={(e) => setFormData({ ...formData, contact_info: { ...formData.contact_info, whatsapp: e.target.value } })}
                    placeholder="e.g., +965 1234 5678, +965 8765 4321"
                  />
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    Separate multiple numbers with commas
                  </small>
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

                <SEOFields
                  pageTitle={formData.page_title}
                  pageDescription={formData.page_description}
                  metaTitle={formData.meta_title}
                  metaDescription={formData.meta_description}
                  pageTitleAr={formData.page_title_ar}
                  pageDescriptionAr={formData.page_description_ar}
                  metaTitleAr={formData.meta_title_ar}
                  metaDescriptionAr={formData.meta_description_ar}
                  ogTitle={formData.og_title}
                  ogDescription={formData.og_description}
                  ogTitleAr={formData.og_title_ar}
                  ogDescriptionAr={formData.og_description_ar}
                  ogImage={formData.og_image}
                  onChange={(field, value) => setFormData({ ...formData, [field]: value })}
                  showOgFields={true}
                />

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

        {/* Badge Assignment Modal */}
        {showBadgeModal && selectedBusiness && (
          <div className={styles.modal} onClick={() => setShowBadgeModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h2>Manage Badges for Business</h2>
              <p style={{ marginBottom: '20px', color: '#666' }}>
                Business: <strong>{selectedBusiness.name}</strong>
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
