import { useState, useEffect } from 'react';
import { toastService } from '@/application/services/toastService';
import { adminApiClient } from '@/infrastructure/api/adminApiClient';
import LoadingSpinner from '@/presentation/components/LoadingSpinner/LoadingSpinner';
import { FiMenu, FiPlus, FiTrash2, FiUpload } from 'react-icons/fi';
import styles from './MenuTab.module.scss';

interface MenuTabProps {
  businessId: number;
}

interface MenuItem {
  id: number;
  business_id: number;
  type: 'image' | 'video';
  url: string;
  thumbnail_url?: string;
  display_order: number;
  media_category: 'menu';
  created_at: string;
  updated_at: string;
}

export default function MenuTab({ businessId }: MenuTabProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMenuItem, setNewMenuItem] = useState({
    type: 'image' as 'image' | 'video',
    url: '',
    thumbnail_url: '',
  });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadMenuItems();
  }, [businessId]);

  const loadMenuItems = async () => {
    try {
      setIsLoading(true);
      const response = await adminApiClient.get(`/admin/businesses/${businessId}/menu`);
      setMenuItems(response.data?.data?.media || []);
    } catch (err: any) {
      console.error('Failed to load menu items:', err);
      toastService.error('Failed to load menu items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMenuItem.url) {
      toastService.error('Please enter a menu item URL');
      return;
    }

    try {
      setIsAdding(true);
      await adminApiClient.post(`/admin/businesses/${businessId}/menu`, {
        type: newMenuItem.type,
        url: newMenuItem.url,
        thumbnail_url: newMenuItem.thumbnail_url || undefined,
      });

      toastService.success('Menu item added successfully!');
      setShowAddModal(false);
      setNewMenuItem({ type: 'image', url: '', thumbnail_url: '' });
      loadMenuItems();
    } catch (err: any) {
      toastService.error(`Failed to add menu item: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteMenuItem = async (menuId: number) => {
    toastService.confirm(
      'Are you sure you want to delete this menu item?',
      async () => {
        try {
          await adminApiClient.delete(`/admin/menu/${menuId}`);
          toastService.success('Menu item deleted successfully!');
          loadMenuItems();
        } catch (err: any) {
          toastService.error(`Failed to delete menu item: ${err.response?.data?.message || err.message}`);
        }
      }
    );
  };

  const handleUpdateDisplayOrder = async (menuId: number, newOrder: number) => {
    try {
      await adminApiClient.put(`/admin/menu/${menuId}`, {
        display_order: newOrder,
      });
      toastService.success('Display order updated!');
      loadMenuItems();
    } catch (err: any) {
      toastService.error(`Failed to update display order: ${err.response?.data?.message || err.message}`);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading menu items..." />;
  }

  return (
    <div className={styles.menuTab}>
      <div className={styles.header}>
        <div>
          <h2><FiMenu /> Menu Items</h2>
          <p className={styles.subtitle}>Manage restaurant/business menu images</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <FiPlus /> Add Menu Item
        </button>
      </div>

      {menuItems.length === 0 ? (
        <div className={styles.empty}>
          <FiMenu size={48} />
          <p>No menu items yet</p>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <FiPlus /> Add First Menu Item
          </button>
        </div>
      ) : (
        <div className={styles.menuGrid}>
          {menuItems
            .sort((a, b) => a.display_order - b.display_order)
            .map((item) => (
              <div key={item.id} className={styles.menuCard}>
                {item.type === 'image' ? (
                  <img src={item.url} alt="Menu" className={styles.menuPreview} />
                ) : (
                  <div className={styles.videoPreview}>
                    {item.thumbnail_url ? (
                      <img src={item.thumbnail_url} alt="Video thumbnail" />
                    ) : (
                      <div className={styles.videoPlaceholder}>
                        <FiMenu size={32} />
                        <span>Video</span>
                      </div>
                    )}
                  </div>
                )}

                <div className={styles.menuInfo}>
                  <div className={styles.menuType}>
                    <span className={`badge ${item.type === 'image' ? 'badge-info' : 'badge-warning'}`}>
                      {item.type}
                    </span>
                    <span className="badge badge-success">Menu</span>
                    <span className="badge badge-secondary">Order: {item.display_order}</span>
                  </div>

                  <div className={styles.menuActions}>
                    <input
                      type="number"
                      value={item.display_order}
                      onChange={(e) => handleUpdateDisplayOrder(item.id, parseInt(e.target.value))}
                      className={styles.orderInput}
                      title="Display order"
                      min="0"
                    />
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteMenuItem(item.id)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>

                <div className={styles.menuUrl}>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" title={item.url}>
                    {item.url.length > 40 ? `${item.url.substring(0, 40)}...` : item.url}
                  </a>
                </div>
              </div>
            ))}
        </div>
      )}

      {showAddModal && (
        <div className={styles.modal} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2><FiUpload /> Add Menu Item</h2>
            <form onSubmit={handleAddMenuItem}>
              <div className="form-group">
                <label>Media Type *</label>
                <select
                  value={newMenuItem.type}
                  onChange={(e) => setNewMenuItem({ ...newMenuItem, type: e.target.value as 'image' | 'video' })}
                  required
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>

              <div className="form-group">
                <label>Menu Image URL *</label>
                <input
                  type="url"
                  value={newMenuItem.url}
                  onChange={(e) => setNewMenuItem({ ...newMenuItem, url: e.target.value })}
                  placeholder="https://example.com/menu-page.jpg"
                  required
                />
                <small>Full URL to the menu image or video</small>
              </div>

              {newMenuItem.type === 'video' && (
                <div className="form-group">
                  <label>Thumbnail URL (Optional)</label>
                  <input
                    type="url"
                    value={newMenuItem.thumbnail_url}
                    onChange={(e) => setNewMenuItem({ ...newMenuItem, thumbnail_url: e.target.value })}
                    placeholder="https://example.com/thumbnail.jpg"
                  />
                  <small>Optional thumbnail for video preview</small>
                </div>
              )}

              <div className={styles.modalActions}>
                <button type="submit" className="btn btn-primary" disabled={isAdding}>
                  {isAdding ? 'Adding...' : 'Add Menu Item'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                  disabled={isAdding}
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
