'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import PhotoUploader from '@/components/PhotoUploader';
import { formatNumber, formatMoney } from '@/lib/utils';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Save,
  X,
  Search,
  Filter,
  FileText,
  Info,
  Calendar,
  DollarSign,
  Image as ImageIcon,
  ChevronDown,
} from 'lucide-react';
import type { Asset, Category } from '@/types/database';

export default function AssetsPage() {
  const { profile, selectedDeptId, departments } = useAuth();
  const { showToast } = useToast();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'detail' | 'finance' | 'photo'>('basic');
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form Fields (37 fields mapped to state)
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [assetType, setAssetType] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [serialNo, setSerialNo] = useState('');
  const [engineNo, setEngineNo] = useState('');
  const [frameNo, setFrameNo] = useState('');
  const [plateNo, setPlateNo] = useState('');
  const [specialFeature, setSpecialFeature] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [location, setLocation] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState('หน่วย');
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [acquisitionMethod, setAcquisitionMethod] = useState('งบประมาณท้องถิ่น');
  const [acquisitionDate, setAcquisitionDate] = useState('');

  // Warranty
  const [warrantyMonths, setWarrantyMonths] = useState<number>(0);
  const [warrantyEndDate, setWarrantyEndDate] = useState('');
  const [warrantyCompany, setWarrantyCompany] = useState('');

  // Depreciation
  const [dep1, setDep1] = useState('20');
  const [dep2, setDep2] = useState('20');
  const [dep3, setDep3] = useState('20');
  const [dep4, setDep4] = useState('20');
  const [dep5, setDep5] = useState('20');

  // Disposals & Loans
  const [status, setStatus] = useState('ใช้งาน');
  const [borrower, setBorrower] = useState('');
  const [borrowDate, setBorrowDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [disposeDate, setDisposeDate] = useState('');
  const [disposalValue, setDisposalValue] = useState<number>(0);
  const [profitLoss, setProfitLoss] = useState<number>(0);

  // Photos & Remarks
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [remark, setRemark] = useState('');
  const [targetDeptId, setTargetDeptId] = useState('');

  // Delete Confirm State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);

  // Auto calculate total value when quantity or unit price changes
  useEffect(() => {
    setTotalValue(quantity * unitPrice);
  }, [quantity, unitPrice]);

  const fetchAssetsAndCategories = async () => {
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
      showToast('ไม่สามารถโหลดข้อมูลครุภัณฑ์ได้: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchAssetsAndCategories();
    }
  }, [selectedDeptId, profile]);

  const openAddModal = () => {
    setEditingAsset(null);
    setActiveTab('basic');

    // Reset fields to default
    setCode('');
    setName('');
    setAssetType('');
    setManufacturer('');
    setModel('');
    setSerialNo('');
    setEngineNo('');
    setFrameNo('');
    setPlateNo('');
    setSpecialFeature('');
    setCategoryId(categories[0]?.id || '');
    setLocation('');
    setQuantity(1);
    setUnit('เครื่อง');
    setUnitPrice(0);
    setTotalValue(0);
    setAcquisitionMethod('งบประมาณท้องถิ่น');
    setAcquisitionDate('');
    setWarrantyMonths(0);
    setWarrantyEndDate('');
    setWarrantyCompany('');
    setDep1('20'); setDep2('20'); setDep3('20'); setDep4('20'); setDep5('20');
    setStatus('ใช้งาน');
    setBorrower('');
    setBorrowDate('');
    setReturnDate('');
    setDisposeDate('');
    setDisposalValue(0);
    setProfitLoss(0);
    setPhotoUrls([]);
    setRemark('');
    setTargetDeptId(selectedDeptId || (departments[0]?.id || ''));

    setModalOpen(true);
  };

  const openEditModal = (asset: Asset) => {
    setEditingAsset(asset);
    setActiveTab('basic');

    // Populate fields
    setCode(asset.code);
    setName(asset.name);
    setAssetType(asset.asset_type || '');
    setManufacturer(asset.manufacturer || '');
    setModel(asset.model || '');
    setSerialNo(asset.serial_no || '');
    setEngineNo(asset.engine_no || '');
    setFrameNo(asset.frame_no || '');
    setPlateNo(asset.plate_no || '');
    setSpecialFeature(asset.special_feature || '');
    setCategoryId(asset.category_id || '');
    setLocation(asset.location || '');
    setQuantity(asset.quantity || 1);
    setUnit(asset.unit || 'เครื่อง');
    setUnitPrice(asset.unit_price ? Number(asset.unit_price) : 0);
    setTotalValue(asset.total_value ? Number(asset.total_value) : 0);
    setAcquisitionMethod(asset.acquisition_method || 'งบประมาณท้องถิ่น');
    setAcquisitionDate(asset.acquisition_date || '');
    setWarrantyMonths(asset.warranty_months || 0);
    setWarrantyEndDate(asset.warranty_end_date || '');
    setWarrantyCompany(asset.warranty_company || '');
    setDep1(asset.depreciation_y1 || '20');
    setDep2(asset.depreciation_y2 || '20');
    setDep3(asset.depreciation_y3 || '20');
    setDep4(asset.depreciation_y4 || '20');
    setDep5(asset.depreciation_y5 || '20');
    setStatus(asset.status || 'ใช้งาน');
    setBorrower(asset.borrower || '');
    setBorrowDate(asset.borrow_date || '');
    setReturnDate(asset.return_date || '');
    setDisposeDate(asset.dispose_date || '');
    setDisposalValue(asset.disposal_value ? Number(asset.disposal_value) : 0);
    setProfitLoss(asset.profit_loss ? Number(asset.profit_loss) : 0);
    setPhotoUrls(asset.photo_urls || []);
    setRemark(asset.remark || '');
    setTargetDeptId(asset.department_id);

    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      showToast('กรุณาระบุรหัสและชื่อครุภัณฑ์', 'warning');
      return;
    }

    setModalLoading(true);
    const deptIdToSave = profile?.role === 'admin' ? targetDeptId : profile?.department_id;

    if (!deptIdToSave) {
      showToast('กรุณาระบุส่วนราชการ', 'warning');
      setModalLoading(false);
      return;
    }

    const assetData = {
      code,
      name,
      asset_type: assetType,
      manufacturer,
      model,
      serial_no: serialNo,
      engine_no: engineNo,
      frame_no: frameNo,
      plate_no: plateNo,
      special_feature: specialFeature,
      acquisition_method: acquisitionMethod,
      acquisition_date: acquisitionDate,
      category_id: categoryId || null,
      location,
      quantity,
      unit,
      unit_price: unitPrice,
      total_value: quantity * unitPrice,
      warranty_months: warrantyMonths,
      warranty_end_date: warrantyEndDate,
      warranty_company: warrantyCompany,
      depreciation_y1: dep1,
      depreciation_y2: dep2,
      depreciation_y3: dep3,
      depreciation_y4: dep4,
      depreciation_y5: dep5,
      status,
      borrower: status === 'ให้ยืม' ? borrower : '',
      borrow_date: status === 'ให้ยืม' ? borrowDate : '',
      return_date: status === 'ให้ยืม' ? returnDate : '',
      dispose_date: status === 'จำหน่าย' ? disposeDate : '',
      disposal_value: status === 'จำหน่าย' ? disposalValue : 0,
      profit_loss: status === 'จำหน่าย' ? profitLoss : 0,
      photo_urls: photoUrls,
      remark,
      department_id: deptIdToSave,
    };

    try {
      if (editingAsset) {
        const { error } = await supabase
          .from('assets')
          .update(assetData)
          .eq('id', editingAsset.id);

        if (error) throw error;
        showToast('แก้ไขข้อมูลครุภัณฑ์สำเร็จ');
      } else {
        const { error } = await supabase.from('assets').insert(assetData);
        if (error) throw error;
        showToast('เพิ่มครุภัณฑ์ใหม่สำเร็จ');
      }
      setModalOpen(false);
      fetchAssetsAndCategories();
    } catch (err: any) {
      showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteClick = (asset: Asset) => {
    setAssetToDelete(asset);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!assetToDelete) return;
    setDeleteConfirmOpen(false);

    try {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', assetToDelete.id);

      if (error) throw error;
      showToast('ลบข้อมูลครุภัณฑ์เรียบร้อย');
      fetchAssetsAndCategories();
    } catch (err: any) {
      showToast('ไม่สามารถลบได้: ' + err.message, 'error');
    } finally {
      setAssetToDelete(null);
    }
  };

  // Filter logic on Client Side for responsiveness
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.location && asset.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (asset.remark && asset.remark.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = filterCategory ? asset.category_id === filterCategory : true;
    const matchesStatus = filterStatus ? asset.status === filterStatus : true;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <Package size={24} />
            ทะเบียนจัดเก็บครุภัณฑ์
          </h2>
          <p className="page-subtitle">
            {selectedDeptId
              ? `จำนวนครุภัณฑ์ในตาราง: ${filteredAssets.length} รายการ (สังกัด: ${departments.find((d) => d.id === selectedDeptId)?.name})`
              : `จำนวนครุภัณฑ์ทั้งหมด: ${filteredAssets.length} รายการ`}
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} />
          เพิ่มครุภัณฑ์ใหม่
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <Search
                size={18}
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
                placeholder="ค้นหารหัส, ชื่อครุภัณฑ์, สถานที่..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '40px', width: '100%' }}
              />
            </div>

            <div style={{ minWidth: '180px' }}>
              <select
                className="form-input"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">ทุกหมวดหมู่</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ minWidth: '150px' }}>
              <select
                className="form-input"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">ทุกสถานะ</option>
                <option value="ใช้งาน">ใช้งาน</option>
                <option value="ชำรุด">ชำรุด</option>
                <option value="จำหน่าย">จำหน่าย</option>
                <option value="ให้ยืม">ให้ยืม</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="loading">
              <Loader2 className="animate-spin text-primary" size={26} style={{ margin: '0 auto' }} />
              <p style={{ marginTop: '8px' }}>กำลังโหลดครุภัณฑ์...</p>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="empty-state">
              <Package />
              <p>ไม่พบรายการครุภัณฑ์ที่ค้นหา</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>รหัสครุภัณฑ์</th>
                    <th>ชื่อครุภัณฑ์</th>
                    <th>หมวดหมู่</th>
                    <th className="text-center">จำนวน</th>
                    <th className="text-right">ราคาต่อหน่วย</th>
                    <th className="text-right">มูลค่ารวม</th>
                    <th>สถานที่จัดเก็บ</th>
                    <th>สถานะ</th>
                    {profile?.role === 'admin' && <th>กองสังกัด</th>}
                    <th className="text-center" style={{ width: '110px' }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset) => {
                    const catName = categories.find((c) => c.id === asset.category_id)?.name || '-';
                    const deptShortName = departments.find((d) => d.id === asset.department_id)?.short_name || '-';

                    return (
                      <tr key={asset.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{asset.code}</td>
                        <td style={{ fontWeight: 500 }}>{asset.name}</td>
                        <td style={{ color: 'var(--text-mid)' }}>{catName}</td>
                        <td className="text-center">{formatNumber(asset.quantity)} {asset.unit}</td>
                        <td className="text-right">{formatMoney(Number(asset.unit_price))}</td>
                        <td className="text-right" style={{ fontWeight: 600, color: 'var(--text-dark)' }}>
                          {formatMoney(Number(asset.total_value))}
                        </td>
                        <td>{asset.location || '-'}</td>
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
                        {profile?.role === 'admin' && (
                          <td>
                            <span className="badge">{deptShortName}</span>
                          </td>
                        )}
                        <td className="text-center">
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              className="btn-icon btn-icon-edit"
                              onClick={() => openEditModal(asset)}
                              title="แก้ไขข้อมูลอย่างละเอียด"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className="btn-icon btn-icon-del"
                              onClick={() => handleDeleteClick(asset)}
                              title="ลบครุภัณฑ์"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Large Add / Edit Asset Modal */}
      <div className={`modal-backdrop ${modalOpen ? 'active' : ''}`}>
        <div className="modal modal-lg" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="modal-header">
            <h3>
              <Package size={20} />
              {editingAsset ? `แก้ไขครุภัณฑ์: ${code}` : 'เพิ่มครุภัณฑ์ใหม่ (37 ฟิลด์)'}
            </h3>
            <button className="modal-close" onClick={() => setModalOpen(false)}>
              <X size={18} />
            </button>
          </div>

          {/* Modal Tabs */}
          <div className="modal-tabs">
            <button
              type="button"
              className={`modal-tab ${activeTab === 'basic' ? 'active' : ''}`}
              onClick={() => setActiveTab('basic')}
            >
              <FileText size={14} />
              ข้อมูลทั่วไป
            </button>
            <button
              type="button"
              className={`modal-tab ${activeTab === 'detail' ? 'active' : ''}`}
              onClick={() => setActiveTab('detail')}
            >
              <Info size={14} />
              สถานะและข้อมูลดูแล
            </button>
            <button
              type="button"
              className={`modal-tab ${activeTab === 'finance' ? 'active' : ''}`}
              onClick={() => setActiveTab('finance')}
            >
              <DollarSign size={14} />
              งบประมาณและประกัน
            </button>
            <button
              type="button"
              className={`modal-tab ${activeTab === 'photo' ? 'active' : ''}`}
              onClick={() => setActiveTab('photo')}
            >
              <ImageIcon size={14} />
              รูปถ่ายครุภัณฑ์
            </button>
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div className="modal-body" style={{ overflowY: 'auto', flex: 1, maxHeight: '60vh' }}>

              {/* TAB 1: BASIC INFORMATION */}
              <div className={`tab-content ${activeTab === 'basic' ? 'active' : ''}`}>
                {profile?.role === 'admin' && !selectedDeptId && (
                  <div className="form-group">
                    <label className="form-label required">กอง/ฝ่ายที่ดูแลรับผิดชอบ</label>
                    <select
                      className="form-input"
                      value={targetDeptId}
                      onChange={(e) => setTargetDeptId(e.target.value)}
                      required
                    >
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label required">รหัสครุภัณฑ์</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="เช่น 7440-001-0001/67"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">ชื่อครุภัณฑ์</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="เช่น เครื่องปรับอากาศ ขนาด 12000 BTU"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">ประเภทครุภัณฑ์</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="เช่น ครุภัณฑ์สำนักงาน, ไฟฟ้าวิทยุ..."
                      value={assetType}
                      onChange={(e) => setAssetType(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">หมวดหมู่ระบบ</label>
                    <select
                      className="form-input"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                    >
                      <option value="">-- เลือกหมวดหมู่ --</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.code} - {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">ชื่อผู้ผลิต / ยี่ห้อ</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="เช่น Samsung, Toyota"
                      value={manufacturer}
                      onChange={(e) => setManufacturer(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">แบบ / ชนิด / ลักษณะ</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="เช่น ติดผนัง, เครื่องยนต์ 4 สูบ"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">หมายเลขลำดับ (Serial No.)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Serial Number"
                      value={serialNo}
                      onChange={(e) => setSerialNo(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">หมายเลขแผ่นป้ายทะเบียน</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="เช่น กข-1234 สระบุรี"
                      value={plateNo}
                      onChange={(e) => setPlateNo(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">หมายเลขเครื่องยนต์ (ถ้ามี)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={engineNo}
                      onChange={(e) => setEngineNo(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">หมายเลขตัวถัง / กรอบ (ถ้ามี)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={frameNo}
                      onChange={(e) => setFrameNo(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">สิ่งของที่ส่งมาด้วย (ของแถม/อุปกรณ์เสริม)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="เช่น รีโมทคอนโทรล, คู่มือการใช้งาน"
                      value={specialFeature}
                      onChange={(e) => setSpecialFeature(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">สถานที่จัดเก็บ / ติดตั้ง</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="เช่น ห้องประชุมชั้น 2 กองคลัง"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* TAB 2: STATUS & LOAN/DISPOSE */}
              <div className={`tab-content ${activeTab === 'detail' ? 'active' : ''}`}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">สถานะการใช้งาน</label>
                    <select
                      className="form-input"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="ใช้งาน">ใช้งานปกติ</option>
                      <option value="ชำรุด">ชำรุด</option>
                      <option value="จำหน่าย">จำหน่าย (ตัดชำรุด/ขายทอดตลาด)</option>
                      <option value="ให้ยืม">ให้ยืม (กองอื่นหรือภายนอกยืม)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">หมายเหตุทั่วไป</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="รายละเอียดหมายเหตุ"
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                    />
                  </div>
                </div>

                {/* Conditional fields based on status */}
                {status === 'ให้ยืม' && (
                  <div style={{ background: 'var(--info-light)', padding: '16px', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--info)', fontWeight: '700', marginBottom: '12px' }}>
                      ข้อมูลการให้ยืมครุภัณฑ์
                    </h4>
                    <div className="form-group">
                      <label className="form-label">ชื่อผู้ยืม / หน่วยงานที่ยืม</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="ระบุชื่อผู้ยืมหรือกองที่ขอยืม"
                        value={borrower}
                        onChange={(e) => setBorrower(e.target.value)}
                      />
                    </div>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">วันที่ยืม</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="เช่น 10 มิ.ย. 2567"
                          value={borrowDate}
                          onChange={(e) => setBorrowDate(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">กำหนดส่งคืน</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="เช่น 20 มิ.ย. 2567"
                          value={returnDate}
                          onChange={(e) => setReturnDate(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {status === 'จำหน่าย' && (
                  <div style={{ background: 'var(--warning-light)', padding: '16px', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--warning)', fontWeight: '700', marginBottom: '12px' }}>
                      ข้อมูลการจำหน่ายครุภัณฑ์
                    </h4>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">วันที่จำหน่าย</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="เช่น 10 มิ.ย. 2567"
                          value={disposeDate}
                          onChange={(e) => setDisposeDate(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">มูลค่าที่จำหน่ายได้ (บาท)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={disposalValue}
                          onChange={(e) => setDisposalValue(Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">กำไร / ขาดทุน จากการจำหน่าย (บาท)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={profitLoss}
                        onChange={(e) => setProfitLoss(Number(e.target.value))}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* TAB 3: FINANCE, WARRANTY & DEPRECIATION */}
              <div className={`tab-content ${activeTab === 'finance' ? 'active' : ''}`}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">วิธีได้มา</label>
                    <select
                      className="form-input"
                      value={acquisitionMethod || ''}
                      onChange={(e) => setAcquisitionMethod(e.target.value)}
                    >
                      <option value="งบประมาณท้องถิ่น">งบประมาณท้องถิ่น (ซื้อ/จ่าย)</option>
                      <option value="เงินบริจาค">เงินบริจาค/อุปถัมภ์</option>
                      <option value="โอนย้าย">การโอนจากส่วนราชการอื่น</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">วันที่ได้มา</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="เช่น 1 พ.ค. 2566"
                      value={acquisitionDate || ''}
                      onChange={(e) => setAcquisitionDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label required">จำนวน</label>
                    <input
                      type="number"
                      className="form-input"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">หน่วยนับ</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="เช่น เครื่อง, โต๊ะ, ตัว, คัน"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label required">ราคาต่อหน่วย (บาท)</label>
                    <input
                      type="number"
                      className="form-input"
                      min="0"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(Math.max(0, Number(e.target.value)))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">มูลค่ารวมทั้งหมด (บาท - คำนวณอัตโนมัติ)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formatMoney(totalValue)}
                      disabled
                      style={{ background: 'var(--border-light)', fontWeight: '600' }}
                    />
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', padding: '14px 0 6px', marginTop: '10px' }}>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '10px' }}>
                    การรับประกันผลประโยชน์ครุภัณฑ์
                  </h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">ระยะรับประกัน (เดือน)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={warrantyMonths}
                        onChange={(e) => setWarrantyMonths(Number(e.target.value))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">วันสิ้นสุดประกัน</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="เช่น 31 พ.ค. 2568"
                        value={warrantyEndDate}
                        onChange={(e) => setWarrantyEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">บริษัทผู้ให้ประกัน / ติดต่อ</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="ระบุบริษัทและเบอร์โทรติดต่อช่างซ่อมประกัน"
                      value={warrantyCompany}
                      onChange={(e) => setWarrantyCompany(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', padding: '14px 0 6px', marginTop: '10px' }}>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '10px' }}>
                    อัตราค่าเสื่อมราคารายปี (%) — ใช้คำนวณ พ.ด. ๒
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ textAlign: 'center' }}>ปีที่ 1</label>
                      <input type="text" className="form-input text-center" value={dep1} onChange={(e) => setDep1(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ textAlign: 'center' }}>ปีที่ 2</label>
                      <input type="text" className="form-input text-center" value={dep2} onChange={(e) => setDep2(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ textAlign: 'center' }}>ปีที่ 3</label>
                      <input type="text" className="form-input text-center" value={dep3} onChange={(e) => setDep3(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ textAlign: 'center' }}>ปีที่ 4</label>
                      <input type="text" className="form-input text-center" value={dep4} onChange={(e) => setDep4(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ textAlign: 'center' }}>ปีที่ 5</label>
                      <input type="text" className="form-input text-center" value={dep5} onChange={(e) => setDep5(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>

              {/* TAB 4: PHOTO UPLOAD */}
              <div className={`tab-content ${activeTab === 'photo' ? 'active' : ''}`}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-mid)', marginBottom: '10px' }}>
                  คุณสามารถอัปโหลดภาพถ่ายครุภัณฑ์ได้สูงสุด 2 ภาพ ระบบจะทำการประมวลผลจัดเก็บลงในระบบคลาวด์ Supabase Storage
                </p>
                <PhotoUploader photoUrls={photoUrls} onChange={setPhotoUrls} />
              </div>

            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>
                ยกเลิก
              </button>
              <button type="submit" className="btn btn-primary" disabled={modalLoading}>
                {modalLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>กำลังบันทึกครุภัณฑ์...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>บันทึกครุภัณฑ์</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="ยืนยันการลบครุภัณฑ์"
        message={`คุณแน่ใจที่จะลบครุภัณฑ์รหัส "${assetToDelete?.code}" (${assetToDelete?.name})? การดำเนินการนี้จะรวมถึงลบประวัติการซ่อมทั้งหมดด้วย`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
}
