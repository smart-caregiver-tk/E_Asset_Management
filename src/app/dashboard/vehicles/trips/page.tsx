'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getTripLogs, getVehicles, getDrivers, addTripLog, updateTripLog, updateVehicle } from '@/lib/vehicleService';
import { TripLog, Vehicle, Driver } from '@/types/vehicle_types';
import { getVehicleTypeIcon, getTripStatus, formatNumber, formatThaiDateShort, formatTime, getTodayISO, getCurrentTime } from '@/lib/vehicleUtils';
import PrintForm3 from '@/components/PrintForm3';
import PrintForm4 from '@/components/PrintForm4';
import TimeSelect24h from '@/components/TimeSelect24h';
import {
  ClipboardList,
  Plus,
  Edit,
  Trash2,
  Printer,
  Compass,
  CheckCircle,
  Clock,
  User,
  MapPin,
  Calendar,
  AlertTriangle,
  Loader2,
  X,
  Save,
  Building2,
  Play,
  Check
} from 'lucide-react';

export default function VehiclesTripsPage() {
  const { profile, selectedDeptId, departments } = useAuth();
  const [trips, setTrips] = useState<TripLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  // Form & Print states
  const [showForm, setShowForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState<TripLog | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [showPrint3, setShowPrint3] = useState(false);
  const [printTripId, setPrintTripId] = useState('');
  
  const [showPrint4, setShowPrint4] = useState(false);
  const [printVehicleId, setPrintVehicleId] = useState('');

  const [form, setForm] = useState({
    vehicle_id: '',
    driver_id: '',
    user_name: '',
    user_department: '',
    user_position: '',
    destination: '',
    purpose: '',
    depart_date: getTodayISO(),
    depart_time: getCurrentTime(),
    return_date: '',
    return_time: '',
    mileage_out: 0,
    mileage_in: '' as string | number,
    recorder_name: '',
    recorder_position: '',
    status: 'pending' as TripLog['status'],
    passengers_count: 1,
    addressed_to: 'นายกเทศมนตรีเมืองทับกวาง',
    notes: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tList, vList, dList] = await Promise.all([
        getTripLogs(selectedDeptId),
        getVehicles(selectedDeptId),
        getDrivers(selectedDeptId),
      ]);
      setTrips(tList);
      setVehicles(vList);
      setDrivers(dList);
    } catch (error) {
      console.error('Error loading trip logs:', error);
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
        user_department: profile.role === 'admin' ? (selectedDeptId || departments[0]?.id || '') : (profile.department_id || ''),
      }));
    }
  }, [profile, selectedDeptId, departments, showForm]);

  // Auto fill mileage_out when vehicle changes
  useEffect(() => {
    if (!editingTrip && form.vehicle_id) {
      const v = vehicles.find(item => item.id === form.vehicle_id);
      if (v) {
        setForm(prev => ({ ...prev, mileage_out: v.mileage_current }));
      }
    }
  }, [form.vehicle_id, editingTrip, vehicles]);

  const handleOpenAdd = () => {
    setEditingTrip(null);
    setForm({
      vehicle_id: vehicles[0]?.id || '',
      driver_id: drivers.filter(d => d.status === 'active')[0]?.id || '',
      user_name: profile?.full_name || profile?.email || '',
      user_department: profile?.role === 'admin' ? (selectedDeptId || departments[0]?.id || '') : (profile?.department_id || ''),
      user_position: '',
      destination: '',
      purpose: '',
      depart_date: getTodayISO(),
      depart_time: getCurrentTime(),
      return_date: '',
      return_time: '',
      mileage_out: vehicles[0]?.mileage_current || 0,
      mileage_in: '',
      recorder_name: profile?.full_name || profile?.email || '',
      recorder_position: '',
      status: 'pending',
      passengers_count: 1,
      addressed_to: 'นายกเทศมนตรีเมืองทับกวาง',
      notes: '',
    });
    setShowForm(true);
  };

  const handleOpenEdit = (t: TripLog) => {
    setEditingTrip(t);
    setForm({
      vehicle_id: t.vehicle_id || '',
      driver_id: t.driver_id || '',
      user_name: t.user_name || '',
      user_department: t.user_department || '',
      user_position: t.user_position || '',
      destination: t.destination || '',
      purpose: t.purpose || '',
      depart_date: t.depart_date || '',
      depart_time: t.depart_time || '',
      return_date: t.return_date || '',
      return_time: t.return_time || '',
      mileage_out: t.mileage_out || 0,
      mileage_in: t.mileage_in || '',
      recorder_name: t.recorder_name || '',
      recorder_position: t.recorder_position || '',
      status: t.status,
      passengers_count: t.passengers_count || 1,
      addressed_to: t.addressed_to || 'นายกเทศมนตรีเมืองทับกวาง',
      notes: t.notes || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehicle_id || !form.destination || !form.user_name) {
      alert('กรุณากรอกข้อมูลที่จำเป็น (*) ให้ครบถ้วน');
      return;
    }

    setSaving(true);
    try {
      const milIn = form.mileage_in !== '' ? Number(form.mileage_in) : null;
      const dist = (milIn && form.mileage_out) ? (milIn - form.mileage_out) : null;
      
      const payload = {
        ...form,
        mileage_in: milIn,
        distance_total: dist,
        user_department: profile?.role === 'admin' ? form.user_department : (profile?.department_id || null),
        source_department_key: '',
        approved_by: null,
        approved_at: null,
      };

      if (editingTrip) {
        await updateTripLog(editingTrip.id, payload);
      } else {
        await addTripLog(payload);
      }
      setShowForm(false);
      loadData();
    } catch (error) {
      console.error('Error saving trip log:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // Status transition actions
  const handleApprove = async (id: string) => {
    if (confirm('ยืนยันการอนุมัติคำขอใช้รถยนต์คันนี้?')) {
      await updateTripLog(id, { 
        status: 'approved',
        approved_by: profile?.full_name || profile?.email || 'ผู้อนุมัติระบบ',
        approved_at: new Date().toISOString()
      });
      loadData();
    }
  };

  const handleStartTrip = async (id: string) => {
    await updateTripLog(id, { status: 'in_use' });
    loadData();
  };

  const handleCompleteTrip = async (trip: TripLog) => {
    const defaultMIn = (trip.mileage_out || 0) + 10;
    const mileageInStr = prompt('กรุณากรอกเลขไมล์ขากลับสำนักงาน:', defaultMIn.toString());
    if (mileageInStr === null) return;
    
    const mileageIn = Number(mileageInStr);
    if (isNaN(mileageIn) || mileageIn <= (trip.mileage_out || 0)) {
      alert('กรุณากรอกเลขไมล์ขากลับให้ถูกต้องและต้องมากกว่าเลขไมล์ขาออก');
      return;
    }

    const dist = mileageIn - (trip.mileage_out || 0);

    // Update trip log
    await updateTripLog(trip.id, {
      status: 'completed',
      mileage_in: mileageIn,
      distance_total: dist,
      return_date: getTodayISO(),
      return_time: getCurrentTime(),
    });

    // Update vehicle mileage
    if (trip.vehicle_id) {
      await updateVehicle(trip.vehicle_id, { mileage_current: mileageIn });
    }

    loadData();
  };

  const handleCancelTrip = async (id: string) => {
    if (confirm('ต้องการยกเลิกคำขอใช้รถยนต์คันนี้หรือไม่?')) {
      await updateTripLog(id, { status: 'cancelled' });
      loadData();
    }
  };

  const handleOpenPrint3 = (id: string) => {
    setPrintTripId(id);
    setShowPrint3(true);
  };

  const handleOpenPrint4 = (vId: string) => {
    setPrintVehicleId(vId);
    setShowPrint4(true);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <ClipboardList size={24} />
            สมุดบันทึกและคำขอใช้รถยนต์ (แบบ ๓ และ ๔)
          </h2>
          <p className="page-subtitle">
            บันทึกการขอใช้รถยนต์ส่วนกลาง การจัดสรรคนขับรถ และการรายงานระยะทางและไมล์เดินทาง
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          บันทึกขอใช้รถยนต์ใหม่
        </button>
      </div>

      {/* Print Forms Shortcut Quick Access list */}
      {vehicles.length > 0 && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Printer size={16} />
              พิมพ์สมุดบันทึกคุมรถยนต์ประจำวัน (แบบ ๔) ตามทะเบียนรถ
            </h4>
          </div>
          <div className="card-body" style={{ padding: '12px 20px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {vehicles.map(v => (
              <button
                key={v.id}
                className="btn btn-outline"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                onClick={() => handleOpenPrint4(v.id)}
              >
                🖨️ {v.license_plate} ({v.vehicle_name})
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading" style={{ padding: '40px' }}>
          <Loader2 className="animate-spin text-primary" size={30} style={{ margin: '0 auto' }} />
          <p style={{ marginTop: '12px' }}>กำลังโหลดประวัติเดินทาง...</p>
        </div>
      ) : trips.length === 0 ? (
        <div className="card">
          <div className="card-body" style={{ padding: '48px', textAlign: 'center' }}>
            <ClipboardList size={48} style={{ color: 'var(--text-light)', marginBottom: '12px', margin: '0 auto' }} />
            <h3 style={{ color: 'var(--text-dark)' }}>ยังไม่มีประวัติการใช้ยานพาหนะ</h3>
            <p style={{ color: 'var(--text-light)', marginTop: '4px' }}>สร้างใบคำขอใช้รถและบันทึกประวัติการเดินรถคันแรกของท่านด้านบน</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {trips.map(trip => {
            const statusInfo = getTripStatus(trip.status);
            const vehicle = vehicles.find(v => v.id === trip.vehicle_id) || trip.vehicle_cars;
            const driver = drivers.find(d => d.id === trip.driver_id) || trip.vehicle_drivers;
            const dept = departments.find(d => d.id === trip.user_department);

            return (
              <div className="card" key={trip.id} style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="card-body" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    
                    <div style={{ display: 'flex', gap: '12px', flex: '1', minWidth: '280px' }}>
                      <span style={{ fontSize: '2rem', marginTop: '4px' }}>
                        {vehicle ? getVehicleTypeIcon(vehicle.vehicle_type) : '🚗'}
                      </span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                            {trip.destination}
                          </h4>
                          <span className="badge-status" style={{ color: statusInfo.color, backgroundColor: statusInfo.bgColor, fontWeight: 600 }}>
                            {statusInfo.name}
                          </span>
                        </div>
                        
                        <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-dark)' }}>
                          <strong>รถยนต์:</strong> {vehicle?.license_plate || 'ไม่ได้ระบุ'} ({vehicle?.vehicle_name || 'ไม่ได้ระบุ'})
                          <span style={{ margin: '0 8px', color: 'var(--border-color)' }}>|</span>
                          <strong>คนขับ:</strong> {driver?.name || 'ไม่มีคนขับ (ขับเอง)'}
                        </p>

                        <p style={{ margin: '2px 0 0', fontSize: '0.825rem', color: 'var(--text-light)' }}>
                          <strong>ผู้ขอใช้รถ:</strong> {trip.user_name} ({trip.user_position || 'ไม่ระบุตำแหน่ง'}) | <strong>ฝ่าย:</strong> {dept?.name || 'ไม่ระบุฝ่าย'}
                        </p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: '16px', rowGap: '4px', marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-light)' }}>
                          <span>📅 <strong>เวลาออก:</strong> {formatThaiDateShort(trip.depart_date)} {formatTime(trip.depart_time)}</span>
                          {trip.return_date && (
                            <span>🏠 <strong>เวลากลับ:</strong> {formatThaiDateShort(trip.return_date)} {formatTime(trip.return_time)}</span>
                          )}
                          <span>🔢 <strong>ไมล์ออก:</strong> {formatNumber(trip.mileage_out)} กม.</span>
                          {trip.mileage_in && (
                            <span><strong>ไมล์เข้า:</strong> {formatNumber(trip.mileage_in)} กม.</span>
                          )}
                          {trip.distance_total && (
                            <span style={{ color: 'var(--primary-dark)', fontWeight: 600 }}>📏 <strong>ระยะทาง:</strong> {formatNumber(trip.distance_total)} กม.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Operations toolbar */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                      {trip.status === 'pending' && (
                        <>
                          <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleApprove(trip.id)}>
                            <Check size={14} />
                            อนุมัติรถ
                          </button>
                          <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => handleCancelTrip(trip.id)}>
                            ยกเลิกใบคำขอ
                          </button>
                        </>
                      )}
                      
                      {trip.status === 'approved' && (
                        <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: 'var(--primary)', color: 'var(--primary)' }} onClick={() => handleStartTrip(trip.id)}>
                          <Play size={14} />
                          ออกเดินทาง
                        </button>
                      )}

                      {trip.status === 'in_use' && (
                        <button className="btn btn-success" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleCompleteTrip(trip)}>
                          <CheckCircle size={14} />
                          บันทึกขากลับถึง
                        </button>
                      )}

                      <button
                        className="btn btn-outline"
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                        onClick={() => handleOpenPrint3(trip.id)}
                        title="พิมพ์ใบขออนุญาตใช้รถยนต์ (แบบ ๓)"
                      >
                        🖨️ ใบขอใช้รถ (แบบ ๓)
                      </button>

                      <button
                        className="btn btn-outline"
                        style={{ padding: '6px' }}
                        onClick={() => handleOpenEdit(trip)}
                        title="แก้ไขข้อมูล"
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
          <div className="card" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', margin: 0 }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>{editingTrip ? 'แก้ไขบันทึกขอใช้ยานพาหนะ' : 'สร้างใบคำขอใช้ยานพาหนะใหม่'}</h3>
              <button className="btn btn-outline" style={{ border: 'none', padding: '4px' }} onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>ยานพาหนะส่วนกลาง *</label>
                    <select
                      className="select-field"
                      value={form.vehicle_id}
                      onChange={e => updateField('vehicle_id', e.target.value)}
                      required
                    >
                      <option value="">-- เลือกรถยนต์ --</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>
                          [{v.license_plate}] - {v.vehicle_name} (ไมล์ล่าสุด: {v.mileage_current} กม.)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">พนักงานขับรถปฏิบัติหน้าที่</label>
                    <select
                      className="select-field"
                      value={form.driver_id}
                      onChange={e => updateField('driver_id', e.target.value)}
                    >
                      <option value="">-- ขับขี่เอง / ไม่มีคนขับประจำ --</option>
                      {drivers.filter(d => d.status === 'active').map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>ชื่อผู้ขอเดินทาง/ใช้รถ *</label>
                    <input
                      type="text"
                      className="input-field"
                      value={form.user_name}
                      onChange={e => updateField('user_name', e.target.value)}
                      placeholder="เช่น นายมานะ เรียนดี"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">ตำแหน่งผู้ขอเดินทาง</label>
                    <input
                      type="text"
                      className="input-field"
                      value={form.user_position}
                      onChange={e => updateField('user_position', e.target.value)}
                      placeholder="เช่น นักจัดการงานทั่วไป"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">กอง/ส่วนงานผู้รับผิดชอบ</label>
                    {profile?.role === 'admin' ? (
                      <select
                        className="select-field"
                        value={form.user_department}
                        onChange={e => updateField('user_department', e.target.value)}
                      >
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        className="input-field"
                        value={departments.find(d => d.id === form.user_department)?.name || ''}
                        disabled
                        style={{ backgroundColor: 'var(--bg-light)', cursor: 'not-allowed' }}
                      />
                    )}
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>เรียน (ผู้มีอำนาจสั่งการ) *</label>
                    <input
                      type="text"
                      className="input-field"
                      value={form.addressed_to}
                      onChange={e => updateField('addressed_to', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>สถานที่ปลายทาง *</label>
                    <input
                      type="text"
                      className="input-field"
                      value={form.destination}
                      onChange={e => updateField('destination', e.target.value)}
                      placeholder="เช่น ศาลากลางจังหวัดสระบุรี, ชุมชนมิตรภาพ"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">วัตถุประสงค์เพื่อปฏิบัติงาน</label>
                    <input
                      type="text"
                      className="input-field"
                      value={form.purpose}
                      onChange={e => updateField('purpose', e.target.value)}
                      placeholder="เช่น เข้าร่วมการประชุมเตรียมแผนพัฒนาเทศบาล"
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>จำนวนผู้ร่วมเดินทาง (คน) *</label>
                    <input
                      type="number"
                      min="1"
                      className="input-field"
                      value={form.passengers_count}
                      onChange={e => updateField('passengers_count', parseInt(e.target.value) || 1)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '6px', background: 'var(--bg-light)' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>วันที่เดินทางออก *</label>
                    <input
                      type="date"
                      className="input-field"
                      value={form.depart_date}
                      onChange={e => updateField('depart_date', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>เวลาเดินทางออก *</label>
                    <TimeSelect24h
                      value={form.depart_time}
                      onChange={val => updateField('depart_time', val)}
                      required
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="form-label">วันที่เดินทางกลับ</label>
                    <input
                      type="date"
                      className="input-field"
                      value={form.return_date}
                      onChange={e => updateField('return_date', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">เวลาเดินทางกลับ</label>
                    <TimeSelect24h
                      value={form.return_time}
                      onChange={val => updateField('return_time', val)}
                      className="input-field"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">เลขไมล์ขาออก (กม.)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={form.mileage_out}
                      onChange={e => updateField('mileage_out', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="form-label">เลขไมล์ขากลับ (กม.)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={form.mileage_in}
                      onChange={e => updateField('mileage_in', e.target.value)}
                      placeholder="บันทึกเมื่อกลับถึง"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">ชื่อผู้บันทึกข้อมูล</label>
                    <input
                      type="text"
                      className="input-field"
                      value={form.recorder_name}
                      onChange={e => updateField('recorder_name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">ตำแหน่งผู้บันทึก</label>
                    <input
                      type="text"
                      className="input-field"
                      value={form.recorder_position}
                      onChange={e => updateField('recorder_position', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">สถานะคำขอ</label>
                  <select
                    className="select-field"
                    value={form.status}
                    onChange={e => updateField('status', e.target.value)}
                  >
                    <option value="pending">รอดำเนินการ (Pending)</option>
                    <option value="approved">อนุมัติใช้รถ (Approved)</option>
                    <option value="in_use">อยู่ระหว่างเดินทาง (In Use)</option>
                    <option value="completed">เสร็จสิ้น/กลับถึงแล้ว (Completed)</option>
                    <option value="cancelled">ยกเลิกรายการ (Cancelled)</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">หมายเหตุ/ข้อมูลเพิ่มเติม</label>
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
                      บันทึกรายการ
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Forms Print Overlay Components */}
      {showPrint3 && (
        <PrintForm3 tripId={printTripId} onClose={() => setShowPrint3(false)} />
      )}

      {showPrint4 && (
        <PrintForm4 vehicleId={printVehicleId} onClose={() => setShowPrint4(false)} />
      )}
    </div>
  );
}
