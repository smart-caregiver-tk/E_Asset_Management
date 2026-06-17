'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    // redirect เฉพาะเมื่อโหลดเสร็จแล้วและยืนยันว่าไม่มี user จริงๆ
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // ระหว่างโหลด session → แสดง loading แทนการ redirect ทันที
  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          background: 'var(--bg)',
        }}
      >
        <Loader2 className="animate-spin text-primary" size={36} />
        <span style={{ color: 'var(--text-mid)', fontSize: '0.9rem' }}>กำลังโหลดระบบข้อมูล...</span>
      </div>
    );
  }

  // โหลดเสร็จแล้วแต่ไม่มี user → แสดง loading สั้นๆ ขณะรอ redirect
  if (!user) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
        }}
      >
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      <div className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        <Topbar onToggleMobile={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
        <main className="page-container">{children}</main>
      </div>
    </div>
  );
}
