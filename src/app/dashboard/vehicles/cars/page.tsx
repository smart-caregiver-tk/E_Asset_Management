'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getVehicles, addVehicle, updateVehicle, deleteVehicle, checkVehicleDependencies, VehicleDependencies } from '@/lib/vehicleService';
import { Vehicle } from '@/types/vehicle_types';
import { VEHICLE_TYPES, VEHICLE_STATUSES, FUEL_TYPES, formatNumber, formatThaiDate, formatThaiDateShort, getVehicleTypeName, getVehicleTypeIcon, getVehicleStatus } from '@/lib/vehicleUtils';
import {
  Car,
  Plus,
  Edit,
  Trash2,
  Filter,
  Loader2,
  X,
  Save,
  Building2,
  Calendar,
  Layers,
  FileText,
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';

export default function VehiclesCarsPage() {
  const { profile, selectedDeptId, departments } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete states
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [deleteChecking, setDeleteChecking] = useState(false);
  const [deleteDeps, setDeleteDeps] = useState<VehicleDependencies | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    license_plate: '',
    vehicle_name: '',
    vehicle_type: 'pickup_4door',
    brand: '',
    model: '',
    year: new Date().getFullYear() + 543,
    color: '',
    fuel_type: 'diesel',
    mileage_current: 0,
    status: 'available' as Vehicle['status'],
    department_id: '',
    insurance_expire: '',
    tax_expire: '',
    responsible_officer: '',
    notes: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getVehicles(selectedDeptId);
      setVehicles(list);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDeptId]);

  useEffect(() => {
    if (profile) {
      loadData();
    }
  }, [loadData, profile]);

  // Set default department in form when it changes or when modal opens
  useEffect(() => {
    if (profile) {
      setForm(prev => ({
        ...prev,
        department_id: profile.role === 'admin' ? (selectedDeptId || departments[0]?.id || '') : (profile.department_id || ''),
      }));
    }
  }, [profile, selectedDeptId, departments, showForm]);

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setForm({
      license_plate: '',
      vehicle_name: '',
      vehicle_type: 'pickup_4door',
      brand: '',
      model: '',
      year: new Date().getFullYear() + 543,
      color: '',
      fuel_type: 'diesel',
      mileage_current: 0,
      status: 'available',
      department_id: profile?.role === 'admin' ? (selectedDeptId || departments[0]?.id || '') : (profile?.department_id || ''),
      insurance_expire: '',
      tax_expire: '',
      responsible_officer: '',
      notes: '',
    });
    setShowForm(true);
  };

  const handleOpenEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setForm({
      license_plate: v.license_plate,
      vehicle_name: v.vehicle_name,
      vehicle_type: v.vehicle_type,
      brand: v.brand || '',
      model: v.model || '',
      year: v.year || new Date().getFullYear() + 543,
      color: v.color || '',
      fuel_type: v.fuel_type,
      mileage_current: v.mileage_current,
      status: v.status,
      department_id: v.department_id || '',
      insurance_expire: v.insurance_expire || '',
      tax_expire: v.tax_expire || '',
      responsible_officer: v.responsible_officer || '',
      notes: v.notes || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.license_plate || !form.vehicle_name) {
      alert('กรุณากรอกทะเบียนรถและชื่อยานพาหนะ');
      return;
    }

    setSaving(true);
    try {
      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, {
          ...form,
          department_id: profile?.role === 'admin' ? form.department_id : (profile?.department_id || null),
        });
      } else {
        await addVehicle({
          ...form,
          department_id: profile?.role === 'admin' ? form.department_id : (profile?.department_id || null),
          source_department_key: '',
          image_url: null,
        });
      }
      setShowForm(false);
      loadData();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // === Delete Logic (Admin Only) ===
  const handleDeleteClick = async (vehicle: Vehicle) => {
    setDeleteTarget(vehicle);
    setDeleteChecking(true);
    setDeleteDeps(null);
    try {
      const deps = await checkVehicleDependencies(vehicle.id);
      setDeleteDeps(deps);
    } catch (error) {
      console.error('Error checking dependencies:', error);
      alert('เกิดข้อผิดพลาดในการตรวจสอบข้อมูลอ้างอิง');
      setDeleteTarget(null);
    } finally {
      setDeleteChecking(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const success = await deleteVehicle(deleteTarget.id);
      if (success) {
        setDeleteTarget(null);
        setDeleteDeps(null);
        loadData();
      } else {
        alert('ไม่สามารถลบข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteTarget(null);
    setDeleteDeps(null);
    setDeleteChecking(false);
    setDeleting(false);
  };

  // Filter list
  const filteredVehicles = vehicles.filter(v => {
    if (filterStatus && v.status !== filterStatus) return false;
    if (filterType && v.vehicle_type !== filterType) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        v.license_plate.toLowerCase().includes(term) ||
        v.vehicle_name.toLowerCase().includes(term) ||
        (v.brand && v.brand.toLowerCase().includes(term)) ||
        (v.model && v.model.toLowerCase().includes(term))
      );
    }
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <Car size={24} />
            ทะเบียนยานพาหนะเทศบาล
          </h2>
          <p className="page-subtitle">
            จัดการข้อมูลรถยนต์ส่วนกลาง รถประจำตำแหน่ง และรถยนต์สนับสนุนปฏิบัติการพิเศษ
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          เพิ่มทะเบียนรถใหม่
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <input
                type="text"
                placeholder="ค้นหาทะเบียน, ชื่อรถ, ยี่ห้อ..."
                className="input-field"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', margin: 0 }}
              />
            </div>

            <div style={{ width: '180px' }}>
              <select
                className="select-field"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={{ width: '100%', margin: 0 }}
              >
                <option value="">ทุกสถานะ</option>
                {VEHICLE_STATUSES.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div style={{ width: '180px' }}>
              <select
                className="select-field"
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                style={{ width: '100%', margin: 0 }}
              >
                <option value="">ทุกประเภทรถ</option>
                {VEHICLE_TYPES.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading" style={{ padding: '40px' }}>
          <Loader2 className="animate-spin text-primary" size={30} style={{ margin: '0 auto' }} />
          <p style={{ marginTop: '12px' }}>กำลังโหลดข้อมูล...</p>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="card">
          <div className="card-body" style={{ padding: '48px', textAlign: 'center' }}>
            <Car size={48} style={{ color: 'var(--text-light)', marginBottom: '12px', margin: '0 auto' }} />
            <h3 style={{ color: 'var(--text-dark)' }}>ไม่พบข้อมูลยานพาหนะ</h3>
            <p style={{ color: 'var(--text-light)', marginTop: '4px' }}>ลองเปลี่ยนตัวกรอง หรือสร้างข้อมูลใหม่ด้านบน</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredVehicles.map(v => {
            const statusInfo = getVehicleStatus(v.status);
            const dept = departments.find(d => d.id === v.department_id);
            return (
              <div className="card" key={v.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '2rem' }}>{getVehicleTypeIcon(v.vehicle_type)}</span>
                      <div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-dark)', margin: 0 }}>{v.license_plate}</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{getVehicleTypeName(v.vehicle_type)}</span>
                      </div>
                    </div>
                    <span className="badge-status" style={{ color: statusInfo.color, backgroundColor: statusInfo.bgColor, fontWeight: 600 }}>
                      {statusInfo.name}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-dark)', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <Building2 size={14} style={{ color: 'var(--text-light)' }} />
                      <span>{dept?.name || 'ไม่สังกัดกอง (ส่วนกลาง)'}</span>
                    </div>
                    <div>
                      <strong>ชื่อรถ:</strong> {v.vehicle_name}
                    </div>
                    <div>
                      <strong>รายละเอียด:</strong> {v.brand || '-'} {v.model || '-'} ({v.color || 'ไม่ระบุสี'}) ปี {v.year || '-'}
                    </div>
                    <div>
                      <strong>เชื้อเพลิง:</strong> {FUEL_TYPES.find(f => f.id === v.fuel_type)?.name || v.fuel_type}
                    </div>
                    <div>
                      <strong>ผู้รับผิดชอบ:</strong> {v.responsible_officer || 'ไม่มีผู้ควบคุมเฉพาะ'}
                    </div>
                    <div style={{ background: 'var(--bg-light)', padding: '6px 8px', borderRadius: '4px', marginTop: '4px', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                      <span>เลขไมล์ปัจจุบัน:</span>
                      <span style={{ color: 'var(--primary-dark)', fontFamily: 'monospace' }}>{formatNumber(v.mileage_current)} กม.</span>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', color: 'var(--text-light)' }}>
                    <span>ประกันหมด: {formatThaiDateShort(v.insurance_expire)}</span>
                    <span>ภาษีหมด: {formatThaiDateShort(v.tax_expire)}</span>
                  </div>
                </div>

                <div className="card-footer" style={{ display: 'flex', gap: '8px', padding: '12px 16px', background: 'var(--bg-light)' }}>
                  <button className="btn btn-outline" style={{ flex: 1, padding: '6px', fontSize: '0.8rem' }} onClick={() => handleOpenEdit(v)}>
                    <Edit size={14} />
                    แก้ไขข้อมูล
                  </button>
                  {profile?.role === 'admin' ? (
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteClick(v)}
                      title="ลบข้อมูลยานพาหนะ (เฉพาะ Admin)"
                      style={{ padding: '6px 10px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  ) : (
                    <button
                      className="btn btn-danger"
                      disabled
                      title="เฉพาะ Admin เท่านั้นที่สามารถลบข้อมูลได้"
                      style={{ opacity: 0.5, cursor: 'not-allowed', padding: '6px 10px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Dialog Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', margin: 0 }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>{editingVehicle ? 'แก้ไขข้อมูลยานพาหนะ' : 'เพิ่มทะเบียนรถใหม่'}</h3>
              <button className="btn btn-outline" style={{ border: 'none', padding: '4px' }} onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>ทะเบียนรถ *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="เช่น กข-1234 สระบุรี"
                      value={form.license_plate}
                      onChange={e => updateField('license_plate', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>ชื่อเรียกยานพาหนะ *</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="เช่น รถกู้ภัย 1, รถตู้สำนักปลัด"
                      value={form.vehicle_name}
                      onChange={e => updateField('vehicle_name', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">ประเภทรถยนต์</label>
                    <select
                      className="select-field"
                      value={form.vehicle_type}
                      onChange={e => updateField('vehicle_type', e.target.value)}
                    >
                      {VEHICLE_TYPES.map(t => (
                        <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">ส่วนราชการผู้รับผิดชอบ</label>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">ยี่ห้อ</label>
                    <input
                      type="text"
                      className="input-field"
                      value={form.brand}
                      onChange={e => updateField('brand', e.target.value)}
                      placeholder="Toyota, Isuzu"
                    />
                  </div>
                  <div>
                    <label className="form-label">รุ่น (Model)</label>
                    <input
                      type="text"
                      className="input-field"
                      value={form.model}
                      onChange={e => updateField('model', e.target.value)}
                      placeholder="Hilux Revo, Commuter"
                    />
                  </div>
                  <div>
                    <label className="form-label">สีตัวถัง</label>
                    <input
                      type="text"
                      className="input-field"
                      value={form.color}
                      onChange={e => updateField('color', e.target.value)}
                      placeholder="ขาว, บรอนซ์เงิน"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">ปีผลิต (พ.ศ.)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={form.year}
                      onChange={e => updateField('year', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="form-label">ประเภทน้ำมัน/พลังงาน</label>
                    <select
                      className="select-field"
                      value={form.fuel_type}
                      onChange={e => updateField('fuel_type', e.target.value)}
                    >
                      {FUEL_TYPES.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">เลขไมล์เริ่มต้น (กม.)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={form.mileage_current}
                      onChange={e => updateField('mileage_current', parseInt(e.target.value) || 0)}
                      disabled={!!editingVehicle}
                      style={editingVehicle ? { backgroundColor: 'var(--bg-light)', cursor: 'not-allowed' } : {}}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">ผู้ควบคุม/รับผิดชอบรถ</label>
                    <input
                      type="text"
                      className="input-field"
                      value={form.responsible_officer}
                      onChange={e => updateField('responsible_officer', e.target.value)}
                      placeholder="ชื่อ-นามสกุล หรือตำแหน่ง"
                    />
                  </div>
                  <div>
                    <label className="form-label">สถานะรถยนต์</label>
                    <select
                      className="select-field"
                      value={form.status}
                      onChange={e => updateField('status', e.target.value)}
                    >
                      {VEHICLE_STATUSES.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">วันหมดอายุประกันภัย</label>
                    <input
                      type="date"
                      className="input-field"
                      value={form.insurance_expire}
                      onChange={e => updateField('insurance_expire', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">วันสิ้นสุดอายุภาษีประจำปี</label>
                    <input
                      type="date"
                      className="input-field"
                      value={form.tax_expire}
                      onChange={e => updateField('tax_expire', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">หมายเหตุเพิ่มเติม</label>
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
                      บันทึกยานพาหนะ
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation / Blocking Dialog */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', margin: 0 }}>
            {deleteChecking ? (
              /* Loading state while checking dependencies */
              <div className="card-body" style={{ padding: '40px', textAlign: 'center' }}>
                <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)', margin: '0 auto 12px' }} />
                <p style={{ fontWeight: 600, color: 'var(--text-dark)' }}>กำลังตรวจสอบข้อมูลอ้างอิง...</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '4px' }}>
                  {deleteTarget.license_plate} — {deleteTarget.vehicle_name}
                </p>
              </div>
            ) : deleteDeps && deleteDeps.total > 0 ? (
              /* Blocked — has dependencies */
              <>
                <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(220, 53, 69, 0.08)' }}>
                  <ShieldAlert size={22} style={{ color: 'var(--danger)' }} />
                  <h3 style={{ color: 'var(--danger)', margin: 0 }}>ไม่สามารถลบได้</h3>
                </div>
                <div className="card-body" style={{ padding: '20px' }}>
                  <p style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--text-dark)' }}>
                    ยานพาหนะ "{deleteTarget.license_plate}" มีข้อมูลอ้างอิงอยู่ในระบบ
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '16px' }}>
                    กรุณาลบข้อมูลที่อ้างอิงก่อน หรือติดต่อผู้ดูแลระบบ
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--bg-light)', borderRadius: '8px', padding: '12px' }}>
                    {deleteDeps.trips > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                        <span>📋 บันทึกการเดินทาง (Trips)</span>
                        <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{deleteDeps.trips} รายการ</span>
                      </div>
                    )}
                    {deleteDeps.maintenance > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                        <span>🔧 บันทึกการซ่อมบำรุง (Maintenance)</span>
                        <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{deleteDeps.maintenance} รายการ</span>
                      </div>
                    )}
                    {deleteDeps.incidents > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                        <span>⚠️ รายงานอุบัติเหตุ (Incidents)</span>
                        <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{deleteDeps.incidents} รายการ</span>
                      </div>
                    )}
                    {deleteDeps.fuel > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                        <span>⛽ บันทึกการเติมน้ำมัน (Fuel)</span>
                        <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{deleteDeps.fuel} รายการ</span>
                      </div>
                    )}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.875rem' }}>
                      <span>รวมข้อมูลอ้างอิงทั้งหมด</span>
                      <span style={{ color: 'var(--danger)' }}>{deleteDeps.total} รายการ</span>
                    </div>
                  </div>
                </div>
                <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px' }}>
                  <button className="btn btn-outline" onClick={handleDeleteCancel}>
                    ปิด
                  </button>
                </div>
              </>
            ) : (
              /* No dependencies — confirm delete */
              <>
                <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255, 193, 7, 0.1)' }}>
                  <AlertTriangle size={22} style={{ color: '#e67e22' }} />
                  <h3 style={{ color: 'var(--text-dark)', margin: 0 }}>ยืนยันการลบข้อมูล</h3>
                </div>
                <div className="card-body" style={{ padding: '20px' }}>
                  <p style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--text-dark)' }}>
                    คุณต้องการลบยานพาหนะนี้หรือไม่?
                  </p>
                  <div style={{ background: 'var(--bg-light)', borderRadius: '8px', padding: '12px', marginTop: '12px', fontSize: '0.9rem' }}>
                    <div><strong>ทะเบียน:</strong> {deleteTarget.license_plate}</div>
                    <div><strong>ชื่อรถ:</strong> {deleteTarget.vehicle_name}</div>
                    <div><strong>ประเภท:</strong> {getVehicleTypeName(deleteTarget.vehicle_type)}</div>
                    {deleteTarget.brand && <div><strong>ยี่ห้อ/รุ่น:</strong> {deleteTarget.brand} {deleteTarget.model || ''}</div>}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--danger)', marginTop: '12px', fontWeight: 600 }}>
                    ⚠️ การลบนี้ไม่สามารถย้อนกลับได้ (ข้อมูลจะถูกลบถาวร)
                  </p>
                </div>
                <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '12px 16px' }}>
                  <button className="btn btn-outline" onClick={handleDeleteCancel} disabled={deleting}>
                    ยกเลิก
                  </button>
                  <button className="btn btn-danger" onClick={handleDeleteConfirm} disabled={deleting}>
                    {deleting ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        กำลังลบ...
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} />
                        ยืนยันลบ
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
