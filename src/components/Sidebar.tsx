'use client';

import React, { useState } from 'react';
import Link from 'next/navigation';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from './AuthProvider';
import {
  LayoutDashboard,
  FolderTree,
  Package,
  Wrench,
  Search,
  FileSpreadsheet,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
  Car,
  Users,
  ShieldAlert,
  Fuel,
  ChevronDown,
  ChevronUp,
  ClipboardList,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const { profile, logout } = useAuth();
  
  const isVehiclesActive = pathname.startsWith('/dashboard/vehicles');
  const [vehiclesOpen, setVehiclesOpen] = useState(isVehiclesActive);

  const menuItems = [
    { name: 'แดชบอร์ด', path: '/dashboard', icon: LayoutDashboard },
    { name: 'จัดการหมวดหมู่', path: '/dashboard/categories', icon: FolderTree },
    { name: 'จัดเก็บครุภัณฑ์', path: '/dashboard/assets', icon: Package },
    { name: 'บันทึกซ่อมบำรุง', path: '/dashboard/repairs', icon: Wrench },
    { name: 'ค้นหาครุภัณฑ์', path: '/dashboard/search', icon: Search },
    { name: 'รายงาน', path: '/dashboard/reports', icon: FileSpreadsheet },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">
              <Image
                src="/images/logo.png"
                alt="โลโก้เทศบาล"
                width={36}
                height={36}
                style={{ objectFit: 'contain' }}
              />
            </div>
            <div className="logo-text">
              <span className="logo-title">E-Asset Management</span>
              <span className="logo-sub">เทศบาลเมืองทับกวาง</span>
            </div>
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'ขยายเมนู' : 'ยุบเมนู'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">เมนูหลัก</div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path + '/'));
            return (
              <a
                key={item.path}
                href={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={20} />
                <span className="nav-label">{item.name}</span>
              </a>
            );
          })}

          <div className="nav-divider" />
          <div className="nav-section">ระบบจัดการยานพาหนะ</div>
          
          {/* ระบบยานพาหนะ Collapsible Menu */}
          <div>
            <button
              onClick={() => {
                if (collapsed) {
                  setCollapsed(false);
                  setVehiclesOpen(true);
                } else {
                  setVehiclesOpen(!vehiclesOpen);
                }
              }}
              className={`nav-item ${isVehiclesActive ? 'active' : ''}`}
              style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Car size={20} />
                <span className="nav-label">ระบบยานพาหนะ</span>
              </div>
              {!collapsed && (
                vehiclesOpen ? <ChevronUp size={16} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={16} style={{ marginLeft: 'auto' }} />
              )}
            </button>

            {vehiclesOpen && !collapsed && (
              <div style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '2px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', margin: '4px 8px' }}>
                {[
                  { name: 'ภาพรวมระบบ', path: '/dashboard/vehicles', icon: LayoutDashboard },
                  { name: 'ทะเบียนรถยนต์', path: '/dashboard/vehicles/cars', icon: Car },
                  { name: 'พนักงานขับรถ', path: '/dashboard/vehicles/drivers', icon: Users },
                  { name: 'บันทึกการขอใช้รถ', path: '/dashboard/vehicles/trips', icon: ClipboardList },
                  { name: 'บันทึกซ่อมบำรุง', path: '/dashboard/vehicles/maintenance', icon: Wrench },
                  { name: 'บันทึกอุบัติเหตุ', path: '/dashboard/vehicles/incidents', icon: ShieldAlert },
                  { name: 'บันทึกเติมน้ำมัน', path: '/dashboard/vehicles/fuel', icon: Fuel },
                ].map((subItem) => {
                  const SubIcon = subItem.icon;
                  const isSubActive = pathname === subItem.path;
                  return (
                    <a
                      key={subItem.path}
                      href={subItem.path}
                      className={`nav-item ${isSubActive ? 'active' : ''}`}
                      style={{ fontSize: '0.85rem', padding: '8px 10px', marginBottom: '1px' }}
                      onClick={() => setMobileOpen(false)}
                    >
                      <SubIcon size={16} />
                      <span className="nav-label">{subItem.name}</span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          <div className="nav-divider" />

          <button
            onClick={logout}
            className="nav-item"
            style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}
          >
            <LogOut size={20} style={{ color: 'var(--danger)' }} />
            <span className="nav-label" style={{ color: 'var(--danger)' }}>ออกจากระบบ</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-dept">
            <User size={14} />
            <span>
              {profile?.role === 'admin'
                ? 'ผู้ดูแลระบบ (Admin)'
                : profile?.departments?.short_name || 'ไม่ระบุกอง'}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
