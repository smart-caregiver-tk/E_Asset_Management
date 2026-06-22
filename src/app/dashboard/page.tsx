'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { formatNumber, formatMoney } from '@/lib/utils';
import {
  Package,
  CircleDollarSign,
  AlertTriangle,
  HandHelping,
  FolderTree,
  Building2,
  Clock,
  Loader2,
} from 'lucide-react';
import Link from 'next/navigation';

interface StatData {
  totalCount: number;
  totalValue: number;
  brokenCount: number;
  lendCount: number;
}

interface CategoryStat {
  id: string;
  name: string;
  code: string;
  count: number;
  value: number;
}

interface DeptStat {
  id: string;
  name: string;
  shortName: string;
  count: number;
  value: number;
}

interface RecentAsset {
  id: string;
  code: string;
  name: string;
  status: string;
  total_value: number;
  created_at: string;
}

export default function DashboardPage() {
  const { profile, selectedDeptId, departments } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatData>({
    totalCount: 0,
    totalValue: 0,
    brokenCount: 0,
    lendCount: 0,
  });
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [deptStats, setDeptStats] = useState<DeptStat[]>([]);
  const [recentAssets, setRecentAssets] = useState<RecentAsset[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        // Build base queries
        let assetQuery = supabase.from('assets').select('*, categories(*)');
        let categoryQuery = supabase.from('categories').select('*');

        if (selectedDeptId) {
          assetQuery = assetQuery.eq('department_id', selectedDeptId);
          categoryQuery = categoryQuery.eq('department_id', selectedDeptId);
        }

        const [assetsRes, categoriesRes] = await Promise.all([
          assetQuery,
          categoryQuery,
        ]);

        if (assetsRes.error) throw assetsRes.error;
        if (categoriesRes.error) throw categoriesRes.error;

        const allAssets = assetsRes.data || [];
        const allCategories = categoriesRes.data || [];

        // 1. Calculate main stats
        const totalCount = allAssets.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const totalValue = allAssets.reduce((sum, item) => sum + (Number(item.total_value) || 0), 0);
        const brokenCount = allAssets.filter((item) => item.status === 'ชำรุด').reduce((sum, item) => sum + (item.quantity || 0), 0);
        const lendCount = allAssets.filter((item) => item.status === 'ให้ยืม').reduce((sum, item) => sum + (item.quantity || 0), 0);

        setStats({ totalCount, totalValue, brokenCount, lendCount });

        // 2. Category breakdown stats
        // Group assets by category_id first
        const catIdMap = new Map<string, { count: number; value: number }>();
        allAssets.forEach((item) => {
          if (item.category_id) {
            const current = catIdMap.get(item.category_id) || { count: 0, value: 0 };
            catIdMap.set(item.category_id, {
              count: current.count + (item.quantity || 0),
              value: current.value + (Number(item.total_value) || 0),
            });
          }
        });

        // Group by category CODE (not id) to avoid duplicate rows when
        // the same code exists once per department (Admin all-dept view)
        const codeGroupMap = new Map<string, { name: string; code: string; count: number; value: number }>();
        allCategories.forEach((cat) => {
          const assetStat = catIdMap.get(cat.id) || { count: 0, value: 0 };
          const existing = codeGroupMap.get(cat.code);
          if (existing) {
            existing.count += assetStat.count;
            existing.value += assetStat.value;
          } else {
            codeGroupMap.set(cat.code, {
              name: cat.name,
              code: cat.code,
              count: assetStat.count,
              value: assetStat.value,
            });
          }
        });

        const catStatsList: CategoryStat[] = Array.from(codeGroupMap.values())
          .map((g) => ({
            id: g.code, // use code as unique key for display
            name: g.name,
            code: g.code,
            count: g.count,
            value: g.value,
          }))
          .sort((a, b) => b.value - a.value);

        setCategoryStats(catStatsList);

        // 3. Department breakdown stats (only needed if admin and no single department is selected)
        if (profile?.role === 'admin' && !selectedDeptId) {
          const deptMap = new Map<string, { count: number; value: number }>();
          allAssets.forEach((item) => {
            if (item.department_id) {
              const current = deptMap.get(item.department_id) || { count: 0, value: 0 };
              deptMap.set(item.department_id, {
                count: current.count + (item.quantity || 0),
                value: current.value + (Number(item.total_value) || 0),
              });
            }
          });

          const deptStatsList: DeptStat[] = departments.map((dept) => {
            const s = deptMap.get(dept.id) || { count: 0, value: 0 };
            return {
              id: dept.id,
              name: dept.name,
              shortName: dept.short_name,
              count: s.count,
              value: s.value,
            };
          }).sort((a, b) => b.value - a.value);

          setDeptStats(deptStatsList);
        }

        // 4. Recent Assets (last 5)
        const sortedRecent = [...allAssets]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
          .map((item) => ({
            id: item.id,
            code: item.code,
            name: item.name,
            status: item.status,
            total_value: Number(item.total_value),
            created_at: item.created_at,
          }));

        setRecentAssets(sortedRecent);

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (profile) {
      loadDashboardData();
    }
  }, [selectedDeptId, profile, departments]);

  if (loading) {
    return (
      <div className="loading">
        <Loader2 className="animate-spin text-primary" size={30} style={{ margin: '0 auto' }} />
        <p style={{ marginTop: '12px' }}>กำลังสรุปข้อมูลแดชบอร์ด...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <Building2 size={24} />
            แดชบอร์ดสรุปสถิติ
          </h2>
          <p className="page-subtitle">
            {selectedDeptId
              ? `รายงานสถานะครุภัณฑ์ สังกัด: ${departments.find((d) => d.id === selectedDeptId)?.name}`
              : 'รายงานภาพรวมครุภัณฑ์เทศบาลเมืองทับกวาง (ทุกกอง)'}
          </p>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Package size={24} />
          </div>
          <div>
            <div className="stat-value">{formatNumber(stats.totalCount)}</div>
            <div className="stat-label">ครุภัณฑ์ทั้งหมด (รายการ)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon teal">
            <CircleDollarSign size={24} />
          </div>
          <div>
            <div className="stat-value">{formatMoney(stats.totalValue)}</div>
            <div className="stat-label">มูลค่ารวมทั้งหมด (บาท)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="stat-value">{formatNumber(stats.brokenCount)}</div>
            <div className="stat-label">ครุภัณฑ์ชำรุด (รายการ)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon violet">
            <HandHelping size={24} />
          </div>
          <div>
            <div className="stat-value">{formatNumber(stats.lendCount)}</div>
            <div className="stat-label">อยู่ระหว่างให้ยืม (รายการ)</div>
          </div>
        </div>
      </div>

      {/* Main Grid split */}
      <div className="dashboard-grid">
        {/* Left Column: Categories Summary */}
        <div className="card">
          <div className="card-header">
            <h3>
              <FolderTree size={18} />
              สรุปตามหมวดหมู่ครุภัณฑ์
            </h3>
            <a href="/dashboard/categories" className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
              จัดการหมวดหมู่
            </a>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {categoryStats.length === 0 ? (
              <div className="empty-state">
                <FolderTree />
                <p>ยังไม่มีข้อมูลหมวดหมู่</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>รหัส</th>
                      <th>หมวดหมู่</th>
                      <th className="text-center">จำนวนครุภัณฑ์</th>
                      <th className="text-right">มูลค่ารวม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryStats.map((cat) => (
                      <tr key={cat.id}>
                        <td style={{ fontWeight: 600 }}>{cat.code}</td>
                        <td>{cat.name}</td>
                        <td className="text-center">{formatNumber(cat.count)}</td>
                        <td className="text-right" style={{ fontWeight: 600, color: 'var(--text-dark)' }}>
                          {formatMoney(cat.value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Admin view of all departments OR Recent Activity */}
        {profile?.role === 'admin' && !selectedDeptId ? (
          <div className="card">
            <div className="card-header">
              <h3>
                <Building2 size={18} />
                สรุปข้อมูลรายส่วนราชการ (9 กอง)
              </h3>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>ส่วนราชการ</th>
                      <th className="text-center">จำนวนรายการ</th>
                      <th className="text-right">มูลค่ารวม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deptStats.map((dept) => (
                      <tr key={dept.id}>
                        <td style={{ fontWeight: 500 }}>{dept.name}</td>
                        <td className="text-center">{formatNumber(dept.count)}</td>
                        <td className="text-right" style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>
                          {formatMoney(dept.value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-header">
              <h3>
                <Clock size={18} />
                ครุภัณฑ์บันทึกล่าสุด
              </h3>
              <a href="/dashboard/assets" className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                จัดการครุภัณฑ์
              </a>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {recentAssets.length === 0 ? (
                <div className="empty-state">
                  <Package />
                  <p>ยังไม่มีข้อมูลครุภัณฑ์ที่บันทึก</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>รหัสครุภัณฑ์</th>
                        <th>ชื่อครุภัณฑ์</th>
                        <th>สถานะ</th>
                        <th className="text-right">มูลค่า</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentAssets.map((asset) => (
                        <tr key={asset.id}>
                          <td style={{ fontWeight: 600 }}>{asset.code}</td>
                          <td>{asset.name}</td>
                          <td>
                            <span
                              className={`badge-status ${
                                asset.status === 'ใช้งาน'
                                  ? 'badge-use'
                                  : asset.status === 'ชำรุด'
                                  ? 'badge-broken'
                                  : asset.status === 'จำหน่าย'
                                  ? 'badge-sell'
                                  : 'badge-lend'
                              }`}
                            >
                              {asset.status}
                            </span>
                          </td>
                          <td className="text-right" style={{ fontWeight: 600 }}>
                            {formatMoney(asset.total_value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
