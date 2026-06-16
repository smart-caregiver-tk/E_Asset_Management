'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getVehicles, getTripLogs, getFuelLogs, getMaintenanceLogs } from '@/lib/vehicleService';
import { Vehicle, TripLog, FuelLog, MaintenanceLog } from '@/types/vehicle_types';
import { formatNumber, formatCurrency, getVehicleTypeIcon, getVehicleStatus, getTripStatus, isExpiringSoon, isExpired, getTodayISO } from '@/lib/vehicleUtils';
import {
  Car,
  CheckCircle,
  AlertTriangle,
  Wrench,
  Calendar,
  Compass,
  Fuel,
  Coins,
  Bell,
  Clock,
  Loader2,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import Link from 'next/link';

export default function VehiclesDashboardPage() {
  const { profile, selectedDeptId, departments } = useAuth();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<TripLog[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [maintLogs, setMaintLogs] = useState<MaintenanceLog[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [v, t, f, m] = await Promise.all([
        getVehicles(selectedDeptId),
        getTripLogs(selectedDeptId),
        getFuelLogs(selectedDeptId),
        getMaintenanceLogs(selectedDeptId),
      ]);
      setVehicles(v);
      setTrips(t);
      setFuelLogs(f);
      setMaintLogs(m);
    } catch (error) {
      console.error('Error loading vehicles dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDeptId]);

  useEffect(() => {
    if (profile) {
      loadData();
    }
  }, [loadData, profile]);

  if (loading) {
    return (
      <div className="loading">
        <Loader2 className="animate-spin text-primary" size={30} style={{ margin: '0 auto' }} />
        <p style={{ marginTop: '12px' }}>กำลังสรุปข้อมูลแดชบอร์ดยานพาหนะ...</p>
      </div>
    );
  }

  // Calculate metrics
  const totalVehicles = vehicles.length;
  const availableCount = vehicles.filter(v => v.status === 'available').length;
  const inUseCount = vehicles.filter(v => v.status === 'in_use').length;
  const maintenanceCount = vehicles.filter(v => v.status === 'maintenance').length;

  const todayStr = getTodayISO();
  const todayTripsCount = trips.filter(t => t.depart_date === todayStr).length;
  const activeTripsCount = trips.filter(t => t.status === 'in_use').length;
  const totalFuelCost = fuelLogs.reduce((sum, f) => sum + (Number(f.total_cost) || 0), 0);
  const totalMaintCost = maintLogs.reduce((sum, m) => sum + (Number(m.cost) || 0), 0);

  // Generate alerts (Expiring/Expired tax/insurance in 60 days)
  const expiringInsurance = vehicles.filter(v => isExpiringSoon(v.insurance_expire, 60) && !isExpired(v.insurance_expire));
  const expiringTax = vehicles.filter(v => isExpiringSoon(v.tax_expire, 60) && !isExpired(v.tax_expire));
  const expiredInsurance = vehicles.filter(v => isExpired(v.insurance_expire));
  const expiredTax = vehicles.filter(v => isExpired(v.tax_expire));
  const totalAlertsCount = expiringInsurance.length + expiringTax.length + expiredInsurance.length + expiredTax.length;

  // Active department name
  const deptName = selectedDeptId ? departments.find(d => d.id === selectedDeptId)?.name : 'ทุกส่วนราชการ';

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <Car size={24} />
            ระบบภาพรวมยานพาหนะ (Smart Vehicle)
          </h2>
          <p className="page-subtitle">
            รายงานสถานะการใช้รถยนต์และประวัติการเดินทาง สังกัด: {deptName}
          </p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="stat-grid">
        <Link href="/dashboard/vehicles/cars" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="stat-card">
            <div className="stat-icon blue">
              <Car size={24} />
            </div>
            <div>
              <div className="stat-value">{formatNumber(totalVehicles)}</div>
              <div className="stat-label">ยานพาหนะทั้งหมด (คัน)</div>
            </div>
          </div>
        </Link>

        <div className="stat-card">
          <div className="stat-icon teal">
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="stat-value">{formatNumber(availableCount)}</div>
            <div className="stat-label">พร้อมใช้งานปฏิบัติงาน</div>
          </div>
        </div>

        <Link href="/dashboard/vehicles/trips" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="stat-card">
            <div className="stat-icon violet">
              <Compass size={24} />
            </div>
            <div>
              <div className="stat-value">{formatNumber(inUseCount)}</div>
              <div className="stat-label">กำลังออกปฏิบัติงาน</div>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/vehicles/maintenance" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="stat-card">
            <div className="stat-icon amber">
              <Wrench size={24} />
            </div>
            <div>
              <div className="stat-value">{formatNumber(maintenanceCount)}</div>
              <div className="stat-label">อยู่ระหว่างซ่อมบำรุง</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Secondary Stats Row */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '24px' }}>
        <div className="stat-card" style={{ padding: '16px' }}>
          <Calendar size={18} style={{ color: 'var(--info)' }} />
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{todayTripsCount} เที่ยว</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>ขอใช้รถเดินทางวันนี้</div>
          </div>
        </div>

        <div className="stat-card" style={{ padding: '16px' }}>
          <Compass size={18} style={{ color: 'var(--primary)' }} />
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{activeTripsCount} คัน</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>อยู่ระหว่างปฏิบัติงาน</div>
          </div>
        </div>

        <Link href="/dashboard/vehicles/fuel" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="stat-card" style={{ padding: '16px' }}>
            <Fuel size={18} style={{ color: 'var(--success)' }} />
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{formatCurrency(totalFuelCost)}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>ค่าเชื้อเพลิงสะสม</div>
            </div>
          </div>
        </Link>

        <div className="stat-card" style={{ padding: '16px' }}>
          <Coins size={18} style={{ color: 'var(--warning)' }} />
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{formatCurrency(totalMaintCost)}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>ค่าซ่อมบำรุงสะสม</div>
          </div>
        </div>
      </div>

      {/* Split Grid: Alerts & Recent Trips */}
      <div className="dashboard-grid" style={{ marginBottom: '20px' }}>
        {/* Alerts Card */}
        <div className="card">
          <div className="card-header">
            <h3>
              <Bell size={18} style={{ color: 'var(--danger)' }} />
              การแจ้งเตือนต่อภาษี & ประกันภัย ({totalAlertsCount} รายการ)
            </h3>
          </div>
          <div className="card-body">
            {totalAlertsCount === 0 ? (
              <div className="empty-state" style={{ padding: '24px' }}>
                <CheckCircle size={32} style={{ color: 'var(--success)', marginBottom: '8px' }} />
                <p>เอกสารภาษีและประกันภัยรถยนต์ทุกคันอยู่ในสถานะปกติ</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
                {expiredInsurance.map(v => (
                  <div key={`exp-i-${v.id}`} style={{ padding: '10px 12px', background: 'var(--danger-light)', borderLeft: '4px solid var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                    <strong style={{ color: 'var(--danger)' }}>🚨 ประกันหมดอายุแล้ว:</strong> {v.vehicle_name} ({v.license_plate}) - หมดเมื่อ {v.insurance_expire ? new Date(v.insurance_expire).toLocaleDateString('th-TH') : '-'}
                  </div>
                ))}
                {expiredTax.map(v => (
                  <div key={`exp-t-${v.id}`} style={{ padding: '10px 12px', background: 'var(--danger-light)', borderLeft: '4px solid var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                    <strong style={{ color: 'var(--danger)' }}>🚨 ภาษีหมดอายุแล้ว:</strong> {v.vehicle_name} ({v.license_plate}) - หมดเมื่อ {v.tax_expire ? new Date(v.tax_expire).toLocaleDateString('th-TH') : '-'}
                  </div>
                ))}
                {expiringInsurance.map(v => (
                  <div key={`warn-i-${v.id}`} style={{ padding: '10px 12px', background: 'var(--warning-light)', borderLeft: '4px solid var(--warning)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                    <strong style={{ color: 'var(--warning)' }}>⚠️ ประกันใกล้หมดอายุ:</strong> {v.vehicle_name} ({v.license_plate}) - หมดอายุวันที่ {v.insurance_expire ? new Date(v.insurance_expire).toLocaleDateString('th-TH') : '-'}
                  </div>
                ))}
                {expiringTax.map(v => (
                  <div key={`warn-t-${v.id}`} style={{ padding: '10px 12px', background: 'var(--warning-light)', borderLeft: '4px solid var(--warning)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                    <strong style={{ color: 'var(--warning)' }}>⚠️ ภาษีใกล้หมดอายุ:</strong> {v.vehicle_name} ({v.license_plate}) - หมดอายุวันที่ {v.tax_expire ? new Date(v.tax_expire).toLocaleDateString('th-TH') : '-'}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Trips Card */}
        <div className="card">
          <div className="card-header">
            <h3>
              <Clock size={18} />
              รายการเดินทางล่าสุด (Recent Trips)
            </h3>
            <Link href="/dashboard/vehicles/trips" className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
              บันทึกคำขอใช้รถ
            </Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {trips.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px' }}>
                <ClipboardList size={32} style={{ color: 'var(--text-light)', marginBottom: '8px' }} />
                <p>ยังไม่มีบันทึกการขอเดินทาง</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>รายละเอียดงาน</th>
                      <th>ยานพาหนะ</th>
                      <th>สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.slice(0, 5).map(trip => {
                      const statusInfo = getTripStatus(trip.status);
                      return (
                        <tr key={trip.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{trip.destination}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                              ผู้ขอ: {trip.user_name} | วันเดินทาง: {trip.depart_date ? new Date(trip.depart_date).toLocaleDateString('th-TH') : '-'}
                            </div>
                          </td>
                          <td>
                            <div>{trip.vehicle_cars?.license_plate || '-'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{trip.vehicle_cars?.vehicle_name || '-'}</div>
                          </td>
                          <td>
                            <span className="badge-status" style={{ color: statusInfo.color, backgroundColor: statusInfo.bgColor }}>
                              {statusInfo.name}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vehicle Summary Table */}
      <div className="card">
        <div className="card-header">
          <h3>
            <Car size={18} />
            บัญชีรายการยานพาหนะสังกัดทั้งหมด
          </h3>
          <Link href="/dashboard/vehicles/cars" className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
            รายละเอียดทั้งหมด
          </Link>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {vehicles.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px' }}>
              <Car size={32} style={{ color: 'var(--text-light)', marginBottom: '8px' }} />
              <p>ไม่มีรายชื่อรถสังกัดฝ่ายของท่านในระบบ</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ทะเบียนรถ</th>
                    <th>ประเภทยานพาหนะ</th>
                    <th>ส่วนราชการที่รับผิดชอบ</th>
                    <th className="text-right">เลขไมล์ปัจจุบัน</th>
                    <th className="text-center">สถานะใช้งาน</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.slice(0, 6).map(v => {
                    const statusInfo = getVehicleStatus(v.status);
                    const vDept = departments.find(d => d.id === v.department_id);
                    return (
                      <tr key={v.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.25rem' }}>{getVehicleTypeIcon(v.vehicle_type)}</span>
                            <div>
                              <strong style={{ color: 'var(--text-dark)' }}>{v.license_plate}</strong>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{v.brand} {v.model}</div>
                            </div>
                          </div>
                        </td>
                        <td>{v.vehicle_name}</td>
                        <td>{vDept?.name || 'ไม่สังกัดกอง'}</td>
                        <td className="text-right" style={{ fontFamily: 'monospace', fontWeight: 600 }}>{formatNumber(v.mileage_current)} กม.</td>
                        <td className="text-center">
                          <span className="badge-status" style={{ color: statusInfo.color, backgroundColor: statusInfo.bgColor }}>
                            {statusInfo.name}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
