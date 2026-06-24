'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import { FolderTree, Plus, Edit2, Trash2, Loader2, Save, X, Search as SearchIcon, FileText } from 'lucide-react';
import type { Construction, Department } from '@/types/database';

export default function ConstructionsPage() {
  const { profile, selectedDeptId, departments } = useAuth();
  const { showToast } = useToast();

  const [constructions, setConstructions] = useState<Construction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConstruction, setEditingConstruction] = useState<Construction | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'dimension' | 'land' | 'depreciation'>('basic');

  // Form Fields
  const [form, setForm] = useState<Partial<Construction>>({
    registry_code: '',
    construction_type: 'สิ่งก่อสร้าง',
    name: '',
    description: '',
    location: '',
    procurement_method: '',
    acquisition_date: '',
    contract_no: '',
    price: 0,
    fiscal_year: '',
    width_m: 0,
    length_m: 0,
    thickness_m: 0,
    lanes: 0,
    shoulder_width_m: 0,
    area_sqm: 0,
    land_type: '',
    land_rai: 0,
    land_ngan: 0,
    land_sqwa: 0,
    has_building: false,
    building_completed: false,
    building_no: '',
    building_cost: 0,
    useful_life_years: 0,
    responsible_officer: '',
    status: 'ใช้งาน',
    remark: '',
    department_id: '',
  });

  // Delete Confirm State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Construction | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase.from('constructions').select('*');
      if (selectedDeptId) {
        query = query.eq('department_id', selectedDeptId);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setConstructions(data || []);
    } catch (err: any) {
      showToast('ไม่สามารถโหลดข้อมูลสิ่งก่อสร้างได้: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchData();
    }
  }, [selectedDeptId, profile]);

  const openAddModal = () => {
    setEditingConstruction(null);
    setForm({
      registry_code: '',
      construction_type: 'สิ่งก่อสร้าง',
      name: '',
      description: '',
      location: '',
      procurement_method: '',
      acquisition_date: '',
      contract_no: '',
      price: 0,
      fiscal_year: '',
      width_m: 0,
      length_m: 0,
      thickness_m: 0,
      lanes: 0,
      shoulder_width_m: 0,
      area_sqm: 0,
      land_type: '',
      land_rai: 0,
      land_ngan: 0,
      land_sqwa: 0,
      has_building: false,
      building_completed: false,
      building_no: '',
      building_cost: 0,
      useful_life_years: 0,
      responsible_officer: '',
      status: 'ใช้งาน',
      remark: '',
      department_id: profile?.role === 'admin' ? '' : (profile?.department_id || ''),
    });
    setActiveTab('basic');
    setModalOpen(true);
  };

  const openEditModal = (item: Construction) => {
    setEditingConstruction(item);
    setForm({ ...item });
    setActiveTab('basic');
    setModalOpen(true);
  };

  const updateField = (field: keyof Construction, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);

    const deptIdToSave = profile?.role === 'admin' ? form.department_id : profile?.department_id;
    if (!deptIdToSave) {
      showToast('กรุณาระบุส่วนราชการ', 'warning');
      setModalLoading(false);
      return;
    }

    try {
      const dataToSave = { ...form, department_id: deptIdToSave };

      if (editingConstruction) {
        const { error } = await supabase
          .from('constructions')
          .update(dataToSave)
          .eq('id', editingConstruction.id);
        if (error) throw error;
        showToast('แก้ไขข้อมูลสำเร็จ');
      } else {
        const { error } = await supabase.from('constructions').insert([dataToSave]);
        if (error) throw error;
        showToast('เพิ่มข้อมูลสำเร็จ');
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteClick = (item: Construction) => {
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setDeleteConfirmOpen(false);
    try {
      const { error } = await supabase
        .from('constructions')
        .delete()
        .eq('id', itemToDelete.id);
      if (error) throw error;
      showToast('ลบข้อมูลเรียบร้อยแล้ว');
      fetchData();
    } catch (err: any) {
      showToast('ไม่สามารถลบข้อมูลได้: ' + err.message, 'error');
    } finally {
      setItemToDelete(null);
    }
  };

  const filteredData = constructions.filter(c => {
    const matchSearch = (c.name || '').includes(searchQuery) || (c.registry_code || '').includes(searchQuery);
    const matchType = filterType ? c.construction_type === filterType : true;
    return matchSearch && matchType;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <FolderTree size={24} />
            ทะเบียนพัสดุที่ดินและสิ่งก่อสร้าง (พ.ด.1)
          </h2>
          <p className="page-subtitle">
            {selectedDeptId
              ? `สังกัด: ${departments.find((d) => d.id === selectedDeptId)?.name}`
              : 'แสดงสิ่งก่อสร้างทั้งหมดของทุกส่วนราชการ'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} />
          เพิ่มสิ่งก่อสร้างใหม่
        </button>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', gap: '16px', padding: '16px', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border)' }}>
          <div className="search-box" style={{ flex: 1, maxWidth: '300px' }}>
            <SearchIcon size={18} className="search-icon" />
            <input
              type="text"
              placeholder="ค้นหารหัส หรือชื่อสิ่งก่อสร้าง..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <select
            className="form-input"
            style={{ width: '200px' }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">-- ทุกประเภท --</option>
            <option value="ที่ดิน">ที่ดิน</option>
            <option value="ถนน">ถนน</option>
            <option value="อาคาร">อาคาร</option>
            <option value="สะพาน">สะพาน</option>
            <option value="ท่อระบายน้ำ">ท่อระบายน้ำ</option>
            <option value="สิ่งก่อสร้างอื่นๆ">สิ่งก่อสร้างอื่นๆ</option>
          </select>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="loading">
              <Loader2 className="animate-spin text-primary" size={26} style={{ margin: '0 auto' }} />
              <p style={{ marginTop: '8px' }}>กำลังโหลดข้อมูล...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="empty-state">
              <FolderTree />
              <p>ยังไม่มีข้อมูลสิ่งก่อสร้างในระบบ</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>รหัสพัสดุ</th>
                    <th>ชื่อสิ่งก่อสร้าง/ที่ดิน</th>
                    <th>ประเภท</th>
                    <th>ราคา/มูลค่า</th>
                    {profile?.role === 'admin' && <th>ส่วนราชการ</th>}
                    <th className="text-center" style={{ width: '120px' }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.registry_code}</td>
                      <td>{item.name}</td>
                      <td>{item.construction_type}</td>
                      <td>฿{item.price?.toLocaleString()}</td>
                      {profile?.role === 'admin' && (
                        <td>
                          <span className="badge">
                            {departments.find((d) => d.id === item.department_id)?.short_name || 'ไม่ระบุ'}
                          </span>
                        </td>
                      )}
                      <td className="text-center">
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button className="btn-icon btn-icon-edit" onClick={() => openEditModal(item)} title="แก้ไข">
                            <Edit2 size={14} />
                          </button>
                          <button className="btn-icon btn-icon-del" onClick={() => handleDeleteClick(item)} title="ลบ">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      <div className={`modal-backdrop ${modalOpen ? 'active' : ''}`}>
        <div className="modal modal-lg">
          <div className="modal-header">
            <h3>
              <FileText size={20} />
              {editingConstruction ? 'แก้ไขข้อมูลพัสดุที่ดินและสิ่งก่อสร้าง' : 'เพิ่มข้อมูลใหม่'}
            </h3>
            <button className="modal-close" onClick={() => setModalOpen(false)}>
              <X size={18} />
            </button>
          </div>
          
          <div className="modal-tabs">
            <button type="button" className={`modal-tab ${activeTab === 'basic' ? 'active' : ''}`} onClick={() => setActiveTab('basic')}>ข้อมูลหลัก</button>
            <button type="button" className={`modal-tab ${activeTab === 'dimension' ? 'active' : ''}`} onClick={() => setActiveTab('dimension')}>ขนาดและมิติ</button>
            <button type="button" className={`modal-tab ${activeTab === 'land' ? 'active' : ''}`} onClick={() => setActiveTab('land')}>ข้อมูลที่ดินและอาคาร</button>
          </div>

          <form onSubmit={handleSave}>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {activeTab === 'basic' && (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {profile?.role === 'admin' && !selectedDeptId && (
                    <div className="form-group">
                      <label className="form-label required">ส่วนราชการ</label>
                      <select className="form-input" value={form.department_id} onChange={(e) => updateField('department_id', e.target.value)} required>
                        <option value="">-- เลือกส่วนราชการ --</option>
                        {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                      </select>
                    </div>
                  )}
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label required">รหัสพัสดุ</label>
                      <input type="text" className="form-input" value={form.registry_code} onChange={e => updateField('registry_code', e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label required">ประเภท</label>
                      <select className="form-input" value={form.construction_type} onChange={e => updateField('construction_type', e.target.value)} required>
                        <option value="ที่ดิน">ที่ดิน</option>
                        <option value="ถนน">ถนน</option>
                        <option value="อาคาร">อาคาร</option>
                        <option value="สะพาน">สะพาน</option>
                        <option value="ท่อระบายน้ำ">ท่อระบายน้ำ</option>
                        <option value="สิ่งก่อสร้างอื่นๆ">สิ่งก่อสร้างอื่นๆ</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label required">รูปพรรณ / ชื่อสิ่งก่อสร้าง</label>
                    <input type="text" className="form-input" value={form.name || ''} onChange={e => updateField('name', e.target.value)} required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">ที่ตั้ง (ซอย/ถนน/หมู่/ตำบล)</label>
                    <input type="text" className="form-input" value={form.location || ''} onChange={e => updateField('location', e.target.value)} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">วิธีจัดหา (เงินงบประมาณ/เงินสะสม)</label>
                      <input type="text" className="form-input" value={form.procurement_method || ''} onChange={e => updateField('procurement_method', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">ราคา/มูลค่า (บาท)</label>
                      <input type="number" className="form-input" value={form.price} onChange={e => updateField('price', parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">วันที่ได้มา</label>
                      <input type="date" className="form-input" value={form.acquisition_date || ''} onChange={e => updateField('acquisition_date', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">เลขที่สัญญา/ข้อตกลง</label>
                      <input type="text" className="form-input" value={form.contract_no || ''} onChange={e => updateField('contract_no', e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'dimension' && (
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div className="alert alert-info">
                    <strong>หมายเหตุ:</strong> ส่วนนี้สำหรับบันทึกรายละเอียดของ ถนน, สะพาน หรือท่อระบายน้ำ
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">ความกว้าง (เมตร)</label>
                      <input type="number" step="0.01" className="form-input" value={form.width_m} onChange={e => updateField('width_m', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">ความยาว (เมตร)</label>
                      <input type="number" step="0.01" className="form-input" value={form.length_m} onChange={e => updateField('length_m', parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">ความหนา (เมตร)</label>
                      <input type="number" step="0.001" className="form-input" value={form.thickness_m} onChange={e => updateField('thickness_m', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">พื้นที่รวม (ตร.ม.)</label>
                      <input type="number" step="0.01" className="form-input" value={form.area_sqm} onChange={e => updateField('area_sqm', parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">จำนวนช่องจราจร</label>
                      <input type="number" className="form-input" value={form.lanes} onChange={e => updateField('lanes', parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">ความกว้างไหล่ทาง (เมตร)</label>
                      <input type="number" step="0.01" className="form-input" value={form.shoulder_width_m} onChange={e => updateField('shoulder_width_m', parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'land' && (
                <div style={{ display: 'grid', gap: '16px' }}>
                  <h4 style={{ margin: '0', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>ข้อมูลที่ดิน</h4>
                  <div className="form-group">
                    <label className="form-label">ประเภทที่ดิน (เช่น มีทะเบียนท้อง/ถนนสาธารณะ)</label>
                    <input type="text" className="form-input" value={form.land_type || ''} onChange={e => updateField('land_type', e.target.value)} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">เนื้อที่ (ไร่)</label>
                      <input type="number" className="form-input" value={form.land_rai} onChange={e => updateField('land_rai', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">เนื้อที่ (งาน)</label>
                      <input type="number" className="form-input" value={form.land_ngan} onChange={e => updateField('land_ngan', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">เนื้อที่ (ตร.วา)</label>
                      <input type="number" className="form-input" value={form.land_sqwa} onChange={e => updateField('land_sqwa', parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>

                  <h4 style={{ margin: '16px 0 0 0', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>ข้อมูลโรงเรือน/อาคาร</h4>
                  <div style={{ display: 'flex', gap: '24px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.has_building} onChange={e => updateField('has_building', e.target.checked)} />
                      <span>มีโรงเรือน/อาคารตั้งอยู่</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.building_completed} onChange={e => updateField('building_completed', e.target.checked)} />
                      <span>ก่อสร้างเสร็จแล้ว</span>
                    </label>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">เลขที่ตึก/อาคาร</label>
                      <input type="text" className="form-input" value={form.building_no || ''} onChange={e => updateField('building_no', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">ราคาอาคาร (บาท)</label>
                      <input type="number" className="form-input" value={form.building_cost} onChange={e => updateField('building_cost', parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>
                ยกเลิก
              </button>
              <button type="submit" className="btn btn-primary" disabled={modalLoading}>
                {modalLoading ? <><Loader2 className="animate-spin" size={16} /> กำลังบันทึก...</> : <><Save size={16} /> บันทึกข้อมูล</>}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="ยืนยันการลบข้อมูล"
        message={`คุณแน่ใจหรือไม่ที่จะลบข้อมูล "${itemToDelete?.name}"?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
}
