'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Construction, ConstructionRepair } from '@/types/database';
import { Loader2 } from 'lucide-react';

export default function PrintConstructionPage() {
  const params = useParams();
  const id = params?.id as string;

  const [data, setData] = useState<Construction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchRecord = async () => {
      try {
        const { data: record, error } = await supabase
          .from('constructions')
          .select('*, construction_repairs(*), departments(*)')
          .eq('id', id)
          .single();

        if (error) throw error;
        setData(record);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecord();
  }, [id]);

  useEffect(() => {
    if (!loading && data) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [loading, data]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Loader2 className="animate-spin" size={32} /></div>;
  }

  if (!data) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>ไม่พบข้อมูล</div>;
  }

  // Helper for Date formatting
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getDate()} ${['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'][date.getMonth()]} ${date.getFullYear() + 543}`;
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @page { size: A4 landscape; margin: 15mm; }
        body { background: #fff; font-family: 'Sarabun', 'Noto Sans Thai', sans-serif; font-size: 14px; color: #000; }
        .print-container { width: 100%; max-width: 297mm; margin: 0 auto; }
        .form-header { text-align: center; font-weight: bold; font-size: 18px; margin-bottom: 20px; position: relative; }
        .doc-code { position: absolute; right: 0; top: 0; font-size: 14px; border: 1px solid #000; padding: 4px 8px; }
        
        .form-row { display: flex; align-items: baseline; margin-bottom: 8px; gap: 8px; }
        .form-label { font-weight: bold; white-space: nowrap; }
        .form-value { flex: 1; border-bottom: 1px dotted #000; padding-bottom: 2px; }
        .form-value-inline { border-bottom: 1px dotted #000; padding: 0 10px; display: inline-block; }
        
        table.form-table { width: 100%; border-collapse: collapse; margin-top: 10px; border: 1px solid #000; }
        table.form-table th, table.form-table td { border: 1px solid #000; padding: 8px; text-align: center; vertical-align: top; }
        table.form-table th { background-color: #f8f8f8; font-weight: bold; }
        
        .page-break { page-break-before: always; }
        
        /* Hide UI elements during print */
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}} />

      <div className="print-container">
        <div className="no-print" style={{ textAlign: 'center', marginBottom: '20px' }}>
          <button onClick={() => window.print()} style={{ padding: '8px 16px', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>พิมพ์เอกสาร</button>
        </div>

        {/* ===================== หน้าที่ 1 (ข้อมูลหลัก) ===================== */}
        <div style={{ position: 'relative' }}>
          <div className="doc-code">พ.ด. ๑</div>
          <div className="form-header">ทะเบียนพัสดุที่ดินและสิ่งก่อสร้าง</div>
          
          <div className="form-row" style={{ marginTop: '30px' }}>
            <span className="form-label">ประเภท:</span> <span className="form-value-inline" style={{ width: '150px', textAlign: 'center' }}>{data.construction_type}</span>
            <span className="form-label">สำนัก/กอง:</span> <span className="form-value-inline" style={{ width: '250px', textAlign: 'center' }}>{(data as any).departments?.name || '-'}</span>
            <div style={{ flex: 1 }}></div>
            <span className="form-label">เลขรหัสพัสดุ:</span> <span className="form-value-inline" style={{ width: '150px', textAlign: 'center', fontWeight: 'bold' }}>{data.registry_code}</span>
          </div>

          <table className="form-table" style={{ marginTop: '20px' }}>
            <tbody>
              <tr>
                <td colSpan={2} style={{ width: '50%', textAlign: 'left' }}>
                  <div className="form-row">
                    <span className="form-label">ชื่อพัสดุ:</span> <span className="form-value">{data.name}</span>
                  </div>
                  <div className="form-row">
                    <span className="form-label">ที่ตั้งพัสดุ:</span> <span className="form-value">{data.location || '-'}</span>
                  </div>
                  <div className="form-row">
                    <span className="form-label">ซื้อ/จ้าง/ได้มา เมื่อวันที่:</span> <span className="form-value">{formatDate(data.acquisition_date)}</span>
                  </div>
                  <div className="form-row">
                    <span className="form-label">เลขที่หนังสืออนุมัติ/ลงวันที่:</span> <span className="form-value">{data.contract_no || '-'}</span>
                  </div>
                  <div className="form-row">
                    <span className="form-label">ราคา:</span> <span className="form-value">{data.price?.toLocaleString()} บาท</span>
                  </div>
                  <div className="form-row">
                    <span className="form-label">ชื่อผู้รับจ้าง/ผู้ขาย/ผู้ให้:</span> <span className="form-value">{data.procurement_method || '-'}</span>
                  </div>
                </td>
                <td style={{ width: '50%', textAlign: 'left', padding: '15px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>การเปลี่ยนแปลงส่วนราชการและผู้ดูแลรับผิดชอบ</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', fontSize: '12px' }}>
                    <thead>
                      <tr>
                        <th style={{ border: '1px solid #ccc', padding: '4px' }}>พ.ศ.</th>
                        <th style={{ border: '1px solid #ccc', padding: '4px' }}>ชื่อส่วนราชการ</th>
                        <th style={{ border: '1px solid #ccc', padding: '4px' }}>ชื่อหัวหน้าส่วนราชการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ border: '1px solid #ccc', padding: '4px', textAlign: 'center' }}>-</td>
                        <td style={{ border: '1px solid #ccc', padding: '4px', textAlign: 'center' }}>{(data as any).departments?.name || '-'}</td>
                        <td style={{ border: '1px solid #ccc', padding: '4px', textAlign: 'center' }}>{data.responsible_officer || '-'}</td>
                      </tr>
                      {/* Empty rows for layout */}
                      <tr><td style={{ border: '1px solid #ccc', padding: '10px' }}></td><td style={{ border: '1px solid #ccc' }}></td><td style={{ border: '1px solid #ccc' }}></td></tr>
                      <tr><td style={{ border: '1px solid #ccc', padding: '10px' }}></td><td style={{ border: '1px solid #ccc' }}></td><td style={{ border: '1px solid #ccc' }}></td></tr>
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td style={{ textAlign: 'left', padding: '15px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>ที่ดิน:</div>
                  <div className="form-row" style={{ fontSize: '13px' }}>
                    เนื้อที่: <span className="form-value-inline" style={{ width: '40px', textAlign: 'center' }}>{data.land_rai || '-'}</span> ไร่
                    <span className="form-value-inline" style={{ width: '40px', textAlign: 'center' }}>{data.land_ngan || '-'}</span> งาน
                    <span className="form-value-inline" style={{ width: '40px', textAlign: 'center' }}>{data.land_sqwa || '-'}</span> ตร.วา.
                  </div>
                  <div className="form-row" style={{ fontSize: '13px', marginTop: '8px' }}>
                    ประเภทที่ดิน: <span className="form-value">{data.land_type || '-'}</span>
                  </div>
                </td>
                <td style={{ textAlign: 'left', padding: '15px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>โรงเรือน/สิ่งก่อสร้างอื่นๆ:</div>
                  <div className="form-row" style={{ fontSize: '13px' }}>
                    [ {data.has_building ? '✓' : ' '} ] มีโรงเรือน/อาคาร &nbsp;&nbsp;&nbsp; [ {data.building_completed ? '✓' : ' '} ] ก่อสร้างเสร็จแล้ว
                  </div>
                  <div className="form-row" style={{ fontSize: '13px', marginTop: '8px' }}>
                    เลขที่ตึก/อาคาร: <span className="form-value-inline" style={{ width: '80px', textAlign: 'center' }}>{data.building_no || '-'}</span>
                    ราคาอาคาร: <span className="form-value-inline" style={{ width: '80px', textAlign: 'center' }}>{data.building_cost ? data.building_cost.toLocaleString() : '-'}</span> บาท
                  </div>
                  <div className="form-row" style={{ fontSize: '13px', marginTop: '8px' }}>
                    ขนาด: กว้าง <span className="form-value-inline" style={{ width: '40px', textAlign: 'center' }}>{data.width_m || '-'}</span> ม. 
                    ยาว <span className="form-value-inline" style={{ width: '40px', textAlign: 'center' }}>{data.length_m || '-'}</span> ม. 
                    หนา <span className="form-value-inline" style={{ width: '40px', textAlign: 'center' }}>{data.thickness_m || '-'}</span> ม. 
                    พื้นที่ก่อสร้าง <span className="form-value-inline" style={{ width: '50px', textAlign: 'center' }}>{data.area_sqm || '-'}</span> ตร.ม.
                  </div>
                </td>
                <td rowSpan={2} style={{ textAlign: 'center', verticalAlign: 'middle', width: '25%' }}>
                  รูปถ่าย หรือ แผนผังที่ตั้งพัสดุ
                  {data.photo_urls && data.photo_urls.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <img src={data.photo_urls[0]} alt="รูปพัสดุ" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} />
                    </div>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ===================== หน้าที่ 2 (ประวัติการซ่อม) ===================== */}
        <div className="page-break"></div>
        <div style={{ position: 'relative' }}>
          <div className="form-header" style={{ marginTop: '30px', marginBottom: '20px' }}>บันทึกการซ่อม/ปรับปรุงแก้ไขพัสดุ</div>
          
          <table className="form-table">
            <thead>
              <tr>
                <th style={{ width: '15%' }}>วัน เดือน ปี</th>
                <th style={{ width: '35%' }}>รายการซ่อม/ปรับปรุงแก้ไข</th>
                <th style={{ width: '15%' }}>จำนวนเงิน (บาท)</th>
                <th style={{ width: '20%' }}>ชื่อผู้รับจ้าง/ผู้รับทำ</th>
                <th style={{ width: '15%' }}>หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              {data.construction_repairs && data.construction_repairs.length > 0 ? (
                data.construction_repairs.map((repair: ConstructionRepair) => (
                  <tr key={repair.id}>
                    <td>{formatDate(repair.repair_date)}</td>
                    <td style={{ textAlign: 'left' }}>{repair.detail}</td>
                    <td style={{ textAlign: 'right' }}>{repair.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>{repair.contractor || '-'}</td>
                    <td>{repair.remark || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: '30px', color: '#666' }}>ยังไม่มีประวัติการซ่อมบำรุง</td>
                </tr>
              )}
              {/* Add blank rows for padding if few items */}
              {(!data.construction_repairs || data.construction_repairs.length < 5) && Array.from({ length: 5 - (data.construction_repairs?.length || 0) }).map((_, i) => (
                <tr key={'blank-'+i}>
                  <td style={{ padding: '15px' }}></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </>
  );
}
