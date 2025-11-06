import { useState, useEffect } from 'react';
import { toastService } from '@/application/services/toastService';
import { adminApiClient } from '@/infrastructure/api/adminApiClient';
import LoadingSpinner from '@/presentation/components/LoadingSpinner/LoadingSpinner';
import { FiMapPin, FiPlus, FiEdit2, FiTrash2, FiSave, FiPhone, FiMail, FiMap } from 'react-icons/fi';
import styles from './BranchesTab.module.scss';

interface BranchesTabProps {
  businessId: number;
}

interface Branch {
  id: number;
  business_id: number;
  name: string;
  name_ar?: string;
  address: string;
  address_ar?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  is_main: boolean;
  status: string;
  working_days?: string;
  created_at: string;
  updated_at: string;
}

export default function BranchesTab({ businessId }: BranchesTabProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    address: '',
    address_ar: '',
    latitude: '',
    longitude: '',
    phone: '',
    email: '',
    is_main: false,
    working_days: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadBranches();
  }, [businessId]);

  const loadBranches = async () => {
    try {
      setIsLoading(true);
      const response = await adminApiClient.get(`/admin/businesses/${businessId}/branches`);
      setBranches(response.branches || []);
    } catch (err: any) {
      console.error('Failed to load branches:', err);
      if (err.response?.status !== 404) {
        toastService.error('Failed to load branches');
      }
      setBranches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingBranch(null);
    setFormData({
      name: '',
      name_ar: '',
      address: '',
      address_ar: '',
      latitude: '',
      longitude: '',
      phone: '',
      email: '',
      is_main: false,
      working_days: '',
    });
    setShowModal(true);
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name || '',
      name_ar: branch.name_ar || '',
      address: branch.address || '',
      address_ar: branch.address_ar || '',
      latitude: branch.latitude?.toString() || '',
      longitude: branch.longitude?.toString() || '',
      phone: branch.phone || '',
      email: branch.email || '',
      is_main: branch.is_main || false,
      working_days: branch.working_days || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.address) {
      toastService.error('Name and address are required');
      return;
    }

    try {
      setIsSaving(true);

      const payload: any = {
        name: formData.name,
        address: formData.address,
        is_main: formData.is_main,
      };

      // Add optional fields only if they have values
      if (formData.name_ar) payload.name_ar = formData.name_ar;
      if (formData.address_ar) payload.address_ar = formData.address_ar;
      if (formData.latitude) payload.latitude = parseFloat(formData.latitude);
      if (formData.longitude) payload.longitude = parseFloat(formData.longitude);
      if (formData.phone) payload.phone = formData.phone;
      if (formData.email) payload.email = formData.email;
      if (formData.working_days) payload.working_days = formData.working_days;

      if (editingBranch) {
        // Update existing branch
        await adminApiClient.put(`/admin/branches/${editingBranch.id}`, payload);
        toastService.success('Branch updated successfully!');
      } else {
        // Create new branch
        await adminApiClient.post(`/admin/businesses/${businessId}/branches`, payload);
        toastService.success('Branch created successfully!');
      }

      setShowModal(false);
      loadBranches();
    } catch (err: any) {
      toastService.error(`Failed to save branch: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (branch: Branch) => {
    toastService.confirm(
      `Are you sure you want to delete "${branch.name}"?`,
      async () => {
        try {
          await adminApiClient.delete(`/admin/branches/${branch.id}`);
          toastService.success('Branch deleted successfully!');
          loadBranches();
        } catch (err: any) {
          toastService.error(`Failed to delete branch: ${err.response?.data?.error || err.message}`);
        }
      }
    );
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading branches..." />;
  }

  return (
    <div className={styles.branchesTab}>
      <div className={styles.header}>
        <div>
          <h2><FiMapPin /> Branches</h2>
          <p className={styles.subtitle}>Manage business branches and locations</p>
        </div>
        <button className="btn btn-primary" onClick={handleCreate}>
          <FiPlus /> Add Branch
        </button>
      </div>

      {branches.length === 0 ? (
        <div className={styles.empty}>
          <FiMapPin size={48} />
          <p>No branches yet</p>
          <button className="btn btn-primary" onClick={handleCreate}>
            <FiPlus /> Add First Branch
          </button>
        </div>
      ) : (
        <div className={styles.branchesList}>
          {branches.map((branch) => (
            <div key={branch.id} className={styles.branchCard}>
              <div className={styles.branchHeader}>
                <div className={styles.branchTitle}>
                  <h3>{branch.name}</h3>
                  {branch.name_ar && <p className={styles.nameAr}>{branch.name_ar}</p>}
                  {branch.is_main && (
                    <span className="badge badge-success">Main Branch</span>
                  )}
                  <span className={`badge ${branch.status === 'active' ? 'badge-success' : 'badge-secondary'}`}>
                    {branch.status}
                  </span>
                </div>
                <div className={styles.branchActions}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleEdit(branch)}
                  >
                    <FiEdit2 /> Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(branch)}
                  >
                    <FiTrash2 /> Delete
                  </button>
                </div>
              </div>

              <div className={styles.branchDetails}>
                <div className={styles.detailRow}>
                  <FiMap />
                  <div>
                    <strong>Address:</strong>
                    <p>{branch.address}</p>
                    {branch.address_ar && <p className={styles.textAr}>{branch.address_ar}</p>}
                  </div>
                </div>

                {(branch.latitude && branch.longitude) && (
                  <div className={styles.detailRow}>
                    <FiMapPin />
                    <div>
                      <strong>Coordinates:</strong>
                      <p>{branch.latitude}, {branch.longitude}</p>
                    </div>
                  </div>
                )}

                {branch.phone && (
                  <div className={styles.detailRow}>
                    <FiPhone />
                    <div>
                      <strong>Phone:</strong>
                      <p>{branch.phone}</p>
                    </div>
                  </div>
                )}

                {branch.email && (
                  <div className={styles.detailRow}>
                    <FiMail />
                    <div>
                      <strong>Email:</strong>
                      <p>{branch.email}</p>
                    </div>
                  </div>
                )}

                {branch.working_days && (
                  <div className={styles.detailRow}>
                    <div>
                      <strong>Working Days:</strong>
                      <p>{branch.working_days}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className={styles.modal} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>{editingBranch ? 'Edit Branch' : 'Add Branch'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Branch Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Branch name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Branch Name (Arabic)</label>
                <input
                  type="text"
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  placeholder="اسم الفرع"
                  dir="rtl"
                />
              </div>

              <div className="form-group">
                <label>Address *</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full address"
                  rows={2}
                  required
                />
              </div>

              <div className="form-group">
                <label>Address (Arabic)</label>
                <textarea
                  value={formData.address_ar}
                  onChange={(e) => setFormData({ ...formData, address_ar: e.target.value })}
                  placeholder="العنوان الكامل"
                  rows={2}
                  dir="rtl"
                />
              </div>

              <div className={styles.formRow}>
                <div className="form-group">
                  <label>Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="29.3759"
                  />
                </div>

                <div className="form-group">
                  <label>Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="47.9774"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+965 XXXX XXXX"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="branch@example.com"
                />
              </div>

              <div className="form-group">
                <label>Working Days</label>
                <input
                  type="text"
                  value={formData.working_days}
                  onChange={(e) => setFormData({ ...formData, working_days: e.target.value })}
                  placeholder="e.g., Saturday - Thursday"
                />
              </div>

              <div className="form-group">
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.is_main}
                    onChange={(e) => setFormData({ ...formData, is_main: e.target.checked })}
                  />
                  <span>Main Branch / Headquarters</span>
                </label>
              </div>

              <div className={styles.modalActions}>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  <FiSave /> {isSaving ? 'Saving...' : editingBranch ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
