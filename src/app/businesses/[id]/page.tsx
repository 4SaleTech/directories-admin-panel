'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/presentation/components/AdminLayout/AdminLayout';
import LoadingSpinner from '@/presentation/components/LoadingSpinner/LoadingSpinner';
import { businessAdminRepository } from '@/infrastructure/repositories/BusinessAdminRepository';
import { Business } from '@/domain/entities/Business';
import { toastService } from '@/application/services/toastService';
import { FiArrowLeft, FiInfo, FiClock, FiImage, FiMenu, FiMapPin, FiHelpCircle } from 'react-icons/fi';
import OverviewTab from '@/presentation/components/BusinessDetail/OverviewTab';
import WorkingHoursTab from '@/presentation/components/BusinessDetail/WorkingHoursTab';
import MediaTab from '@/presentation/components/BusinessDetail/MediaTab';
import MenuTab from '@/presentation/components/BusinessDetail/MenuTab';
import BranchesTab from '@/presentation/components/BusinessDetail/BranchesTab';
import FAQTab from '@/presentation/components/BusinessDetail/FAQTab';
import styles from './businessDetail.module.scss';

type TabType = 'overview' | 'working-hours' | 'media' | 'menu' | 'branches' | 'faq';

export default function BusinessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = parseInt(params.id as string);

  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    if (businessId) {
      loadBusiness();
    }
  }, [businessId]);

  const loadBusiness = async () => {
    try {
      setIsLoading(true);
      const response = await businessAdminRepository.getById(businessId);
      setBusiness(response.data || null);
    } catch (err: any) {
      console.error('Failed to load business:', err);
      toastService.error('Failed to load business details');
      router.push('/businesses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBusinessUpdate = () => {
    loadBusiness();
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <LoadingSpinner text="Loading business details..." />
      </AdminLayout>
    );
  }

  if (!business) {
    return (
      <AdminLayout>
        <div className={styles.error}>Business not found</div>
      </AdminLayout>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FiInfo /> },
    { id: 'working-hours', label: 'Working Hours', icon: <FiClock /> },
    { id: 'media', label: 'Gallery', icon: <FiImage /> },
    { id: 'menu', label: 'Menu', icon: <FiMenu /> },
    { id: 'branches', label: 'Branches', icon: <FiMapPin /> },
    { id: 'faq', label: 'FAQs', icon: <FiHelpCircle /> },
  ];

  return (
    <AdminLayout>
      <div className={styles.businessDetail}>
        <div className={styles.header}>
          <button
            className="btn btn-secondary"
            onClick={() => router.push('/businesses')}
          >
            <FiArrowLeft /> Back to Businesses
          </button>
          <div className={styles.businessInfo}>
            <h1>{business.name}</h1>
            {business.name_ar && <p className={styles.nameAr}>{business.name_ar}</p>}
            <span className={`badge ${business.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
              {business.status}
            </span>
          </div>
        </div>

        <div className={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id as TabType)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'overview' && (
            <OverviewTab business={business} onUpdate={handleBusinessUpdate} />
          )}
          {activeTab === 'working-hours' && (
            <WorkingHoursTab businessId={businessId} />
          )}
          {activeTab === 'media' && (
            <MediaTab businessId={businessId} />
          )}
          {activeTab === 'menu' && (
            <MenuTab businessId={businessId} />
          )}
          {activeTab === 'branches' && (
            <BranchesTab businessId={businessId} />
          )}
          {activeTab === 'faq' && (
            <FAQTab businessId={businessId} />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
