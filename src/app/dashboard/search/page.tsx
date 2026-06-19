'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { formatNumber, formatMoney } from '@/lib/utils';
import {
  Search,
  Building2,
  Package,
  Wrench,
  Info,
  Calendar,
  X,
  Printer,
  FileText,
  DollarSign,
  Briefcase,
  AlertCircle,
  Eye,
  Loader2,
} from 'lucide-react';
import type { Asset, Category, Repair } from '@/types/database';

export default function SearchPage() {
  const { profile, selectedDeptId, departments } = useAuth();
  const { showToast } = useToast();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchText, setSearchText] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');

  // Selected Asset for view
  const [activeAsset, setActiveAsset] = useState<Asset | null>(null);
  const [assetRepairs, setAssetRepairs] = useState<Repair[]>([]);
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
        showToast('ไม่สามารถโหลดข้อมูลการค้นหาได้: ' + err.message, 'error');
      } finally {
        setLoading(false);
      }
    }

    if (profile) {
      loadData();
    }
  }, [selectedDeptId, profile]);

  // Load Repairs when an asset is selected for detail view
  useEffect(() => {
    async function loadRepairs() {
      if (!activeAsset) {
        setAssetRepairs([]);
        return;
      }
      setLoadingRepairs(true);
      try {
        const { data, error } = await supabase
          .from('repairs')
          .select('*')
          .eq('asset_id', activeAsset.id)
          .order('sequence', { ascending: true });

        if (error) throw error;
        setAssetRepairs(data || []);
      } catch (err: any) {
        showToast('ไม่สามารถโหลดประวัติการซ่อมแซมได้', 'error');
      } finally {
        setLoadingRepairs(false);
      }
    }
    loadRepairs();
  }, [activeAsset]);

  // Filter list
  const filteredAssets = assets.filter((asset) => {
    const text = searchText.toLowerCase();
    const matchesSearch =
      asset.code.toLowerCase().includes(text) ||
      asset.name.toLowerCase().includes(text) ||
      (asset.manufacturer && asset.manufacturer.toLowerCase().includes(text)) ||
      (asset.model && asset.model.toLowerCase().includes(text)) ||
      (asset.serial_no && asset.serial_no.toLowerCase().includes(text)) ||
      (asset.plate_no && asset.plate_no.toLowerCase().includes(text)) ||
      (asset.location && asset.location.toLowerCase().includes(text));

    const matchesCat = selectedCat ? asset.category_id === selectedCat : true;
    const matchesStatus = selectedStatus ? asset.status === selectedStatus : true;
    const matchesDept = selectedDeptFilter ? asset.department_id === selectedDeptFilter : true;

    return matchesSearch && matchesCat && matchesStatus && matchesDept;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="page-header no-print">
        <div>
          <h2 className="page-title">
            <Search size={24} />
            ค้นหารายละเอียดครุภัณฑ์เชิงลึก
          </h2>
          <p className="page-subtitle">
            ค้นหาแบบสืบค้นทุกฟิลด์ พร้อมฟังก์ชันเปิดแสดงรายละเอียดการซ่อมและการคำนวณเงินสะสม
          </p>
        </div>
      </div>

      {/* Filters Form - Hide on Print */}
      <div className="card no-print" style={{ marginBottom: '16px' }}>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label className="form-label">คำค้นหาหลัก</label>
              <div style={{ position: 'relative' }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-light)',
                  }}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="รหัส, ชื่อ, ยี่ห้อ, ทะเบียน, ซีเรียล..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ paddingLeft: '36px' }}
                />
              </div>
            </div>

            <div>
              <label className="form-label">ประเภท</label>
              <select
                className="form-input"
                value={selectedCat}
                onChange={(e) => setSelectedCat(e.target.value)}
              >
                <option value="">ทั้งหมด</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">สถานะ</label>
              <select
                className="form-input"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">ทั้งหมด</option>
                <option value="ใช้งาน">ใช้งาน</option>
                <option value="ชำรุด">ชำรุด</option>
                <option value="จำหน่าย">จำหน่าย</option>
                <option value="ให้ยืม">ให้ยืม</option>
              </select>
            </div>

            {profile?.role === 'admin' && !selectedDeptId && (
              <div>
                <label className="form-label">สังกัดส่วนราชการ</label>
                <select
                  className="form-input"
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                >
                  <option value="">ทุกส่วนราชการ</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Table - Hide on Print */}
      <div className="card no-print">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="loading">
              <Loader2 className="animate-spin text-primary" size={24} style={{ margin: '0 auto' }} />
              <p style={{ marginTop: '8px' }}>กำลังค้นหาข้อมูล...</p>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="empty-state">
              <AlertCircle />
              <p>ไม่พบครุภัณฑ์ที่สอดคล้องกับตัวกรอง</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>รหัสครุภัณฑ์</th>
                    <th>ชื่อครุภัณฑ์</th>
                    <th>ยี่ห้อ/รุ่น</th>
                    <th>สถานที่จัดเก็บ</th>
                    <th className="text-right">มูลค่ารวม</th>
                    <th>สถานะ</th>
                    <th className="text-center" style={{ width: '80px' }}>รายละเอียด</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset) => (
                    <tr key={asset.id}>
                      <td style={{ fontWeight: 600 }}>{asset.code}</td>
                      <td style={{ fontWeight: 500, color: 'var(--text-dark)' }}>{asset.name}</td>
                      <td style={{ color: 'var(--text-mid)' }}>
                        {asset.manufacturer || '-'} {asset.model ? `(${asset.model})` : ''}
                      </td>
                      <td>{asset.location || '-'}</td>
                      <td className="text-right" style={{ fontWeight: 600 }}>
                        {formatMoney(Number(asset.total_value))}
                      </td>
                      <td>
                        <span
                          className={`badge-status ${
                            asset.status === 'ใช้งาน'
                              ? 'badge-use'
                              : asset.status === 'ชำรุด'
                              ? 'badge-broken'
                              : asset.status === 'จำหน่าย'
                              ? 'badge-sell'
                              : 'badge-lend'
                          }`}
                        >
                          {asset.status}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          className="btn-icon btn-icon-edit"
                          onClick={() => setActiveAsset(asset)}
                          title="ดูข้อมูลเชิงลึก"
                          style={{ color: 'var(--primary)' }}
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail View Modal / Printable View */}
      {activeAsset && (
        <div className="modal-backdrop active">
          <div className="modal modal-lg printable-modal" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header no-print">
              <h3>
                <Info size={20} />
                ข้อมูลรายละเอียดเชิงลึกของครุภัณฑ์
              </h3>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button className="btn btn-outline" onClick={handlePrint}>
                  <Printer size={16} />
                  พิมพ์เอกสาร
                </button>
                <button className="modal-close" onClick={() => setActiveAsset(null)}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="modal-body print-section" style={{ overflowY: 'auto', flex: 1, padding: '24px' }}>
              {/* Report Header for Print */}
              <div className="print-header-only" style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>รายละเอียดข้อมูลครุภัณฑ์สำนักงาน</h2>
                <h3 style={{ fontSize: '1rem', color: '#666', marginTop: '4px' }}>เทศบาลเมืองทับกวาง จ.สระบุรี</h3>
              </div>

              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '24px' }}>
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <h4 style={{ borderBottom: '2px solid var(--primary-light)', paddingBottom: '6px', fontWeight: '700', color: 'var(--primary-dark)', marginBottom: '12px' }}>
                    <Package size={16} style={{ marginRight: '6px' }} />
                    ข้อมูลครุภัณฑ์เบื้องต้น
                  </h4>
                  <table className="info-table">
                    <tbody>
                      <tr>
                        <td className="info-label">รหัสครุภัณฑ์</td>
                        <td className="info-val" style={{ fontWeight: 700 }}>{activeAsset.code}</td>
                      </tr>
                      <tr>
                        <td className="info-label">ชื่อครุภัณฑ์</td>
                        <td className="info-val">{activeAsset.name}</td>
                      </tr>
                      <tr>
                        <td className="info-label">ประเภทครุภัณฑ์</td>
                        <td className="info-val">{activeAsset.asset_type || '-'}</td>
                      </tr>
                      <tr>
                        <td className="info-label">หมวดหมู่ระบบ</td>
                        <td className="info-val">{categories.find(c => c.id === activeAsset.category_id)?.name || '-'}</td>
                      </tr>
                      <tr>
                        <td className="info-label">ยี่ห้อ / ผู้ผลิต</td>
                        <td className="info-val">{activeAsset.manufacturer || '-'}</td>
                      </tr>
                      <tr>
                        <td className="info-label">รุ่น / ลักษณะ</td>
                        <td className="info-val">{activeAsset.model || '-'}</td>
                      </tr>
                      <tr>
                        <td className="info-label">ทะเบียนรถ / กุญแจ</td>
                        <td className="info-val">{activeAsset.plate_no || '-'}</td>
                      </tr>
                      <tr>
                        <td className="info-label">ลำดับซีเรียล (S/N)</td>
                        <td className="info-val">{activeAsset.serial_no || '-'}</td>
                      </tr>
                      <tr>
                        <td className="info-label">หมายเลขเครื่องยนต์</td>
                        <td className="info-val">{activeAsset.engine_no || '-'}</td>
                      </tr>
                      <tr>
                        <td className="info-label">หมายเลขตัวถัง</td>
                        <td className="info-val">{activeAsset.frame_no || '-'}</td>
                      </tr>
                      <tr>
                        <td className="info-label">ของแถม / อุปกรณ์เพิ่ม</td>
                        <td className="info-val">{activeAsset.special_feature || '-'}</td>
                      </tr>
                      <tr>
                        <td className="info-label">สถานที่จัดเก็บติดตั้ง</td>
                        <td className="info-val" style={{ fontWeight: 600 }}>{activeAsset.location || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div style={{ flex: 1, minWidth: '300px' }}>
                  <h4 style={{ borderBottom: '2px solid var(--primary-light)', paddingBottom: '6px', fontWeight: '700', color: 'var(--primary-dark)', marginBottom: '12px' }}>
                    <DollarSign size={16} style={{ marginRight: '6px' }} />
                    ข้อมูลด้านการเงินและการประกัน
                  </h4>
                  <table className="info-table">
                    <tbody>
                      <tr>
                        <td className="info-label">วิธีการได้มา</td>
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
                        <td className="info-label">จำนวนสิ่งของ</td>
                        <td className="info-val">{formatNumber(activeAsset.quantity)} {activeAsset.unit}</td>
                      </tr>
                      <tr>
                        <td className="info-label">ราคาต่อหน่วย</td>
                        <td className="info-val">{formatMoney(Number(activeAsset.unit_price))} บาท</td>
                      </tr>
                      <tr>
                        <td className="info-label">มูลค่ารวมทั้งสิ้น</td>
                        <td className="info-val" style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>
                          {formatMoney(Number(activeAsset.total_value))} บาท
                        </td>
                      </tr>
                      <tr>
                        <td className="info-label">รับประกันผลประโยชน์</td>
                        <td className="info-val">{activeAsset.warranty_months ? `${activeAsset.warranty_months} เดือน` : 'ไม่มีประกัน'}</td>
                      </tr>
                      <tr>
                        <td className="info-label">สิ้นสุดการรับประกัน</td>
                        <td className="info-val">{activeAsset.warranty_end_date || '-'}</td>
                      </tr>
                      <tr>
                        <td className="info-label">บริษัทผู้ให้ประกัน / ติดต่อ</td>
                        <td className="info-val">{activeAsset.warranty_company || '-'}</td>
                      </tr>
                      <tr>
                        <td className="info-label">ค่าเสื่อมราคา ปีที่ 1-5</td>
                        <td className="info-val">
                          {activeAsset.depreciation_y1}%, {activeAsset.depreciation_y2}%, {activeAsset.depreciation_y3}%, {activeAsset.depreciation_y4}%, {activeAsset.depreciation_y5}%
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <h4 style={{ borderBottom: '2px solid var(--primary-light)', paddingBottom: '6px', fontWeight: '700', color: 'var(--primary-dark)', marginTop: '20px', marginBottom: '12px' }}>
                    <Briefcase size={16} style={{ marginRight: '6px' }} />
                    สถานะปัจจุบันของครุภัณฑ์
                  </h4>
                  <table className="info-table">
                    <tbody>
                      <tr>
                        <td className="info-label">สถานะการใช้งาน</td>
                        <td className="info-val">
                          <span
                            className={`badge-status ${
                              activeAsset.status === 'ใช้งาน'
                                ? 'badge-use'
                                : activeAsset.status === 'ชำรุด'
                                ? 'badge-broken'
                                : activeAsset.status === 'จำหน่าย'
                                ? 'badge-sell'
                                : 'badge-lend'
                            }`}
                            style={{ display: 'inline-block' }}
                          >
                            {activeAsset.status}
                          </span>
                        </td>
                      </tr>
                      {activeAsset.status === 'ให้ยืม' && (
                        <>
                          <tr>
                            <td className="info-label">ผู้ยืม / สังกัด</td>
                            <td className="info-val" style={{ fontWeight: 600 }}>{activeAsset.borrower || '-'}</td>
                          </tr>
                          <tr>
                            <td className="info-label">วันที่ขอยืม</td>
                            <td className="info-val">{activeAsset.borrow_date || '-'}</td>
                          </tr>
                          <tr>
                            <td className="info-label">กำหนดส่งคืน</td>
                            <td className="info-val">{activeAsset.return_date || '-'}</td>
                          </tr>
                        </>
                      )}
                      {activeAsset.status === 'จำหน่าย' && (
                        <>
                          <tr>
                            <td className="info-label">วันที่ตัดจำหน่าย</td>
                            <td className="info-val">{activeAsset.dispose_date || '-'}</td>
                          </tr>
                          <tr>
                            <td className="info-label">มูลค่าที่ได้คืน</td>
                            <td className="info-val">{formatMoney(Number(activeAsset.disposal_value))} บาท</td>
                          </tr>
                          <tr>
                            <td className="info-label">ผลต่างกำไร/ขาดทุน</td>
                            <td className="info-val" style={{ fontWeight: 600 }}>{formatMoney(Number(activeAsset.profit_loss))} บาท</td>
                          </tr>
                        </>
                      )}
                      <tr>
                        <td className="info-label">หมายเหตุการบันทึก</td>
                        <td className="info-val" style={{ color: 'var(--text-mid)' }}>{activeAsset.remark || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Photos Row */}
              {activeAsset.photo_urls && activeAsset.photo_urls.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ borderBottom: '2px solid var(--primary-light)', paddingBottom: '6px', fontWeight: '700', color: 'var(--primary-dark)', marginBottom: '12px' }}>
                    รูปถ่ายบันทึกครุภัณฑ์
                  </h4>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {activeAsset.photo_urls.map((url, i) => (
                      <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '4px', background: '#fff', width: '240px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={url} alt={`รูปภาพ ${i + 1}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Repairs History */}
              <div>
                <h4 style={{ borderBottom: '2px solid var(--primary-light)', paddingBottom: '6px', fontWeight: '700', color: 'var(--primary-dark)', marginBottom: '12px' }}>
                  <Wrench size={16} style={{ marginRight: '6px' }} />
                  ประวัติการซ่อมบำรุงรักษา
                </h4>
                {loadingRepairs ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Loader2 className="animate-spin" size={16} />
                    <span>กำลังโหลดประวัติการซ่อม...</span>
                  </div>
                ) : assetRepairs.length === 0 ? (
                  <p style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>ครุภัณฑ์ชิ้นนี้ยังไม่มีประวัติการซ่อมบำรุงรักษา</p>
                ) : (
                  <div className="table-wrapper">
                    <table style={{ border: '1px solid var(--border)' }}>
                      <thead>
                        <tr>
                          <th className="text-center" style={{ width: '60px' }}>ครั้งที่</th>
                          <th>หนังสืออนุมัติ</th>
                          <th>ลงวันที่</th>
                          <th>รายละเอียดการซ่อมบำรุงรักษา</th>
                          <th className="text-right" style={{ width: '120px' }}>จำนวนเงิน (บาท)</th>
                          <th>ผู้ดำเนินการ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assetRepairs.map((rep, idx) => (
                          <tr key={rep.id}>
                            <td className="text-center">{idx + 1}</td>
                            <td>{rep.doc_no || '-'}</td>
                            <td>{rep.doc_date || '-'}</td>
                            <td style={{ fontWeight: 500 }}>{rep.detail}</td>
                            <td className="text-right" style={{ fontWeight: 600, color: 'var(--danger)' }}>
                              {formatMoney(Number(rep.amount))}
                            </td>
                            <td>{rep.contractor || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer no-print">
              <button className="btn btn-outline" onClick={() => setActiveAsset(null)}>
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
