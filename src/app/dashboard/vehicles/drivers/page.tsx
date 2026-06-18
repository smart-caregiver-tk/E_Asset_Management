'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getDrivers, addDriver, updateDriver } from '@/lib/vehicleService';
import { Driver } from '@/types/vehicle_types';
import { formatThaiDate, isExpiringSoon, isExpired } from '@/lib/vehicleUtils';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Phone,
  CreditCard,
  Building2,
  Calendar,
  Loader2,
  X,
  Save,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export default function VehiclesDriversPage() {
  const { profile, selectedDeptId, departments } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    employee_id: '',
    department_id: '',
    license_no: '',
    license_type: 'ท.2',
    license_expire: '',
    phone: '',
    status: 'active' as Driver['status'],
    notes: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getDrivers(selectedDeptId);
      setDrivers(list);
    } catch (error) {
      console.error('Error loading drivers:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDeptId]);

  useEffect(() => {
    if (profile) {
      loadData();
    }
  }, [loadData, profile]);

  useEffect(() => {
    if (profile) {
      setForm(prev => ({
        ...prev,
        department_id: profile.role === 'admin' ? (selectedDeptId || departments[0]?.id || '') : (profile.department_id || ''),
      }));
    }
  }, [profile, selectedDeptId, departments, showForm]);

  const handleOpenAdd = () => {
    setEditingDriver(null);
    setForm({
      name: '',
      employee_id: '',
      department_id: profile?.role === 'admin' ? (selectedDeptId || departments[0]?.id || '') : (profile?.department_id || ''),
      license_no: '',
      license_type: 'ท.2',
      license_expire: '',
      phone: '',
      status: 'active',
      notes: '',
    });
    setShowForm(true);
  };

  const handleOpenEdit = (d: Driver) => {
    setEditingDriver(d);
    setForm({
      name: d.name,
      employee_id: d.employee_id || '',
      department_id: d.department_id || '',
      license_no: d.license_no || '',
      license_type: d.license_type || 'ท.2',
      license_expire: d.license_expire || '',
      phone: d.phone || '',
      status: d.status,
      notes: d.notes || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      alert('กรุณากรอกชื่อพนักงานขับรถ');
      return;
    }

    setSaving(true);
    try {
      if (editingDriver) {
        await updateDriver(editingDriver.id, {
          ...form,
          department_id: profile?.role === 'admin' ? form.department_id : (profile?.department_id || null),
        });
      } else {
        await addDriver({
          ...form,
          department_id: profile?.role === 'admin' ? form.department_id : (profile?.department_id || null),
          source_department_key: '',
        });
      }
      setShowForm(false);
      loadData();
    } catch (error) {
      console.error('Error saving driver:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <Users size={24} />
            ทะเบียนพนักงานขับรถยนต์
          </h2>
          <p className="page-subtitle">
            จัดการบัญชีรายชื่อพนักงานขับรถส่วนกลาง รถกระเช้า รถน้ำ รถขยะ และใบขับขี่หมดอายุ
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          เพิ่มพนักงานขับรถใหม่
        </button>
      </div>

      {loading ? (
        <div className="loading" style={{ padding: '40px' }}>
          <Loader2 className="animate-spin text-primary" size={30} style={{ margin: '0 auto' }} />
          <p style={{ marginTop: '12px' }}>กำลังโหลดข้อมูลพนักงานขับรถ...</p>
        </div>
      ) : drivers.length === 0 ? (
        <div className="card">
          <div className="card-body" style={{ padding: '48px', textAlign: 'center' }}>
            <Users size={48} style={{ color: 'var(--text-light)', marginBottom: '12px', margin: '0 auto' }} />
            <h3 style={{ color: 'var(--text-dark)' }}>ไม่พบข้อมูลพนักงานขับรถ</h3>
            <p style={{ color: 'var(--text-light)', marginTop: '4px' }}>กดปุ่มด้านบนเพื่อบันทึกข้อมูลพนักงานขับรถคนแรก</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {drivers.map(d => {
            const licenseExpiring = isExpiringSoon(d.license_expire, 60) && !isExpired(d.license_expire);
            const licenseExpired = isExpired(d.license_expire);
            const dept = departments.find(dep => dep.id === d.department_id);

            return (
              <div className="card" key={d.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-dark)', fontSize: '1.25rem' }}>
                        👨‍✈️
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-dark)', margin: 0 }}>{d.name}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>ตำแหน่ง: {d.employee_id || '-'}</span>
                      </div>
                    </div>
                    <span className={`badge-status ${d.status === 'active' ? 'badge-use' : 'badge-sell'}`} style={{ fontWeight: 600 }}>
                      {d.status === 'active' ? 'ปฏิบัติงานปกติ' : 'พักงาน/จำหน่าย'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-dark)' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <Building2 size={14} style={{ color: 'var(--text-light)' }} />
                      <span>สังกัด: {dept?.name || 'ไม่สังกัดกอง (ส่วนกลาง)'}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <Phone size={14} style={{ color: 'var(--text-light)' }} />
                      <span>เบอร์โทร: <strong style={{ color: 'var(--text-dark)' }}>{d.phone || '-'}</strong></span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <CreditCard size={14} style={{ color: 'var(--text-light)' }} />
                      <span>ใบอนุญาตขับรถ: {d.license_no || '-'} ({d.license_type || 'ทั่วไป'})</span>
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: '6px',
                      alignItems: 'center',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: licenseExpired ? 'var(--danger-light)' : licenseExpiring ? 'var(--warning-light)' : 'transparent',
                      color: licenseExpired ? 'var(--danger)' : licenseExpiring ? 'var(--warning)' : 'inherit',
                      fontWeight: (licenseExpired || licenseExpiring) ? 600 : 'normal'
                    }}>
                      <Calendar size={14} />
                      <span>
                        วันหมดอายุใบขับขี่: {d.license_expire ? new Date(d.license_expire).toLocaleDateString('th-TH') : '-'}
                        {licenseExpired && ' ⚠️ หมดอายุแล้ว!'}
                        {licenseExpiring && ' ⚠️ ใกล้หมดอายุ'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card-footer" style={{ display: 'flex', gap: '8px', padding: '12px 16px', background: 'var(--bg-light)' }}>
                  <button className="btn btn-outline" style={{ flex: 1, padding: '6px', fontSize: '0.8rem' }} onClick={() => handleOpenEdit(d)}>
                    <Edit size={14} />
                    แก้ไขประวัติ
                  </button>
                  <button
                    className="btn btn-danger"
                    disabled
                    title="ระบบลบข้อมูลปิดการใช้งานชั่วคราวใน Phase 3A"
                    style={{ opacity: 0.5, cursor: 'not-allowed', padding: '6px 10px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Dialog Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', margin: 0 }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>{editingDriver ? 'แก้ไขข้อมูลพนักงานขับรถ' : 'เพิ่มพนักงานขับรถใหม่'}</h3>
              <button className="btn btn-outline" style={{ border: 'none', padding: '4px' }} onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>ชื่อ-นามสกุล *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="นายมีชัย ใจดี"
                    value={form.name}
                    onChange={e => updateField('name', e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">ตำแหน่ง</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="เช่น พนักงานขับรถ, ผู้ช่วยช่าง"
                      value={form.employee_id}
                      onChange={e => updateField('employee_id', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">สังกัดฝ่ายราชการ</label>
                    {profile?.role === 'admin' ? (
                      <select
                        className="select-field"
                        value={form.department_id}
                        onChange={e => updateField('department_id', e.target.value)}
                      >
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        className="input-field"
                        value={departments.find(d => d.id === form.department_id)?.name || ''}
                        disabled
                        style={{ backgroundColor: 'var(--bg-light)', cursor: 'not-allowed' }}
                      />
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">เลขที่ใบอนุญาตขับขี่</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="เลขที่ใบขับขี่"
                      value={form.license_no}
                      onChange={e => updateField('license_no', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">ประเภทใบขับขี่</label>
                    <select
                      className="select-field"
                      value={form.license_type}
                      onChange={e => updateField('license_type', e.target.value)}
                    >
                      <option value="ท.1">ท.1 (รถขนาดเล็ก)</option>
                      <option value="ท.2">ท.2 (รถบรรทุก/รถตู้)</option>
                      <option value="ท.3">ท.3 (รถลากจูง)</option>
                      <option value="ท.4">ท.4 (สารเคมี/วัตถุอันตราย)</option>
                      <option value="ทั่วไป">ส่วนบุคคล/ทั่วไป</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">วันหมดอายุใบอนุญาต</label>
                    <input
                      type="date"
                      className="input-field"
                      value={form.license_expire}
                      onChange={e => updateField('license_expire', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">เบอร์โทรศัพท์ติดต่อ</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="08X-XXXXXXX"
                      value={form.phone}
                      onChange={e => updateField('phone', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">สถานะพนักงาน</label>
                  <select
                    className="select-field"
                    value={form.status}
                    onChange={e => updateField('status', e.target.value)}
                  >
                    <option value="active">พร้อมปฏิบัติหน้าที่ (Active)</option>
                    <option value="inactive">พักงาน/ลาออก/ไม่พร้อมปฏิบัติหน้าที่</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">หมายเหตุ</label>
                  <textarea
                    className="input-field"
                    rows={2}
                    value={form.notes}
                    onChange={e => updateField('notes', e.target.value)}
                  />
                </div>
              </div>

              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      บันทึกพนักงานขับรถ
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
