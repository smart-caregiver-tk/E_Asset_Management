'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getIncidentReports, getVehicles, getDrivers, addIncidentReport } from '@/lib/vehicleService';
import { IncidentReport, Vehicle, Driver } from '@/types/vehicle_types';
import { getVehicleTypeIcon, formatThaiDate, formatThaiDateShort, formatTime } from '@/lib/vehicleUtils';
import PrintForm5 from '@/components/PrintForm5';
import {
  AlertTriangle,
  Plus,
  Trash2,
  Printer,
  Calendar,
  MapPin,
  Clock,
  Loader2,
  X,
  Save,
  Building2,
  User,
  Info
} from 'lucide-react';

export default function VehiclesIncidentsPage() {
  const { profile, selectedDeptId, departments } = useAuth();
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  // Form & Print states
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPrintId, setShowPrintId] = useState<string | null>(null);

  const [form, setForm] = useState({
    vehicle_id: '',
    driver_id: '',
    report_date: new Date().toISOString().split('T')[0],
    license_plate_ref: '',
    addressed_to: 'นายกเทศมนตรีเมืองทับกวาง',
    incident_date: new Date().toISOString().split('T')[0],
    incident_time: '12:00',
    incident_location: '',
    speed_kmh: '' as string | number,
    route_from: '',
    route_to: '',
    damage_description: '',
    opponent_vehicle: '',
    opponent_plate: '',
    opponent_driver: '',
    opponent_age: '' as string | number,
    opponent_license_no: '',
    opponent_address: '',
    vehicle_owner: '',
    opponent_cause: '',
    opponent_damage: '',
    investigator_name: '',
    police_station: '',
    case_result: '',
    notes: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [rList, vList, dList] = await Promise.all([
        getIncidentReports(selectedDeptId),
        getVehicles(selectedDeptId),
        getDrivers(selectedDeptId),
      ]);
      setReports(rList);
      setVehicles(vList);
      setDrivers(dList);
    } catch (error) {
      console.error('Error loading incident reports:', error);
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
    if (vehicles.length > 0 && !form.vehicle_id && showForm) {
      setForm(prev => ({ ...prev, vehicle_id: vehicles[0].id }));
    }
  }, [vehicles, showForm, form.vehicle_id]);

  useEffect(() => {
    if (drivers.length > 0 && !form.driver_id && showForm) {
      setForm(prev => ({ ...prev, driver_id: drivers[0].id }));
    }
  }, [drivers, showForm, form.driver_id]);

  const handleOpenAdd = () => {
    setForm({
      vehicle_id: vehicles[0]?.id || '',
      driver_id: drivers[0]?.id || '',
      report_date: new Date().toISOString().split('T')[0],
      license_plate_ref: '',
      addressed_to: 'นายกเทศมนตรีเมืองทับกวาง',
      incident_date: new Date().toISOString().split('T')[0],
      incident_time: '12:00',
      incident_location: '',
      speed_kmh: '',
      route_from: '',
      route_to: '',
      damage_description: '',
      opponent_vehicle: '',
      opponent_plate: '',
      opponent_driver: '',
      opponent_age: '',
      opponent_license_no: '',
      opponent_address: '',
      vehicle_owner: '',
      opponent_cause: '',
      opponent_damage: '',
      investigator_name: '',
      police_station: '',
      case_result: '',
      notes: '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehicle_id || !form.damage_description) {
      alert('กรุณากรอกข้อมูลยานพาหนะและรายละเอียดความเสียหาย/อุบัติเหตุ');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        speed_kmh: form.speed_kmh !== '' ? Number(form.speed_kmh) : null,
        opponent_age: form.opponent_age !== '' ? Number(form.opponent_age) : null,
        injured_persons: [],
        witnesses: []
      };

      await addIncidentReport(payload);
      setShowForm(false);
      loadData();
    } catch (error) {
      console.error('Error saving incident report:', error);
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
            <AlertTriangle size={24} />
            รายงานอุบัติเหตุและความเสียหายยานพาหนะ (แบบ ๕)
          </h2>
          <p className="page-subtitle">
            บันทึกรายงานการเฉี่ยวชน ความชำรุดเสียหายจากภัยธรรมชาติ และการบันทึกคดีความฝ่ายคู่กรณี
          </p>
        </div>
        <button className="btn btn-primary" style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={handleOpenAdd}>
          <Plus size={18} />
          รายงานอุบัติเหตุใหม่
        </button>
      </div>

      {loading ? (
        <div className="loading" style={{ padding: '40px' }}>
          <Loader2 className="animate-spin text-primary" size={30} style={{ margin: '0 auto' }} />
          <p style={{ marginTop: '12px' }}>กำลังโหลดรายงานอุบัติเหตุ...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="card">
          <div className="card-body" style={{ padding: '48px', textAlign: 'center' }}>
            <AlertTriangle size={48} style={{ color: 'var(--text-light)', marginBottom: '12px', margin: '0 auto' }} />
            <h3 style={{ color: 'var(--text-dark)' }}>ไม่มีบันทึกรายงานอุบัติเหตุ</h3>
            <p style={{ color: 'var(--text-light)', marginTop: '4px' }}>ประวัติการเดินรถทุกคันอยู่ในสถานะปกติและปลอดภัย 100%</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {reports.map(report => {
            const vehicle = vehicles.find(v => v.id === report.vehicle_id) || report.vehicle_cars;
            const driver = drivers.find(d => d.id === report.driver_id) || report.vehicle_drivers;

            return (
              <div className="card" key={report.id} style={{ display: 'flex', flexDirection: 'column', borderLeft: '4px solid var(--danger)' }}>
                <div className="card-body" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '12px', flex: '1', minWidth: '280px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--danger-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)', fontSize: '1.2rem' }}>
                        ⚠️
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                          {report.damage_description}
                        </h4>
                        
                        <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-dark)' }}>
                          <strong>ทะเบียนรถ:</strong> {vehicle?.license_plate || 'ไม่ระบุ'} ({vehicle?.vehicle_name || 'ไม่ระบุ'})
                          <span style={{ margin: '0 8px', color: 'var(--border-color)' }}>|</span>
                          <strong>ผู้ขับขี่ขณะเกิดเหตุ:</strong> {driver?.name || 'ไม่ระบุ'}
                        </p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: '16px', rowGap: '4px', marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-light)' }}>
                          <span>📅 <strong>วันเวลาเกิดเหตุ:</strong> {formatThaiDateShort(report.incident_date)} เวลา {formatTime(report.incident_time)}</span>
                          <span>📍 <strong>สถานที่เกิดเหตุ:</strong> {report.incident_location || '-'}</span>
                          {report.opponent_vehicle && (
                            <span style={{ color: 'var(--danger)', fontWeight: 600 }}>🚗 <strong>คู่กรณี:</strong> {report.opponent_vehicle} ({report.opponent_plate || 'ไม่ทราบทะเบียน'})</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                        onClick={() => setShowPrintId(report.id)}
                        title="พิมพ์ใบรายงานอุบัติเหตุ (แบบ ๕)"
                      >
                        🖨️ พิมพ์แบบ ๕
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
              <h3>⚠️ บันทึกรายงานอุบัติเหตุ/ความเสียหายยานพาหนะ (แบบ ๕)</h3>
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
                          [{v.license_plate}] - {v.vehicle_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">ผู้ขับขี่ขณะเกิดเหตุ</label>
                    <select
                      className="select-field"
                      value={form.driver_id}
                      onChange={e => updateField('driver_id', e.target.value)}
                    >
                      <option value="">-- ขับขี่เอง / ไม่มีในระบบคนขับ --</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">วันที่เกิดอุบัติเหตุ</label>
                    <input
                      type="date"
                      className="input-field"
                      value={form.incident_date}
                      onChange={e => updateField('incident_date', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">เวลาที่เกิดอุบัติเหตุ</label>
                    <input
                      type="time"
                      className="input-field"
                      value={form.incident_time}
                      onChange={e => updateField('incident_time', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">ความเร็วรถโดยประมาณ (กม/ชม)</label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="กิโลเมตรต่อชั่วโมง"
                      value={form.speed_kmh}
                      onChange={e => updateField('speed_kmh', e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">ต้นทางออกเดินทาง</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="เช่น สำนักงานเทศบาล"
                      value={form.route_from}
                      onChange={e => updateField('route_from', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">ปลายทางที่กำลังจะไป</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="เช่น ชุมชนเขาน้อย"
                      value={form.route_to}
                      onChange={e => updateField('route_to', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">สถานที่เกิดเหตุอย่างละเอียด</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="ถนน กม.ที่ แยกจุดอ้างอิง..."
                    value={form.incident_location}
                    onChange={e => updateField('incident_location', e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 600 }}>รายละเอียดอาการความเสียหายพัสดุ/ครุภัณฑ์ *</label>
                  <textarea
                    className="input-field"
                    rows={3}
                    placeholder="บรรยายลักษณะการเฉี่ยวชน อุปกรณ์ที่แตกหัก หรือรอยบุบกระแทก..."
                    value={form.damage_description}
                    onChange={e => updateField('damage_description', e.target.value)}
                    required
                  />
                </div>

                <div style={{ border: '1px solid var(--border-color)', padding: '12px', borderRadius: '6px', background: 'var(--bg-light)' }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', color: 'var(--danger)', fontWeight: 600 }}>รายละเอียดฝ่ายคู่กรณี (ถ้ามี)</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="form-label">ประเภทยานพาหนะคู่กรณี</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="เช่น รถกระบะ Isuzu, เสาไฟฟ้า"
                        value={form.opponent_vehicle}
                        onChange={e => updateField('opponent_vehicle', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label">ทะเบียนคู่กรณี</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="ทะเบียนรถคู่กรณี"
                        value={form.opponent_plate}
                        onChange={e => updateField('opponent_plate', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label">ชื่อผู้ขับขี่คู่กรณี</label>
                      <input
                        type="text"
                        className="input-field"
                        value={form.opponent_driver}
                        onChange={e => updateField('opponent_driver', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label">เจ้าของยานพาหนะคู่กรณี</label>
                      <input
                        type="text"
                        className="input-field"
                        value={form.vehicle_owner}
                        onChange={e => updateField('vehicle_owner', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">เจ้าพนักงานสอบสวนคดี</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="ยศ. ชื่อ-นามสกุล"
                      value={form.investigator_name}
                      onChange={e => updateField('investigator_name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">สถานีตำรวจท้องที่เกิดเหตุ</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="สภ.เมือง..."
                      value={form.police_station}
                      onChange={e => updateField('police_station', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">สรุปผลคดี/ผลสำนวนตำรวจ</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="เช่น เปรียบเทียบปรับยอมรับความผิดร่วม หรือ คู่กรณีเป็นฝ่ายประมาท"
                    value={form.case_result}
                    onChange={e => updateField('case_result', e.target.value)}
                  />
                </div>
              </div>

              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      บันทึกรายงานอุบัติเหตุ
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Overlay Component */}
      {showPrintId && (
        <PrintForm5 reportId={showPrintId} onClose={() => setShowPrintId(null)} />
      )}
    </div>
  );
}
