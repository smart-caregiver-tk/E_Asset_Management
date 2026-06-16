'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatThaiDate, formatTime, formatNumber } from '@/lib/vehicleUtils';
import { TripLog, Vehicle, Driver } from '@/types/vehicle_types';
import { Loader2 } from 'lucide-react';

interface PrintForm4Props {
  vehicleId: string;
  onClose: () => void;
}

export default function PrintForm4({ vehicleId, onClose }: PrintForm4Props) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [trips, setTrips] = useState<TripLog[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [vRes, tRes, dRes] = await Promise.all([
          supabase.from('vehicle_cars').select('*').eq('id', vehicleId).single(),
          supabase.from('vehicle_trips').select('*').eq('vehicle_id', vehicleId).order('depart_date', { ascending: true }),
          supabase.from('vehicle_drivers').select('*')
        ]);

        if (vRes.error) throw vRes.error;
        
        setVehicle(vRes.data);
        setTrips(tRes.data || []);
        setDrivers(dRes.data || []);
      } catch (error) {
        console.error('Error loading print form 4 data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [vehicleId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading || !vehicle) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'white', padding: '24px', borderRadius: '8px', textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px' }} />
          <p>กำลังโหลดข้อมูลแบบ ๔...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      {/* Dynamic Print CSS to set paper landscape orientation and margin */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body > *:not(.print-vehicle-form-container) {
            display: none !important;
          }
          html, body {
            background: white !important;
            color: black !important;
            height: auto !important;
            overflow: visible !important;
          }
          @page {
            size: A4 landscape !important;
            margin: 1.5cm !important;
          }
          .print-vehicle-form-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: transparent !important;
            display: block !important;
          }
          .print-vehicle-form-no-print {
            display: none !important;
          }
        }
      `}} />

      <div className="print-vehicle-form-container" style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '1100px', maxHeight: '95vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        {/* Toolbar - no print */}
        <div className="print-vehicle-form-no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
          <h3 style={{ margin: 0, color: 'var(--primary-dark)', fontWeight: 700 }}>🖨️ บันทึกการเดินทางใช้รถยนต์ (แบบ ๔) — ทะเบียน {vehicle.license_plate}</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handlePrint} className="btn btn-primary" style={{ padding: '6px 16px' }}>
              🖨️ สั่งพิมพ์ออกเครื่องพิมพ์
            </button>
            <button onClick={onClose} className="btn btn-outline" style={{ padding: '6px 16px' }}>
              ✕ ปิดหน้าต่าง
            </button>
          </div>
        </div>

        {/* Print Content */}
        <div style={{ padding: '32px', color: '#000', fontFamily: "'Sarabun', 'TH SarabunPSK', sans-serif" }}>
          {/* Header */}
          <div style={{ textAlign: 'right', marginBottom: '4px', fontWeight: 'bold' }}>
            แบบ ๔
          </div>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px' }}>บันทึกการใช้ยานพาหนะส่วนกลาง/รถรับรอง</h2>
            <p style={{ margin: 0 }}>หมายเลขทะเบียน <strong>{vehicle.license_plate}</strong> ยี่ห้อ <strong>{vehicle.brand || '-'} {vehicle.model || ''}</strong></p>
          </div>

          {/* Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: '1px solid black' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th rowSpan={2} style={{ border: '1px solid black', padding: '6px', textAlign: 'center', verticalAlign: 'middle', width: '40px' }}>
                  ลำดับ
                </th>
                <th colSpan={2} style={{ border: '1px solid black', padding: '6px', textAlign: 'center' }}>
                  ออกเดินทาง
                </th>
                <th rowSpan={2} style={{ border: '1px solid black', padding: '6px', textAlign: 'center', verticalAlign: 'middle' }}>
                  ผู้ใช้ยานพาหนะ
                </th>
                <th rowSpan={2} style={{ border: '1px solid black', padding: '6px', textAlign: 'center', verticalAlign: 'middle' }}>
                  สถานที่ไป
                </th>
                <th rowSpan={2} style={{ border: '1px solid black', padding: '6px', textAlign: 'center', verticalAlign: 'middle', width: '80px' }}>
                  เลขไมล์ออก
                </th>
                <th colSpan={2} style={{ border: '1px solid black', padding: '6px', textAlign: 'center' }}>
                  กลับถึงสำนักงาน
                </th>
                <th rowSpan={2} style={{ border: '1px solid black', padding: '6px', textAlign: 'center', verticalAlign: 'middle', width: '80px' }}>
                  เลขไมล์กลับ
                </th>
                <th rowSpan={2} style={{ border: '1px solid black', padding: '6px', textAlign: 'center', verticalAlign: 'middle', width: '60px' }}>
                  รวมระยะทาง (กม.)
                </th>
                <th rowSpan={2} style={{ border: '1px solid black', padding: '6px', textAlign: 'center', verticalAlign: 'middle' }}>
                  พนักงานขับรถ
                </th>
                <th rowSpan={2} style={{ border: '1px solid black', padding: '6px', textAlign: 'center', verticalAlign: 'middle' }}>
                  หมายเหตุ
                </th>
              </tr>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ border: '1px solid black', padding: '6px', textAlign: 'center', width: '75px' }}>วันที่</th>
                <th style={{ border: '1px solid black', padding: '6px', textAlign: 'center', width: '50px' }}>เวลา</th>
                <th style={{ border: '1px solid black', padding: '6px', textAlign: 'center', width: '75px' }}>วันที่</th>
                <th style={{ border: '1px solid black', padding: '6px', textAlign: 'center', width: '50px' }}>เวลา</th>
              </tr>
            </thead>
            <tbody>
              {trips.length === 0 ? (
                // Empty rows for blank form
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    <td style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ border: '1px solid black', padding: '8px' }}>&nbsp;</td>
                    <td style={{ border: '1px solid black', padding: '8px' }}>&nbsp;</td>
                    <td style={{ border: '1px solid black', padding: '8px' }}>&nbsp;</td>
                    <td style={{ border: '1px solid black', padding: '8px' }}>&nbsp;</td>
                    <td style={{ border: '1px solid black', padding: '8px' }}>&nbsp;</td>
                    <td style={{ border: '1px solid black', padding: '8px' }}>&nbsp;</td>
                    <td style={{ border: '1px solid black', padding: '8px' }}>&nbsp;</td>
                    <td style={{ border: '1px solid black', padding: '8px' }}>&nbsp;</td>
                    <td style={{ border: '1px solid black', padding: '8px' }}>&nbsp;</td>
                    <td style={{ border: '1px solid black', padding: '8px' }}>&nbsp;</td>
                    <td style={{ border: '1px solid black', padding: '8px' }}>&nbsp;</td>
                  </tr>
                ))
              ) : (
                trips.map((trip, i) => {
                  const driver = drivers.find(d => d.id === trip.driver_id);
                  return (
                    <tr key={trip.id}>
                      <td style={{ border: '1px solid black', padding: '6px', textAlign: 'center' }}>{i + 1}</td>
                      <td style={{ border: '1px solid black', padding: '6px', textAlign: 'center' }}>{formatThaiDate(trip.depart_date)}</td>
                      <td style={{ border: '1px solid black', padding: '6px', textAlign: 'center' }}>{formatTime(trip.depart_time)}</td>
                      <td style={{ border: '1px solid black', padding: '6px' }}>{trip.user_name}</td>
                      <td style={{ border: '1px solid black', padding: '6px' }}>{trip.destination}</td>
                      <td style={{ border: '1px solid black', padding: '6px', textAlign: 'center' }}>{formatNumber(trip.mileage_out)}</td>
                      <td style={{ border: '1px solid black', padding: '6px', textAlign: 'center' }}>{trip.return_date ? formatThaiDate(trip.return_date) : ''}</td>
                      <td style={{ border: '1px solid black', padding: '6px', textAlign: 'center' }}>{trip.return_time ? formatTime(trip.return_time) : ''}</td>
                      <td style={{ border: '1px solid black', padding: '6px', textAlign: 'center' }}>{trip.mileage_in ? formatNumber(trip.mileage_in) : ''}</td>
                      <td style={{ border: '1px solid black', padding: '6px', textAlign: 'center' }}>{trip.distance_total ? formatNumber(trip.distance_total) : ''}</td>
                      <td style={{ border: '1px solid black', padding: '6px' }}>{driver?.name || ''}</td>
                      <td style={{ border: '1px solid black', padding: '6px' }}>{trip.notes}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Footer */}
          <div style={{ marginTop: '32px', textAlign: 'right', paddingRight: '32px' }}>
            <p style={{ margin: 0 }}>ผู้บันทึกประวัติการใช้ยานพาหนะ ................................................................</p>
            <p style={{ margin: '8px 0 0' }}>ตำแหน่ง ........................................................................................</p>
          </div>
        </div>
      </div>
    </div>
  );
}
