'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/application/contexts/AuthContext';
import Sidebar from '../Sidebar/Sidebar';
import styles from './AdminLayout.module.scss';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className={styles.adminLayout}>
      <Sidebar />
      <main className={styles.mainContent}>{children}</main>
    </div>
  );
}
