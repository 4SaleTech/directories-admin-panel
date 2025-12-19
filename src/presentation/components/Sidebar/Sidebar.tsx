'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/application/contexts/AuthContext';
import styles from './Sidebar.module.scss';

export default function Sidebar() {
  const pathname = usePathname();
  const { admin, logout } = useAuth();

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/businesses', label: 'Businesses', icon: '🏢' },
    { href: '/categories', label: 'Categories', icon: '📁' },
    { href: '/keywords', label: 'Keywords', icon: '🔑' },
    { href: '/reviews', label: 'Reviews', icon: '⭐' },
    { href: '/review-reports', label: 'Review Reports', icon: '🚩' },
    { href: '/sections', label: 'Sections', icon: '📑' },
    { href: '/tags', label: 'Tags', icon: '🏷️' },
    { href: '/badges', label: 'Badges', icon: '🏆' },
    { href: '/filters', label: 'Filters', icon: '🔎' },
    { href: '/opensearch', label: 'OpenSearch', icon: '⚡', requireRole: 'super_admin' as const },
  ];

  // Filter menu items based on role
  const visibleMenuItems = menuItems.filter(
    (item) => !item.requireRole || admin?.role === item.requireRole
  );

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h2>4Sale Admin</h2>
        {admin && (
          <div className={styles.adminInfo}>
            <p className={styles.adminName}>{admin.username}</p>
            <span className={styles.adminRole}>{admin.role}</span>
          </div>
        )}
      </div>

      <nav className={styles.sidebarNav}>
        <ul>
          {visibleMenuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={pathname === item.href ? styles.active : ''}
              >
                <span className={styles.icon}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.sidebarFooter}>
        <button onClick={logout} className="btn btn-secondary" style={{ width: '100%' }}>
          Logout
        </button>
      </div>
    </div>
  );
}
