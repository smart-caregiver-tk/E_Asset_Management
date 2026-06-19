'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { formatNumber, formatMoney, getThaiDateFull } from '@/lib/utils';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Building2,
  Loader2,
  FileText,
  Wrench,
  Percent,
} from 'lucide-react';
import type { Asset, Category, Repair } from '@/types/database';
import * as XLSX from 'xlsx';

export default function ReportsPage() {
  const { profile, selectedDeptId, departments } = useAuth();
  const { showToast } = useToast();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // P.D. 2 Selected Asset
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [activeAsset, setActiveAsset] = useState<Asset | null>(null);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loadingRepairs, setLoadingRepairs] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        let assetQuery = supabase.from('assets').select('*');
        let catQuery = supabase.from('categories').select('*');

        if (selectedDeptId) {
          assetQuery = assetQuery.eq('department_id', selectedDeptId);
          catQuery = catQuery.eq('department_id', selectedDeptId);
        }

        const [assetsRes, catRes] = await Promise.all([
          assetQuery.order('code'),
          catQuery.order('code'),
        ]);

        if (assetsRes.error) throw assetsRes.error;
        if (catRes.error) throw catRes.error;

        setAssets(assetsRes.data || []);
        setCategories(catRes.data || []);
      } catch (err: any) {
        showToast('ไม่สามารถโหลดข้อมูลรายงานได้: ' + err.message, 'error');
      } finally {
        setLoading(false);
      }
    }

    if (profile) {
      loadData();
    }
  }, [selectedDeptId, profile]);

  // Load Repairs when an asset is selected for P.D. 2
  useEffect(() => {
    async function loadRepairs() {
      if (!selectedAssetId) {
        setActiveAsset(null);
        setRepairs([]);
        return;
      }
      const asset = assets.find(a => a.id === selectedAssetId);
      setActiveAsset(asset || null);

      setLoadingRepairs(true);
      try {
        const { data, error } = await supabase
          .from('repairs')
          .select('*')
          .eq('asset_id', selectedAssetId)
          .order('sequence', { ascending: true });

        if (error) throw error;
        setRepairs(data || []);
      } catch (err: any) {
        showToast('ไม่สามารถโหลดประวัติการซ่อมแซมได้', 'error');
      } finally {
        setLoadingRepairs(false);
      }
    }
    loadRepairs();
  }, [selectedAssetId, assets]);

  // Excel Export Logic
  const handleExportExcel = () => {
    if (assets.length === 0) {
      showToast('ไม่มีข้อมูลที่จะส่งออก', 'warning');
      return;
    }

    // Format data for sheet
    const formattedData = assets.map((asset) => {
      const catName = categories.find(c => c.id === asset.category_id)?.name || '-';
      const deptName = departments.find(d => d.id === asset.department_id)?.name || '-';
      return {
        'รหัสครุภัณฑ์': asset.code,
        'ชื่อครุภัณฑ์': asset.name,
        'ประเภทครุภัณฑ์': asset.asset_type || '-',
        'หมวดหมู่': catName,
        'ยี่ห้อ/ผู้ผลิต': asset.manufacturer || '-',
        'รุ่น': asset.model || '-',
        'หมายเลขเครื่อง': asset.serial_no || '-',
        'ทะเบียนรถ': asset.plate_no || '-',
        'สถานที่จัดเก็บ': asset.location || '-',
        'วิธีได้มา': asset.acquisition_method || '-',
        'วันที่ได้มา': asset.acquisition_date || '-',
        'ปีงบประมาณ': asset.acquisition_year || '-',
        'จำนวน': asset.quantity,
        'หน่วยนับ': asset.unit,
        'ราคาต่อหน่วย': Number(asset.unit_price),
        'มูลค่ารวม': Number(asset.total_value),
        'สถานะ': asset.status,
        'ส่วนราชการ': deptName,
        'หมายเหตุ': asset.remark || '',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ทะเบียนครุภัณฑ์');

    // Generate filename
    const deptSlug = selectedDeptId
      ? departments.find(d => d.id === selectedDeptId)?.short_name || 'dept'
      : 'all-departments';
    const filename = `assets_${deptSlug}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    XLSX.writeFile(workbook, filename);
    showToast('ดาวน์โหลดเอกสาร Excel เรียบร้อย');
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper calculations for depreciation values
  const getDepreciationData = () => {
    if (!activeAsset) return [];
    const cost = Number(activeAsset.total_value) || 0;
    const rates = [
      Number(activeAsset.depreciation_y1) || 20,
      Number(activeAsset.depreciation_y2) || 20,
      Number(activeAsset.depreciation_y3) || 20,
      Number(activeAsset.depreciation_y4) || 20,
      Number(activeAsset.depreciation_y5) || 20,
    ];

    let remaining = cost;
    return rates.map((rate, index) => {
      const depAmt = remaining * (rate / 100);
      const prevRemaining = remaining;
      remaining = remaining - depAmt;
      return {
        year: index + 1,
        rate,
        prevValue: prevRemaining,
        depreciationAmount: depAmt,
        remainingValue: remaining,
      };
    });
  };

  const depData = getDepreciationData();
  const activeAssetDept = departments.find(d => d.id === activeAsset?.department_id)?.name || '-';

  return (
    <div>
      <div className="page-header no-print">
        <div>
          <h2 className="page-title">
            <FileSpreadsheet size={24} />
            พิมพ์รายงาน / ทะเบียน พ.ด. ๒
          </h2>
          <p className="page-subtitle">
            ดาวน์โหลดสรุปทะเบียนครุภัณฑ์ในรูปแบบไฟล์ Excel หรือพิมพ์เอกสาร พ.ด. ๒ สำหรับหน่วยงาน
          </p>
        </div>
      </div>

      {/* Control Panel - Hide on Print */}
      <div className="card no-print" style={{ marginBottom: '16px' }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <label className="form-label" style={{ fontWeight: '700' }}>เลือกครุภัณฑ์เพื่อพิมพ์ พ.ด. ๒</label>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Loader2 className="animate-spin text-primary" size={16} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>กำลังโหลดรายการครุภัณฑ์...</span>
                </div>
              ) : (
                <select
                  className="form-input"
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                >
                  <option value="">-- เลือกครุภัณฑ์ --</option>
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.code} - {asset.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-outline" onClick={handleExportExcel}>
                <Download size={16} />
                ส่งออกรายการ Excel
              </button>

              {activeAsset && (
                <button className="btn btn-primary" onClick={handlePrint}>
                  <Printer size={16} />
                  พิมพ์ พ.ด. ๒
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Printable Area */}
      {activeAsset ? (
        <div className="card print-section" style={{ minHeight: '297mm', padding: '20px' }}>
          {/* P.D. 2 Official Layout */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>ทะเบียนครุภัณฑ์ (พ.ด. ๒)</h2>
              <span style={{ fontSize: '0.85rem', color: '#555' }}>เทศบาลเมืองทับกวาง จ.สระบุรี</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: '700', padding: '4px 8px', border: '1px solid #000', borderRadius: '4px' }}>
                รหัสครุภัณฑ์: {activeAsset.code}
              </span>
            </div>
          </div>

          <div className="pd2-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '20px' }}>
            <div>
              <h4 style={{ fontWeight: '700', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '10px' }}>ข้อมูลครุภัณฑ์</h4>
              <table className="info-table">
                <tbody>
                  <tr>
                    <td className="info-label" style={{ width: '120px' }}>ส่วนราชการ</td>
                    <td className="info-val">{activeAssetDept}</td>
                  </tr>
                  <tr>
                    <td className="info-label">ชื่อครุภัณฑ์</td>
                    <td className="info-val" style={{ fontWeight: '700' }}>{activeAsset.name}</td>
                  </tr>
                  <tr>
                    <td className="info-label">ประเภทครุภัณฑ์</td>
                    <td className="info-val">{activeAsset.asset_type || '-'}</td>
                  </tr>
                  <tr>
                    <td className="info-label">ยี่ห้อ / ผู้ผลิต</td>
                    <td className="info-val">{activeAsset.manufacturer || '-'}</td>
                  </tr>
                  <tr>
                    <td className="info-label">รุ่น / ลักษณะพิเศษ</td>
                    <td className="info-val">{activeAsset.model || '-'}</td>
                  </tr>
                  <tr>
                    <td className="info-label">เลขเครื่อง / ทะเบียน</td>
                    <td className="info-val">{activeAsset.serial_no || activeAsset.plate_no || '-'}</td>
                  </tr>
                  <tr>
                    <td className="info-label">สถานที่ติดตั้ง</td>
                    <td className="info-val">{activeAsset.location || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h4 style={{ fontWeight: '700', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '10px' }}>รายละเอียดจัดซื้อจัดจ้าง</h4>
              <table className="info-table">
                <tbody>
                  <tr>
                    <td className="info-label" style={{ width: '120px' }}>วิธีการได้มา</td>
                    <td className="info-val">{activeAsset.acquisition_method || '-'}</td>
                  </tr>
                  <tr>
                    <td className="info-label">วันที่ได้มา</td>
                    <td className="info-val">{activeAsset.acquisition_date || '-'}</td>
                  </tr>
                  <tr>
                    <td className="info-label">ปีงบประมาณที่ได้มา</td>
                    <td className="info-val">{activeAsset.acquisition_year || '-'}</td>
                  </tr>
                  <tr>
                    <td className="info-label">จำนวนครุภัณฑ์</td>
                    <td className="info-val">{formatNumber(activeAsset.quantity)} {activeAsset.unit}</td>
                  </tr>
                  <tr>
                    <td className="info-label">ราคาต่อหน่วย</td>
                    <td className="info-val">{formatMoney(Number(activeAsset.unit_price))} บาท</td>
                  </tr>
                  <tr>
                    <td className="info-label">มูลค่ารวมสะสม</td>
                    <td className="info-val" style={{ fontWeight: '700' }}>{formatMoney(Number(activeAsset.total_value))} บาท</td>
                  </tr>
                  <tr>
                    <td className="info-label">ระยะเวลารับประกัน</td>
                    <td className="info-val">{activeAsset.warranty_months ? `${activeAsset.warranty_months} เดือน` : 'ไม่มีประกัน'}</td>
                  </tr>
                  <tr>
                    <td className="info-label">บริษัทผู้ค้า / โทร</td>
                    <td className="info-val">{activeAsset.warranty_company || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Photos inside P.D. 2 */}
          {activeAsset.photo_urls && activeAsset.photo_urls.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontWeight: '700', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '10px' }}>ภาพถ่ายครุภัณฑ์ (พ.ด. ๒)</h4>
              <div style={{ display: 'flex', gap: '16px' }}>
                {activeAsset.photo_urls.map((url, i) => (
                  <div key={i} style={{ border: '1px solid #000', padding: '4px', background: '#fff', width: '180px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={url} alt={`พ.ด. ๒ รูปภาพ ${i+1}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Depreciation Calculation Table */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontWeight: '700', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '10px' }}>
              ตารางค่าเสื่อมราคาประจำปีสะสม (5 ปี)
            </h4>
            <div className="table-wrapper">
              <table style={{ border: '1px solid #000' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th className="text-center" style={{ border: '1px solid #000' }}>ปีที่</th>
                    <th className="text-center" style={{ border: '1px solid #000' }}>อัตราค่าเสื่อม (%)</th>
                    <th className="text-right" style={{ border: '1px solid #000' }}>มูลค่าคงเหลือยกมา (บาท)</th>
                    <th className="text-right" style={{ border: '1px solid #000' }}>ค่าเสื่อมราคาประจำปี (บาท)</th>
                    <th className="text-right" style={{ border: '1px solid #000' }}>มูลค่าสุทธิคงเหลือ (บาท)</th>
                  </tr>
                </thead>
                <tbody>
                  {depData.map((d) => (
                    <tr key={d.year}>
                      <td className="text-center" style={{ border: '1px solid #000', fontWeight: '600' }}>{d.year}</td>
                      <td className="text-center" style={{ border: '1px solid #000' }}>{d.rate}%</td>
                      <td className="text-right" style={{ border: '1px solid #000' }}>{formatMoney(d.prevValue)}</td>
                      <td className="text-right" style={{ border: '1px solid #000', color: 'var(--danger)', fontWeight: '600' }}>
                        {formatMoney(d.depreciationAmount)}
                      </td>
                      <td className="text-right" style={{ border: '1px solid #000', fontWeight: '700' }}>{formatMoney(d.remainingValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Repairs History Table */}
          <div>
            <h4 style={{ fontWeight: '700', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '10px' }}>ประวัติการซ่อมบำรุงรักษาและการปรับปรุง</h4>
            {loadingRepairs ? (
              <p>กำลังโหลดประวัติการซ่อม...</p>
            ) : repairs.length === 0 ? (
              <p style={{ color: '#666', fontSize: '0.85rem' }}>ยังไม่มีประวัติการซ่อมบำรุงรักษา</p>
            ) : (
              <div className="table-wrapper">
                <table style={{ border: '1px solid #000' }}>
                  <thead>
                    <tr style={{ background: '#f5f5f5' }}>
                      <th className="text-center" style={{ border: '1px solid #000', width: '60px' }}>ครั้งที่</th>
                      <th style={{ border: '1px solid #000', width: '130px' }}>เลขที่อนุมัติ</th>
                      <th style={{ border: '1px solid #000', width: '110px' }}>ลงวันที่</th>
                      <th style={{ border: '1px solid #000' }}>รายการซ่อมบำรุงรักษา</th>
                      <th className="text-right" style={{ border: '1px solid #000', width: '110px' }}>จำนวนเงิน (บาท)</th>
                      <th style={{ border: '1px solid #000' }}>ผู้รับดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repairs.map((rep, index) => (
                      <tr key={rep.id}>
                        <td className="text-center" style={{ border: '1px solid #000' }}>{index + 1}</td>
                        <td style={{ border: '1px solid #000' }}>{rep.doc_no || '-'}</td>
                        <td style={{ border: '1px solid #000' }}>{rep.doc_date || '-'}</td>
                        <td style={{ border: '1px solid #000', fontWeight: '500' }}>{rep.detail}</td>
                        <td className="text-right" style={{ border: '1px solid #000', fontWeight: '600' }}>{formatMoney(Number(rep.amount))}</td>
                        <td style={{ border: '1px solid #000' }}>{rep.contractor || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card no-print" style={{ borderStyle: 'dashed', background: 'transparent' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <FileText size={40} style={{ color: 'var(--text-light)', marginBottom: '12px' }} />
            <p style={{ color: 'var(--text-light)', fontSize: '0.92rem' }}>
              กรุณาเลือกครุภัณฑ์ด้านบนเพื่อแสดงตัวอย่างการพิมพ์แบบ พ.ด. ๒
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
