'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatThaiDate, formatCurrency, formatNumber } from '@/lib/vehicleUtils';
import { MaintenanceLog, Vehicle } from '@/types/vehicle_types';
import { Loader2 } from 'lucide-react';

interface PrintForm6Props {
  vehicleId: string;
  onClose: () => void;
}

export default function PrintForm6({ vehicleId, onClose }: PrintForm6Props) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [vRes, lRes] = await Promise.all([
          supabase.from('vehicle_cars').select('*').eq('id', vehicleId).single(),
          supabase.from('vehicle_maintenance_logs').select('*').eq('vehicle_id', vehicleId).order('received_date', { ascending: true })
        ]);

        if (vRes.error) throw vRes.error;

        setVehicle(vRes.data);
        setLogs(lRes.data || []);
      } catch (error) {
        console.error('Error loading print form 6 data:', error);
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
          <p>กำลังโหลดข้อมูลแบบ ๖...</p>
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
          <h3 style={{ margin: 0, color: 'var(--primary-dark)', fontWeight: 700 }}>🖨️ พิมพ์รายละเอียดการซ่อมบำรุง (แบบ ๖)</h3>
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
            แบบ ๖
          </div>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px' }}>รายละเอียดการซ่อมบำรุงรักษาพัสดุประเภทครุภัณฑ์ยานพาหนะและขนส่ง</h2>
            <p style={{ margin: 0 }}>ยานพาหนะ <strong>{vehicle.vehicle_name}</strong> หมายเลขทะเบียน <strong>{vehicle.license_plate}</strong></p>
          </div>

          {/* Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: '1px solid black' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ border: '1px solid black', padding: '8px', textAlign: 'center', width: '50px' }}>ลำดับที่</th>
                <th style={{ border: '1px solid black', padding: '8px', textAlign: 'center', width: '120px' }}>เลขระยะทางเมื่อเข้าซ่อม</th>
                <th style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>รายการซ่อมบำรุง</th>
                <th style={{ border: '1px solid black', padding: '8px', textAlign: 'center', width: '120px' }}>จำนวนเงิน (บาท)</th>
                <th style={{ border: '1px solid black', padding: '8px', textAlign: 'center', width: '180px' }}>สถานที่ซ่อมบำรุง</th>
                <th style={{ border: '1px solid black', padding: '8px', textAlign: 'center', width: '100px' }}>วันตรวจรับ</th>
                <th style={{ border: '1px solid black', padding: '8px', textAlign: 'center', width: '120px' }}>หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    <td style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ border: '1px solid black', padding: '8px' }}>&nbsp;</td>
                    <td style={{ border: '1px solid black', padding: '8px' }}>&nbsp;</td>
                    <td style={{ border: '1px solid black', padding: '8px' }}>&nbsp;</td>
                    <td style={{ border: '1px solid black', padding: '8px' }}>&nbsp;</td>
                    <td style={{ border: '1px solid black', padding: '8px' }}>&nbsp;</td>
                    <td style={{ border: '1px solid black', padding: '8px' }}>&nbsp;</td>
                  </tr>
                ))
              ) : (
                logs.map((log, i) => (
                  <tr key={log.id}>
                    <td style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>{formatNumber(log.mileage_at_repair)}</td>
                    <td style={{ border: '1px solid black', padding: '8px' }}>{log.repair_items}</td>
                    <td style={{ border: '1px solid black', padding: '8px', textAlign: 'right' }}>{formatCurrency(Number(log.cost))}</td>
                    <td style={{ border: '1px solid black', padding: '8px' }}>{log.repair_shop || '-'}</td>
                    <td style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>{log.received_date ? formatThaiDate(log.received_date) : '-'}</td>
                    <td style={{ border: '1px solid black', padding: '8px' }}>{log.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Footer */}
          <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px', fontSize: '14px' }}>
            <div></div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0 }}>ผู้ตรวจสอบตรวจรับ ................................................................</p>
              <p style={{ margin: '8px 0 0' }}>ตำแหน่ง ........................................................................................</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
