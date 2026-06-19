'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { Menu, Calendar, Building2, UserCircle2 } from 'lucide-react';
import { getThaiDateFull } from '@/lib/utils';
import { usePathname } from 'next/navigation';

interface TopbarProps {
  onToggleMobile: () => void;
}

export default function Topbar({ onToggleMobile }: TopbarProps) {
  const { profile, departments, selectedDeptId, setSelectedDeptId } = useAuth();
  const [thaiDate, setThaiDate] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    setThaiDate(getThaiDateFull());
  }, []);

  // Simple breadcrumb logic based on pathname
  const getBreadcrumb = () => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 1 && segments[0] === 'dashboard') {
      return 'แดชบอร์ด';
    }
    const page = segments[1];
    switch (page) {
      case 'categories':
        return 'จัดการหมวดหมู่';
      case 'assets':
        return 'จัดเก็บครุภัณฑ์';
      case 'repairs':
        return 'บันทึกซ่อมบำรุง';
      case 'search':
        return 'ค้นหาครุภัณฑ์';
      case 'reports':
        return 'รายงาน / พ.ด. ๒';
      default:
        return 'ระบบบริหารครุภัณฑ์และยานพาหนะ';
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="mobile-toggle" onClick={onToggleMobile} title="เปิดเมนู">
          <Menu size={22} />
        </button>
        <div className="breadcrumb">{getBreadcrumb()}</div>
      </div>

      <div className="topbar-right">
        {/* Date Display */}
        <div className="topbar-date">
          <Calendar size={15} />
          <span>{thaiDate}</span>
        </div>

        {/* Multi-Department Selector for Admin, or Badge for User */}
        {profile?.role === 'admin' ? (
          <div className="dept-badge" style={{ padding: '2px 8px', background: 'var(--border-light)' }}>
            <Building2 size={15} style={{ marginRight: '4px' }} />
            <select
              value={selectedDeptId || ''}
              onChange={(e) => setSelectedDeptId(e.target.value || null)}
              className="form-input"
              style={{
                border: 'none',
                background: 'transparent',
                padding: '4px 20px 4px 4px',
                fontSize: '0.8rem',
                fontWeight: '600',
                color: 'var(--primary-dark)',
                width: 'auto',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="">ทุกส่วนราชการ (ทั้งหมด)</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="dept-badge">
            <Building2 size={15} />
            <span>{profile?.departments?.name || 'ไม่ระบุกอง'}</span>
          </div>
        )}

        {/* User avatar/initial display */}
        <button className="user-menu" title={profile?.full_name || profile?.email}>
          {profile?.full_name ? profile.full_name.substring(0, 2) : <UserCircle2 size={20} />}
        </button>
      </div>
    </header>
  );
}
