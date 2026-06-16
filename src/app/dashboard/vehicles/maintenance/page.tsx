'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getMaintenanceLogs, getVehicles, addMaintenanceLog, updateMaintenanceLog, updateVehicle } from '@/lib/vehicleService';
import { MaintenanceLog, Vehicle } from '@/types/vehicle_types';
import { formatCurrency, formatNumber, getTodayISO } from '@/lib/vehicleUtils';
import PrintForm6 from '@/components/PrintForm6';
import {
  Wrench,
  Plus,
  Edit,
  Trash2,
  Printer,
  Calendar,
  Coins,
  Settings,
  AlertTriangle,
  Loader2,
  X,
  Save,
  Building2,
  FileText
} from 'lucide-react';

export default function VehiclesMaintenancePage() {
  const { profile, selectedDeptId, departments } = useAuth();
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Form & Print states
  const [showForm, setShowForm] = useState(false);
  const [editingLog, setEditingLog] = useState<MaintenanceLog | null>(null);
  const [saving, setSaving] = useState(false);

  const [showPrint, setShowPrint] = useState(false);
  const [printVehicleId, setPrintVehicleId] = useState('');

  const [form, setForm] = useState({
    vehicle_id: '',
    repair_items: '',
    cost: 0,
    mileage_at_repair: 0,
    repair_shop: '',
    received_date: getTodayISO(),
    notes: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [lList, vList] = await Promise.all([
        getMaintenanceLogs(selectedDeptId),
        getVehicles(selectedDeptId),
      ]);
      setLogs(lList);
      setVehicles(vList);
    } catch (error) {
      console.error('Error loading maintenance logs:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDeptId]);

  useEffect(() => {
    if (profile) {
      loadData();
    }
  }, [loadData, profile]);

  // Set default vehicle in form when vehicles list loads
  useEffect(() => {
    if (vehicles.length > 0 && !form.vehicle_id && showForm && !editingLog) {
      setForm(prev => ({ ...prev, vehicle_id: vehicles[0].id }));
    }
  }, [vehicles, showForm, editingLog, form.vehicle_id]);

  // Auto-fill mileage when vehicle changes in form
  useEffect(() => {
    if (!editingLog && form.vehicle_id) {
      const v = vehicles.find(item => item.id === form.vehicle_id);
      if (v) {
        setForm(prev => ({ ...prev, mileage_at_repair: v.mileage_current }));
      }
    }
  }, [form.vehicle_id, editingLog, vehicles]);

  const handleOpenAdd = () => {
    setEditingLog(null);
    setForm({
      vehicle_id: vehicles[0]?.id || '',
      repair_items: '',
      cost: 0,
      mileage_at_repair: vehicles[0]?.mileage_current || 0,
      repair_shop: '',
      received_date: getTodayISO(),
      notes: '',
    });
    setShowForm(true);
  };

  const handleOpenEdit = (log: MaintenanceLog) => {
    setEditingLog(log);
    setForm({
      vehicle_id: log.vehicle_id || '',
      repair_items: log.repair_items || '',
      cost: Number(log.cost) || 0,
      mileage_at_repair: log.mileage_at_repair || 0,
      repair_shop: log.repair_shop || '',
      received_date: log.received_date || getTodayISO(),
      notes: log.notes || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehicle_id || !form.repair_items) {
      alert('กรุณากรอกข้อมูลยานพาหนะและรายการซ่อมบำรุง');
      return;
    }

    setSaving(true);
    try {
      if (editingLog) {
        await updateMaintenanceLog(editingLog.id, form);
      } else {
        await addMaintenanceLog(form);
        // Automatically update vehicle's mileage to the new mileage at repair if it's greater
        const v = vehicles.find(item => item.id === form.vehicle_id);
        if (v && form.mileage_at_repair > v.mileage_current) {
          await updateVehicle(v.id, { mileage_current: form.mileage_at_repair });
        }
      }
      setShowForm(false);
      loadData();
    } catch (error) {
      console.error('Error saving maintenance log:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleOpenPrint = (vId: string) => {
    setPrintVehicleId(vId);
    setShowPrint(true);
  };

  const totalCost = logs.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <Wrench size={24} />
            ประวัติการซ่อมบำรุงรักษายานพาหนะ (แบบ ๖)
          </h2>
          <p className="page-subtitle">
            บันทึกการเปลี่ยนน้ำมันเครื่อง ยางรถยนต์ ซ่อมสี ซ่อมเครื่องยนต์ และคุมค่าใช้จ่ายสะสม
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          บันทึกการซ่อมบำรุงใหม่
        </button>
      </div>

      {/* Quick Statistics Summary Card */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-icon blue">
            <Wrench size={24} />
          </div>
          <div>
            <div className="stat-value">{formatNumber(logs.length)} ครั้ง</div>
            <div className="stat-label">จำนวนการส่งซ่อมบำรุง</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">
            <Coins size={24} />
          </div>
          <div>
            <div className="stat-value">{formatCurrency(totalCost)}</div>
            <div className="stat-label">งบประมาณที่ใช้สะสม (บาท)</div>
          </div>
        </div>
      </div>

      {/* Print Forms Shortcut List */}
      {vehicles.length > 0 && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Printer size={16} />
              พิมพ์รายละเอียดประวัติการซ่อมบำรุงประจำรถ (แบบ ๖)
            </h4>
          </div>
          <div className="card-body" style={{ padding: '12px 20px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {vehicles.map(v => {
              const count = logs.filter(l => l.vehicle_id === v.id).length;
              return (
                <button
                  key={v.id}
                  className="btn btn-outline"
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  onClick={() => handleOpenPrint(v.id)}
                >
                  🖨️ {v.license_plate} ({count} รายการ)
                </button>
              );
            })}
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading" style={{ padding: '40px' }}>
          <Loader2 className="animate-spin text-primary" size={30} style={{ margin: '0 auto' }} />
          <p style={{ marginTop: '12px' }}>กำลังโหลดประวัติซ่อมบำรุง...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="card">
          <div className="card-body" style={{ padding: '48px', textAlign: 'center' }}>
            <Wrench size={48} style={{ color: 'var(--text-light)', marginBottom: '12px', margin: '0 auto' }} />
            <h3 style={{ color: 'var(--text-dark)' }}>ไม่มีบันทึกประวัติการซ่อมบำรุง</h3>
            <p style={{ color: 'var(--text-light)', marginTop: '4px' }}>สร้างรายการซ่อมบำรุงหรือเปลี่ยนอะไหล่รายการแรกด้านบน</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {logs.map(log => {
            const vehicle = vehicles.find(v => v.id === log.vehicle_id) || log.vehicle_cars;

            return (
              <div className="card" key={log.id} style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="card-body" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '12px', flex: '1', minWidth: '280px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--warning-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)', fontSize: '1.2rem' }}>
                        🔧
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                          {log.repair_items}
                        </h4>
                        
                        <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-dark)' }}>
                          <strong>ทะเบียนรถ:</strong> {vehicle?.license_plate || 'ไม่ระบุ'} ({vehicle?.vehicle_name || 'ไม่ระบุ'})
                          <span style={{ margin: '0 8px', color: 'var(--border-color)' }}>|</span>
                          <strong>ศูนย์บริการ/อู่:</strong> {log.repair_shop || 'ไม่ระบุ'}
                        </p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: '16px', rowGap: '4px', marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-light)' }}>
                          <span>📅 <strong>วันที่ตรวจรับงาน:</strong> {log.received_date ? new Date(log.received_date).toLocaleDateString('th-TH') : '-'}</span>
                          <span>🔢 <strong>เลขไมล์ขณะส่งซ่อม:</strong> {formatNumber(log.mileage_at_repair)} กม.</span>
                          <span style={{ color: 'var(--danger)', fontWeight: 600 }}>💰 <strong>ค่าใช้จ่าย:</strong> {formatCurrency(Number(log.cost))} บาท</span>
                        </div>
                        
                        {log.notes && (
                          <p style={{ margin: '6px 0 0', fontSize: '0.8rem', padding: '6px 10px', borderRadius: '4px', background: 'var(--bg-light)', borderLeft: '3px solid var(--border-color)', color: 'var(--text-dark)' }}>
                            <strong>หมายเหตุ:</strong> {log.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                        onClick={() => handleOpenPrint(log.vehicle_id || '')}
                        title="พิมพ์ประวัติการซ่อม (แบบ ๖)"
                      >
                        🖨️ แบบ ๖
                      </button>

                      <button
                        className="btn btn-outline"
                        style={{ padding: '6px' }}
                        onClick={() => handleOpenEdit(log)}
                      >
                        <Edit size={14} />
                      </button>

                      <button
                        className="btn btn-danger"
                        disabled
                        title="ระบบลบข้อมูลปิดการใช้งานชั่วคราวใน Phase 3A"
                        style={{ opacity: 0.5, cursor: 'not-allowed', padding: '6px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Dialog Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', margin: 0 }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>{editingLog ? 'แก้ไขบันทึกซ่อมบำรุง' : 'เพิ่มบันทึกซ่อมบำรุงรักษาพัสดุ'}</h3>
              <button className="btn btn-outline" style={{ border: 'none', padding: '4px' }} onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>ยานพาหนะ *</label>
                  <select
                    className="select-field"
                    value={form.vehicle_id}
                    onChange={e => updateField('vehicle_id', e.target.value)}
                    required
                  >
                    <option value="">-- เลือกรถยนต์ --</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        [{v.license_plate}] - {v.vehicle_name} (ไมล์ปัจจุบัน: {v.mileage_current} กม.)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>รายการอะไหล่ / การซ่อมบำรุงรักษา *</label>
                  <textarea
                    className="input-field"
                    rows={3}
                    placeholder="เช่น เปลี่ยนยางรถยนต์ 4 เส้น, เปลี่ยนถ่ายน้ำมันเครื่องพร้อมไส้กรอง"
                    value={form.repair_items}
                    onChange={e => updateField('repair_items', e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">ค่าใช้จ่ายรวม (บาท)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input-field"
                      placeholder="0.00"
                      value={form.cost}
                      onChange={e => updateField('cost', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="form-label">เลขไมล์เมื่อส่งเข้าซ่อม (กม.)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={form.mileage_at_repair}
                      onChange={e => updateField('mileage_at_repair', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">สถานที่ซ่อม/ชื่ออู่หรือศูนย์</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="เช่น บจก.โตโยต้าสระบุรี"
                      value={form.repair_shop}
                      onChange={e => updateField('repair_shop', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">วันที่มีการตรวจรับมอบงาน</label>
                    <input
                      type="date"
                      className="input-field"
                      value={form.received_date}
                      onChange={e => updateField('received_date', e.target.value)}
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
                      บันทึกรายการซ่อม
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Overlay Component */}
      {showPrint && (
        <PrintForm6 vehicleId={printVehicleId} onClose={() => setShowPrint(false)} />
      )}
    </div>
  );
}
