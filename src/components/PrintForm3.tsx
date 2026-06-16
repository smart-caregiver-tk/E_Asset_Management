'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatTime } from '@/lib/vehicleUtils';
import { TripLog, Vehicle, Driver } from '@/types/vehicle_types';
import { Loader2 } from 'lucide-react';

interface PrintForm3Props {
  tripId: string;
  onClose: () => void;
}

export default function PrintForm3({ tripId, onClose }: PrintForm3Props) {
  const [trip, setTrip] = useState<TripLog | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  useEffect(() => {
    async function loadData() {
      try {
        const { data: foundTrip, error: tripErr } = await supabase
          .from('vehicle_trips')
          .select('*')
          .eq('id', tripId)
          .single();

        if (tripErr) throw tripErr;

        if (foundTrip) {
          setTrip(foundTrip);
          
          const [vRes, dRes] = await Promise.all([
            foundTrip.vehicle_id 
              ? supabase.from('vehicle_cars').select('*').eq('id', foundTrip.vehicle_id).single() 
              : Promise.resolve({ data: null }),
            foundTrip.driver_id 
              ? supabase.from('vehicle_drivers').select('*').eq('id', foundTrip.driver_id).single() 
              : Promise.resolve({ data: null })
          ]);

          setVehicle(vRes.data);
          setDriver(dRes.data);
        }
      } catch (error) {
        console.error('Error loading print form 3 data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [tripId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading || !trip) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'white', padding: '24px', borderRadius: '8px', textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px' }} />
          <p>กำลังโหลดข้อมูลแบบ ๓...</p>
        </div>
      </div>
    );
  }

  // Parse Date of Request (created_at or depart_date)
  const reqDateObj = trip.created_at ? new Date(trip.created_at) : new Date(trip.depart_date);
  const reqDay = reqDateObj.getDate();
  const reqMonth = thaiMonths[reqDateObj.getMonth()];
  const reqYear = reqDateObj.getFullYear() + 543;

  // Format Depart Date
  const depDateObj = new Date(trip.depart_date);
  const depDay = depDateObj.getDate();
  const depMonth = thaiMonths[depDateObj.getMonth()];
  const depYear = depDateObj.getFullYear() + 543;
  const depDateStr = `วันที่ ${depDay} เดือน ${depMonth} พ.ศ. ${depYear}`;

  // Format Return Date
  let retDateStr = '';
  if (trip.return_date) {
    const retDateObj = new Date(trip.return_date);
    const retDay = retDateObj.getDate();
    const retMonth = thaiMonths[retDateObj.getMonth()];
    const retYear = retDateObj.getFullYear() + 543;
    retDateStr = `วันที่ ${retDay} เดือน ${retMonth} พ.ศ. ${retYear}`;
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      {/* Dynamic Print CSS to set paper orientation and margins */}
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
            size: A4 portrait !important;
            margin: 2.5cm 2cm 2cm 2.5cm !important; /* Left/Top 2.5cm, Right/Bottom 2cm */
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

      <div className="print-vehicle-form-container" style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '800px', maxHeight: '95vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        {/* Toolbar - no print */}
        <div className="print-vehicle-form-no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
          <h3 style={{ margin: 0, color: 'var(--primary-dark)', fontWeight: 700 }}>🖨️ พิมพ์ใบขออนุญาตใช้รถ (แบบ ๓)</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handlePrint} className="btn btn-primary" style={{ padding: '6px 16px' }}>
              🖨️ สั่งพิมพ์ออกเครื่องพิมพ์
            </button>
            <button onClick={onClose} className="btn btn-outline" style={{ padding: '6px 16px' }}>
              ✕ ปิดหน้าต่าง
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div style={{ padding: '48px', color: '#000', fontSize: '16px', lineHeight: '2.0', fontFamily: "'Sarabun', 'TH SarabunPSK', sans-serif" }}>
          
          {/* Header "แบบ ๓" */}
          <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '18px', marginBottom: '16px' }}>
            แบบ ๓
          </div>

          {/* Title */}
          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '20px', marginBottom: '24px' }}>
            ใบขออนุญาตใช้ยานพาหนะส่วนกลาง/รถรับรอง
          </div>

          {/* Date of Request */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px', marginBottom: '32px', paddingRight: '16px' }}>
            <span>วันที่</span>
            <span style={{ minWidth: '40px', textAlign: 'center', borderBottom: '1px dotted black', fontWeight: 'bold', padding: '0 8px' }}>{reqDay}</span>
            <span>เดือน</span>
            <span style={{ minWidth: '120px', textAlign: 'center', borderBottom: '1px dotted black', fontWeight: 'bold', padding: '0 8px' }}>{reqMonth}</span>
            <span>พ.ศ.</span>
            <span style={{ minWidth: '60px', textAlign: 'center', borderBottom: '1px dotted black', fontWeight: 'bold', padding: '0 8px' }}>{reqYear}</span>
          </div>

          {/* Form Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'justify' }}>
            
            {/* เรียน */}
            <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
              <span style={{ whiteSpace: 'nowrap' }}>เรียน (ผู้มีอำนาจสั่งใช้ยานพาหนะส่วนกลาง/รถรับรอง)</span>
              <span style={{ flex: 1, borderBottom: '1px dotted black', padding: '0 16px', fontWeight: 'bold', minHeight: '28px' }}>
                {trip.addressed_to || 'นายกเทศมนตรีเมืองทับกวาง'}
              </span>
            </div>

            {/* ข้าพเจ้า / ตำแหน่ง */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', width: '100%', gap: '8px 0' }}>
              <span style={{ whiteSpace: 'nowrap', paddingLeft: '48px' }}>ข้าพเจ้า</span>
              <span style={{ flex: 1, minWidth: '200px', borderBottom: '1px dotted black', padding: '0 16px', fontWeight: 'bold', minHeight: '28px' }}>
                {trip.user_name}
              </span>
              <span style={{ whiteSpace: 'nowrap' }}>ตำแหน่ง</span>
              <span style={{ flex: 1, minWidth: '200px', borderBottom: '1px dotted black', padding: '0 16px', fontWeight: 'bold', minHeight: '28px' }}>
                {trip.user_position || '-'}
              </span>
            </div>

            {/* ขออนุญาตใช้ยานพาหนะส่วนกลาง/รถรับรอง (ไปที่ไหน) */}
            <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
              <span style={{ whiteSpace: 'nowrap' }}>ขออนุญาตใช้ยานพาหนะส่วนกลาง/รถรับรอง (ไปที่ไหน)</span>
              <span style={{ flex: 1, borderBottom: '1px dotted black', padding: '0 16px', fontWeight: 'bold', minHeight: '28px' }}>
                {trip.destination}
              </span>
            </div>

            {/* เพื่อ / 有นั่ง */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', width: '100%', gap: '8px 0' }}>
              <span style={{ whiteSpace: 'nowrap' }}>เพื่อ</span>
              <span style={{ flex: 1, minWidth: '300px', borderBottom: '1px dotted black', padding: '0 16px', fontWeight: 'bold', minHeight: '28px' }}>
                {trip.purpose || '-'}
              </span>
              <span style={{ whiteSpace: 'nowrap' }}>มีคนนั่ง</span>
              <span style={{ width: '80px', borderBottom: '1px dotted black', padding: '0 8px', textAlign: 'center', fontWeight: 'bold', minHeight: '28px' }}>
                {trip.passengers_count ?? 1}
              </span>
              <span style={{ whiteSpace: 'nowrap' }}>คน</span>
            </div>

            {/* ในวันที่ ... เวลา ... */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', width: '100%', gap: '8px 0' }}>
              <span style={{ whiteSpace: 'nowrap' }}>ในวันที่</span>
              <span style={{ flex: 1, minWidth: '300px', borderBottom: '1px dotted black', padding: '0 16px', fontWeight: 'bold', minHeight: '28px' }}>
                {depDateStr}
              </span>
              <span style={{ whiteSpace: 'nowrap' }}>เวลา</span>
              <span style={{ width: '140px', borderBottom: '1px dotted black', padding: '0 8px', textAlign: 'center', fontWeight: 'bold', minHeight: '28px' }}>
                {formatTime(trip.depart_time)}
              </span>
            </div>

            {/* ในวันที่ ... เวลา ... (Return Date) */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', width: '100%', gap: '8px 0' }}>
              <span style={{ whiteSpace: 'nowrap' }}>ถึงวันที่</span>
              <span style={{ flex: 1, minWidth: '300px', borderBottom: '1px dotted black', padding: '0 16px', fontWeight: 'bold', minHeight: '28px' }}>
                {retDateStr || '.........................................................................................'}
              </span>
              <span style={{ whiteSpace: 'nowrap' }}>เวลา</span>
              <span style={{ width: '140px', borderBottom: '1px dotted black', padding: '0 8px', textAlign: 'center', fontWeight: 'bold', minHeight: '28px' }}>
                {trip.return_time ? formatTime(trip.return_time) : '..................................'}
              </span>
            </div>

          </div>

          {/* Signature Block */}
          <div style={{ marginTop: '64px', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '16px' }}>
            <div></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'center' }}>
              <div>
                <p style={{ margin: 0 }}>......................................................... ผู้ขออนุญาต</p>
                <p style={{ margin: '4px 0 0', fontWeight: 'bold' }}>({trip.user_name})</p>
              </div>
              <div>
                <p style={{ margin: 0 }}>......................................................... ผู้อำนวยการส่วน/หัวหน้าฝ่าย</p>
                <p style={{ margin: '4px 0 0', color: '#555', fontSize: '14px' }} className="print-vehicle-form-no-print">หรือผู้แทนปฏิบัติการ</p>
              </div>
              <div>
                <p style={{ margin: 0 }}>................/............................................/................</p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ margin: '48px 0', borderTop: '1px dotted black', width: '100%' }}></div>

          {/* Approver Block */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
              <span style={{ whiteSpace: 'nowrap' }}>(ลงนามอนุมัติโดยผู้มีอำนาจสั่งใช้รถยนต์ส่วนกลาง)</span>
              <span style={{ flex: 1, borderBottom: '1px dotted black', padding: '0 16px', fontWeight: 'bold', minHeight: '28px' }}>
                {trip.approved_by || ''}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: '64px' }}>
              <span>............../............................................/..............</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
