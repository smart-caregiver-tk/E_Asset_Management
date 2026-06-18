'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getFuelLogs, getVehicles, addFuelLog, getTripLogs, updateVehicle } from '@/lib/vehicleService';
import { FuelLog, Vehicle, TripLog } from '@/types/vehicle_types';
import { formatCurrency, formatNumber, formatThaiDateShort, getTodayISO } from '@/lib/vehicleUtils';
import {
  Fuel,
  Plus,
  Trash2,
  Calendar,
  CreditCard,
  Loader2,
  X,
  Save,
  Building2,
  Gauge,
  ClipboardList
} from 'lucide-react';

export default function VehiclesFuelPage() {
  const { profile, selectedDeptId, departments } = useAuth();
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<TripLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    vehicle_id: '',
    trip_id: '',
    fuel_date: getTodayISO(),
    fuel_amount: '' as string | number,
    fuel_price_per_liter: '' as string | number,
    total_cost: '' as string | number,
    mileage: 0,
    fuel_station: '',
    receipt_no: '',
    notes: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [fList, vList, tList] = await Promise.all([
        getFuelLogs(selectedDeptId),
        getVehicles(selectedDeptId),
        getTripLogs(selectedDeptId),
      ]);
      setLogs(fList);
      setVehicles(vList);
      setTrips(tList);
    } catch (error) {
      console.error('Error loading fuel logs:', error);
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

  // Auto-fill mileage when vehicle changes in form
  useEffect(() => {
    if (form.vehicle_id) {
      const v = vehicles.find(item => item.id === form.vehicle_id);
      if (v) {
        setForm(prev => ({ ...prev, mileage: v.mileage_current }));
      }
    }
  }, [form.vehicle_id, vehicles]);

  // Recalculate total cost when fuel amount or price changes
  const handleFuelCalc = (amount: string | number, price: string | number) => {
    const amt = parseFloat(amount.toString());
    const prc = parseFloat(price.toString());
    if (!isNaN(amt) && !isNaN(prc)) {
      updateField('total_cost', parseFloat((amt * prc).toFixed(2)));
    }
  };

  const handleOpenAdd = () => {
    setForm({
      vehicle_id: vehicles[0]?.id || '',
      trip_id: '',
      fuel_date: getTodayISO(),
      fuel_amount: '',
      fuel_price_per_liter: '',
      total_cost: '',
      mileage: vehicles[0]?.mileage_current || 0,
      fuel_station: '',
      receipt_no: '',
      notes: '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehicle_id || !form.fuel_amount || !form.total_cost || !form.mileage) {
      alert('กรุณากรอกข้อมูลที่จำเป็น (*) ให้ครบถ้วน');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        trip_id: form.trip_id || null,
        fuel_amount: Number(form.fuel_amount),
        fuel_price_per_liter: Number(form.fuel_price_per_liter) || 0,
        total_cost: Number(form.total_cost),
      };

      await addFuelLog(payload);
      
      // Auto update vehicle current mileage if greater
      const v = vehicles.find(item => item.id === form.vehicle_id);
      if (v && form.mileage > v.mileage_current) {
        await updateVehicle(v.id, { mileage_current: form.mileage });
      }

      setShowForm(false);
      loadData();
    } catch (error) {
      console.error('Error saving fuel log:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const totalFuelCost = logs.reduce((sum, item) => sum + (Number(item.total_cost) || 0), 0);
  const totalLiters = logs.reduce((sum, item) => sum + (Number(item.fuel_amount) || 0), 0);
  const averagePrice = totalLiters > 0 ? (totalFuelCost / totalLiters) : 0;

  // Filter trips for the selected vehicle for refueling link
  const vehicleTrips = trips.filter(t => t.vehicle_id === form.vehicle_id);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <Fuel size={24} />
            บันทึกประวัติการเติมน้ำมันเชื้อเพลิง
          </h2>
          <p className="page-subtitle">
            บันทึกข้อมูลการจัดซื้อน้ำมันเชื้อเพลิงของยานพาหนะ เลขไมล์เติมน้ำมัน และใบเสร็จเบิกจ่ายค่าน้ำมัน
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          บันทึกการเติมน้ำมันใหม่
        </button>
      </div>

      {/* Quick Statistics Summary Card */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-icon green">
            <CreditCard size={24} />
          </div>
          <div>
            <div className="stat-value">{formatCurrency(totalFuelCost)}</div>
            <div className="stat-label">ค่าน้ำมันสะสมทั้งหมด (บาท)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <Fuel size={24} />
          </div>
          <div>
            <div className="stat-value">{formatNumber(totalLiters)} ลิตร</div>
            <div className="stat-label">ปริมาณน้ำมันรวม</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">
            <Gauge size={24} />
          </div>
          <div>
            <div className="stat-value">{formatCurrency(averagePrice)}</div>
            <div className="stat-label">ราคาน้ำมันเฉลี่ยต่อลิตร</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading" style={{ padding: '40px' }}>
          <Loader2 className="animate-spin text-primary" size={30} style={{ margin: '0 auto' }} />
          <p style={{ marginTop: '12px' }}>กำลังโหลดบันทึกการเติมน้ำมัน...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="card">
          <div className="card-body" style={{ padding: '48px', textAlign: 'center' }}>
            <Fuel size={48} style={{ color: 'var(--text-light)', marginBottom: '12px', margin: '0 auto' }} />
            <h3 style={{ color: 'var(--text-dark)' }}>ไม่มีบันทึกประวัติการเติมน้ำมัน</h3>
            <p style={{ color: 'var(--text-light)', marginTop: '4px' }}>สร้างรายการเติมน้ํามันและบันทึกใบเสร็จรายการแรกด้านบน</p>
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
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)', fontSize: '1.2rem' }}>
                        ⛽
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                          เติมน้ำมัน {formatNumber(log.fuel_amount)} ลิตร @ {formatCurrency(Number(log.fuel_price_per_liter))} บาท/ลิตร
                        </h4>
                        
                        <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-dark)' }}>
                          <strong>ทะเบียนรถ:</strong> {vehicle?.license_plate || 'ไม่ระบุ'} ({vehicle?.vehicle_name || 'ไม่ระบุ'})
                          <span style={{ margin: '0 8px', color: 'var(--border-color)' }}>|</span>
                          <strong>สถานีบริการ:</strong> {log.fuel_station || 'ไม่ระบุ'}
                        </p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: '16px', rowGap: '4px', marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-light)' }}>
                          <span>📅 <strong>วันที่เติม:</strong> {formatThaiDateShort(log.fuel_date)}</span>
                          <span>🔢 <strong>เลขไมล์ขณะเติม:</strong> {formatNumber(log.mileage)} กม.</span>
                          {log.receipt_no && (
                            <span>🧾 <strong>ใบเสร็จเลขที่:</strong> {log.receipt_no}</span>
                          )}
                          <span style={{ color: 'var(--primary-dark)', fontWeight: 600 }}>💰 <strong>รวมจ่าย:</strong> {formatCurrency(Number(log.total_cost))} บาท</span>
                        </div>

                        {log.notes && (
                          <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                            * {log.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
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
              <h3>⛽ บันทึกใบเสร็จค่าน้ำมันเชื้อเพลิง</h3>
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
                        [{v.license_plate}] - {v.vehicle_name} (ไมล์ล่าสุด: {v.mileage_current} กม.)
                      </option>
                    ))}
                  </select>
                </div>

                {vehicleTrips.length > 0 && (
                  <div>
                    <label className="form-label">เชื่อมโยงกับใบงานเดินทาง (ถ้ามี)</label>
                    <select
                      className="select-field"
                      value={form.trip_id}
                      onChange={e => updateField('trip_id', e.target.value)}
                    >
                      <option value="">-- ไม่เชื่อมโยง (เติมแยกพิเศษ) --</option>
                      {vehicleTrips.slice(0, 10).map(t => (
                        <option key={t.id} value={t.id}>
                          {t.destination} ({t.depart_date} {t.depart_time}) - โดย {t.user_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>วันที่เติมน้ำมัน *</label>
                    <input
                      type="date"
                      className="input-field"
                      value={form.fuel_date}
                      onChange={e => updateField('fuel_date', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>เลขไมล์เมื่อเติมน้ำมัน (กม.) *</label>
                    <input
                      type="number"
                      className="input-field"
                      value={form.mileage}
                      onChange={e => updateField('mileage', parseInt(e.target.value) || 0)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>ปริมาณน้ำมัน (ลิตร) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input-field"
                      placeholder="0.00"
                      value={form.fuel_amount}
                      onChange={e => {
                        const val = e.target.value;
                        updateField('fuel_amount', val);
                        handleFuelCalc(val, form.fuel_price_per_liter);
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">ราคาต่อลิตร (บาท)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input-field"
                      placeholder="0.00"
                      value={form.fuel_price_per_liter}
                      onChange={e => {
                        const val = e.target.value;
                        updateField('fuel_price_per_liter', val);
                        handleFuelCalc(form.fuel_amount, val);
                      }}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>รวมเงินทั้งหมด (บาท) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input-field"
                      placeholder="0.00"
                      value={form.total_cost}
                      onChange={e => updateField('total_cost', parseFloat(e.target.value) || '')}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">สถานีบริการน้ำมัน (ปั๊ม)</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="เช่น ปตท. ทับกวาง"
                      value={form.fuel_station}
                      onChange={e => updateField('fuel_station', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">เลขที่ใบเสร็จรับเงิน/ใบกำกับภาษี</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="เลขที่ใบเสร็จ"
                      value={form.receipt_no}
                      onChange={e => updateField('receipt_no', e.target.value)}
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
                      บันทึกค่าน้ำมัน
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
