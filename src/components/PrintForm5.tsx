'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatThaiDate, formatTime } from '@/lib/vehicleUtils';
import { IncidentReport, Vehicle, Driver } from '@/types/vehicle_types';
import { Loader2 } from 'lucide-react';

interface PrintForm5Props {
  reportId: string;
  onClose: () => void;
}

export default function PrintForm5({ reportId, onClose }: PrintForm5Props) {
  const [report, setReport] = useState<IncidentReport | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: foundReport, error: repErr } = await supabase
          .from('vehicle_incident_reports')
          .select('*')
          .eq('id', reportId)
          .single();

        if (repErr) throw repErr;

        if (foundReport) {
          setReport(foundReport);
          
          const [vRes, dRes] = await Promise.all([
            foundReport.vehicle_id 
              ? supabase.from('vehicle_cars').select('*').eq('id', foundReport.vehicle_id).single() 
              : Promise.resolve({ data: null }),
            foundReport.driver_id 
              ? supabase.from('vehicle_drivers').select('*').eq('id', foundReport.driver_id).single() 
              : Promise.resolve({ data: null })
          ]);

          setVehicle(vRes.data);
          setDriver(dRes.data);
        }
      } catch (error) {
        console.error('Error loading print form 5 data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [reportId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading || !report || !vehicle) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'white', padding: '24px', borderRadius: '8px', textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px' }} />
          <p>กำลังโหลดข้อมูลแบบ ๕...</p>
        </div>
      </div>
    );
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
            margin: 2.5cm 2cm 2cm 2.5cm !important;
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
          <h3 style={{ margin: 0, color: 'var(--primary-dark)', fontWeight: 700 }}>🖨️ พิมพ์รายงานการสูญหาย/อุบัติเหตุ (แบบ ๕)</h3>
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
        <div style={{ padding: '48px', color: '#000', fontSize: '16px', lineHeight: '2.0', fontFamily: "'Sarabun', 'TH SarabunPSK', sans-serif" }}>
          
          <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '18px', marginBottom: '16px' }}>
            แบบ ๕
          </div>

          <div style={{ textAlign: 'right', marginBottom: '24px' }}>
            วันที่ {report.report_date ? formatThaiDate(report.report_date) : '................................................'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
            <div>
              <strong>เรื่อง:</strong> รายงานการสูญหาย/ความเสียหายยานพาหนะส่วนกลางหมายเลขทะเบียน <strong>{vehicle.license_plate}</strong>
            </div>
            <div>
              <strong>เรียน:</strong> {report.addressed_to || 'นายกเทศมนตรีเมืองทับกวาง'}
            </div>
          </div>

          <div style={{ textAlign: 'justify', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ textIndent: '48px', margin: 0 }}>
              ข้าพเจ้าขอรายงานว่า ยานพาหนะส่วนกลางหมายเลขทะเบียน <strong>{vehicle.license_plate}</strong> ประเภท <strong>{vehicle.vehicle_name}</strong> สังกัดเทศบาลเมืองทับกวาง
              ซึ่งมีพนักงานขับรถปฏิบัติหน้าที่คือ <strong>{driver?.name || 'ไม่มีคนขับประจํา'}</strong> ได้เกิดเหตุอุบัติเหตุ/ความเสียหายขึ้น เมื่อวันที่ <strong>{report.incident_date ? formatThaiDate(report.incident_date) : '-'}</strong> เวลาประมาณ <strong>{report.incident_time ? formatTime(report.incident_time) : '-'}</strong> น.
              ณ สถานที่เกิดเหตุ <strong>{report.incident_location || '-'}</strong>
            </p>

            <p style={{ margin: 0 }}>
              ก่อนเกิดเหตุ ยานพาหนะได้เดินทางออกจาก <strong>{report.route_from || 'สำนักงานเทศบาล'}</strong> มุ่งหน้าไปยัง <strong>{report.route_to || '-'}</strong>
              ความเสียหายของยานพาหนะและพัสดุ ได้รับการสรุปอาการเบื้องต้นดังนี้:
            </p>
            <div style={{ border: '1px solid black', padding: '12px 16px', background: '#fafafa', borderRadius: '4px', fontStyle: 'italic', margin: '8px 0' }}>
              {report.damage_description || 'ไม่มีรายละเอียดความเสียหายเพิ่มเติม'}
            </div>

            <h4 style={{ margin: '16px 0 4px', fontSize: '16px', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '4px' }}>ยานพาหนะคู่กรณีหรือความเสียหายของฝ่ายตรงข้าม</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
              <div><strong>ยานพาหนะ/ทรัพย์สิน:</strong> {report.opponent_vehicle || '-'}</div>
              <div><strong>เลขทะเบียนรถคู่กรณี:</strong> {report.opponent_plate || '-'}</div>
              <div><strong>ชื่อคนขับคู่กรณี:</strong> {report.opponent_driver || '-'}</div>
              <div><strong>ชื่อเจ้าของรถคู่กรณี:</strong> {report.vehicle_owner || '-'}</div>
            </div>

            {report.injured_persons && report.injured_persons.length > 0 && report.injured_persons[0]?.name && (
              <>
                <h4 style={{ margin: '16px 0 4px', fontSize: '16px', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '4px' }}>ผู้ได้รับบาดเจ็บ</h4>
                {report.injured_persons.map((p, idx) => (
                  <div key={idx} style={{ paddingLeft: '16px' }}>
                    {idx + 1}. คุณ <strong>{p.name}</strong> อายุ {p.age || '-'} ปี ที่อยู่: {p.address || '-'}
                  </div>
                ))}
              </>
            )}

            <h4 style={{ margin: '16px 0 4px', fontSize: '16px', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '4px' }}>พนักงานสอบสวนเจ้าของคดีและพยาน</h4>
            <div>
              <strong>เจ้าหน้าที่พนักงานสอบสวน:</strong> {report.investigator_name || '-'} สังกัด <strong>{report.police_station || '-'}</strong>
            </div>
            
            {report.witnesses && report.witnesses.length > 0 && report.witnesses[0]?.name && (
              <div style={{ marginTop: '8px' }}>
                <strong>พยานผู้เห็นเหตุการณ์:</strong>
                {report.witnesses.map((w, idx) => (
                  <div key={idx} style={{ paddingLeft: '16px', fontSize: '14px' }}>
                    - {w.name} อายุ {w.age || '-'} ปี ที่อยู่: {w.address || '-'}
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: '16px' }}>
              <strong>สรุปผลคดี/ความเห็นเจ้าพนักงาน:</strong> {report.case_result || 'อยู่ระหว่างการสืบสวนหาสาเหตุของพนักงานสอบสวน'}
            </div>
          </div>

          {/* Footer Signature */}
          <div style={{ marginTop: '48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div></div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0 }}>ผู้รายงานขอชี้แจง ................................................................</p>
              <p style={{ margin: '8px 0 0', fontWeight: 'bold' }}>({driver?.name || 'พนักงานขับรถ/ผู้รายงาน'})</p>
              <p style={{ margin: '8px 0 0' }}>ตำแหน่ง ........................................................................................</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
