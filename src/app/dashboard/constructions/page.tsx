'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import { FolderTree, Plus, Edit2, Trash2, Loader2, Save, X, Search as SearchIcon, FileText, Printer } from 'lucide-react';
import type { Construction, ConstructionRepair, Department } from '@/types/database';

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
  const [activeTab, setActiveTab] = useState<'basic' | 'dimension' | 'land' | 'depreciation' | 'repairs'>('basic');

  // New Custom States
  const [selectedMoo, setSelectedMoo] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState('');
  const [acqDay, setAcqDay] = useState('');
  const [acqMonth, setAcqMonth] = useState('');
  const [acqYear, setAcqYear] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const MOO_OPTIONS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  const COMMUNITY_MAP: Record<string, string[]> = {
    '1': ['ชุมชนเขามัน', 'ชุมชนบ้านใหม่ (ผาเสด็จ)', 'ชุมชนบ้านป่าแดง', 'ชุมชนบ้านริมภู'],
    '2': ['ชุมชนบ้านทุ่งเศรษฐี', 'ชุมชนเพชรไผ่ทอง ๑', 'ชุมชนเพชรไผ่ทอง ๒'],
    '3': ['ชุมชนบ้านไทย', 'ชุมชนหน้าวัดเขามัน', 'ชุมชนหนองปู ๙๓'],
    '4': ['ชุมชนหัววังยาว', 'ชุมชนบ้านเหนือวัดทับกวาง', 'ชุมชนบ้านใหม่', 'ชุมชนบ้านสะพานสาม'],
    '5': ['ชุมชนแผ่นดินทอง', 'ชุมชนบ้านซับบอนพัฒนา'],
    '6': ['ชุมชนหัวเขาพัฒนา', 'ชุมชนเขาเกตุ', 'ชุมชนบ้านโป่งพัฒนา'],
    '7': ['ชุมชนหนองบัวบาน', 'ชุมชนมิตรภาพร่วมใจ', 'ชุมชนดินสอพอง', 'ชุมชนบ้านโคกพัฒนา', 'ชุมชนหนองผักบุ้ง', 'ชุมชนหินดาดพัฒนา', 'ชุมชนบ้านสะพานสอง'],
    '8': ['ชุมชนคุ้มไผ่ทอง', 'ชุมชนบ้านป่าไผ่เหนือ'],
    '9': ['ชุมชนเฟื่องฟ้า', 'ชุมชนนิคมพัฒนา', 'ชุมชนบ้านเจริญพร', 'ชุมชนบ้านจัดสรร', 'ชุมชนทับกวาง'],
    '10': ['ชุมชนเกษตรสัมพันธ์', 'ชุมชนบ้านถ้ำพัฒนา', 'ชุมชนบ้านน้ำพุ']
  };

  const handleRegistryCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 3) val = val.slice(0, 3) + '-' + val.slice(3);
    if (val.length > 6) val = val.slice(0, 6) + '-' + val.slice(6);
    if (val.length > 11) val = val.slice(0, 11);
    updateField('registry_code', val);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Form Fields
  const [form, setForm] = useState<Partial<Construction>>({
    registry_code: '',
    construction_type: 'คมนาคม',
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
    photo_urls: [],
  });

  // Delete Confirm State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Construction | null>(null);

  // Repair Form State
  const [newRepair, setNewRepair] = useState<Partial<ConstructionRepair>>({
    repair_date: '',
    detail: '',
    amount: 0,
    contractor: '',
    remark: ''
  });
  const [repairLoading, setRepairLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase.from('constructions').select('*, construction_repairs(*)');
      if (selectedDeptId) {
        query = query.eq('department_id', selectedDeptId);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      
      // Update editingConstruction if modal is open
      if (editingConstruction && data) {
        const updated = data.find(c => c.id === editingConstruction.id);
        if (updated) setEditingConstruction(updated);
      }
      
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
      construction_type: 'คมนาคม',
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
      photo_urls: [],
    });
    setSelectedMoo('');
    setSelectedCommunity('');
    setAcqDay('');
    setAcqMonth('');
    setAcqYear('');
    setPreviewUrl('');
    setActiveTab('basic');
    setModalOpen(true);
  };

  const openEditModal = (item: Construction) => {
    setEditingConstruction(item);
    setForm({ ...item, construction_type: 'คมนาคม' });
    
    // Parse Location
    let initialMoo = '';
    let initialCommunity = '';
    if (item.location) {
      const mooMatch = item.location.match(/หมู่ที่ (\d+)/);
      if (mooMatch) initialMoo = mooMatch[1];
      for (const commList of Object.values(COMMUNITY_MAP)) {
        for (const comm of commList) {
          if (item.location.includes(comm)) {
            initialCommunity = comm;
          }
        }
      }
    }
    setSelectedMoo(initialMoo);
    setSelectedCommunity(initialCommunity);

    // Parse Date
    if (item.acquisition_date) {
      const parts = item.acquisition_date.split('-');
      if (parts.length === 3) {
        setAcqYear((parseInt(parts[0]) + 543).toString());
        setAcqMonth(parts[1]);
        setAcqDay(parseInt(parts[2]).toString());
      }
    } else {
      setAcqDay(''); setAcqMonth(''); setAcqYear('');
    }

    // Photo
    if (item.photo_urls && item.photo_urls.length > 0) {
      setPreviewUrl(item.photo_urls[0]);
    } else {
      setPreviewUrl('');
    }

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
      dataToSave.construction_type = 'คมนาคม';
      
      if (selectedMoo && selectedCommunity) {
        dataToSave.location = `หมู่ที่ ${selectedMoo} ${selectedCommunity}`;
      } else {
        dataToSave.location = '';
      }

      if (acqYear && acqMonth && acqDay) {
        const ceYear = parseInt(acqYear) - 543;
        const mm = acqMonth.padStart(2, '0');
        const dd = acqDay.padStart(2, '0');
        dataToSave.acquisition_date = `${ceYear}-${mm}-${dd}`;
      } else {
        dataToSave.acquisition_date = null;
      }

      if (previewUrl) {
        dataToSave.photo_urls = [previewUrl];
      } else {
        dataToSave.photo_urls = [];
      }

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
    const cleanSearch = searchQuery.replace(/-/g, '').toLowerCase();
    const cleanRegistry = (c.registry_code || '').replace(/-/g, '').toLowerCase();
    const matchSearch = (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || cleanRegistry.includes(cleanSearch);
    return matchSearch;
  });

  const handleAddRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConstruction) return;
    setRepairLoading(true);
    try {
      const { error } = await supabase.from('construction_repairs').insert([{
        construction_id: editingConstruction.id,
        repair_date: newRepair.repair_date || null,
        detail: newRepair.detail,
        amount: newRepair.amount || 0,
        contractor: newRepair.contractor,
        remark: newRepair.remark,
        department_id: editingConstruction.department_id
      }]);
      if (error) throw error;
      showToast('เพิ่มรายการซ่อมสำเร็จ');
      setNewRepair({ repair_date: '', detail: '', amount: 0, contractor: '', remark: '' });
      fetchData();
    } catch (err: any) {
      showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
    } finally {
      setRepairLoading(false);
    }
  };

  const handleDeleteRepair = async (repairId: string) => {
    if (!confirm('ยืนยันการลบรายการซ่อมนี้?')) return;
    try {
      const { error } = await supabase.from('construction_repairs').delete().eq('id', repairId);
      if (error) throw error;
      showToast('ลบรายการซ่อมสำเร็จ');
      fetchData();
    } catch (err: any) {
      showToast('ไม่สามารถลบรายการได้: ' + err.message, 'error');
    }
  };

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
        <div className="card-header" style={{ display: 'flex', padding: '20px', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border)' }}>
          <div className="search-box" style={{ flex: 1, maxWidth: '500px', display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '8px', padding: '8px 16px', border: '1px solid var(--border)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <SearchIcon size={20} className="search-icon" style={{ color: '#888', marginRight: '12px' }} />
            <input
              type="text"
              placeholder="ค้นหาด้วยเลขรหัสพัสดุ (เช่น 143640019) หรือชื่อพัสดุ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '15px' }}
            />
          </div>
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
                      <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{item.registry_code}</td>
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
                          <button className="btn-icon" style={{ background: '#E0F2FE', color: '#0369A1' }} onClick={() => window.open(`/dashboard/constructions/${item.id}/print`, '_blank')} title="พิมพ์แบบ พ.ด.1">
                            <Printer size={14} />
                          </button>
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
            <button type="button" className={`modal-tab ${activeTab === 'repairs' ? 'active' : ''}`} onClick={() => setActiveTab('repairs')}>บันทึกการซ่อม/ปรับปรุง</button>
          </div>

          <form onSubmit={handleSave}>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {activeTab === 'basic' && (
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label required">เลขรหัสพัสดุ</label>
                      <input type="text" className="form-input" placeholder="000-00-0000" value={form.registry_code} onChange={handleRegistryCodeChange} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label required">ประเภท</label>
                      <input type="text" className="form-input bg-gray-100" value="คมนาคม" readOnly />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label required">ชื่อพัสดุ</label>
                    <input type="text" className="form-input" value={form.name || ''} onChange={e => updateField('name', e.target.value)} required />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label required">ที่ตั้งพัสดุ (หมู่ที่)</label>
                      <select className="form-input" value={selectedMoo} onChange={e => { setSelectedMoo(e.target.value); setSelectedCommunity(''); }} required>
                        <option value="">-- เลือกหมู่ที่ --</option>
                        {MOO_OPTIONS.map(moo => <option key={moo} value={moo}>หมู่ที่ {moo}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label required">ที่ตั้งพัสดุ (ชุมชน)</label>
                      <select className="form-input" value={selectedCommunity} onChange={e => setSelectedCommunity(e.target.value)} disabled={!selectedMoo} required>
                        <option value="">-- เลือกชุมชน --</option>
                        {selectedMoo && COMMUNITY_MAP[selectedMoo]?.map(comm => <option key={comm} value={comm}>{comm}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">ราคา/มูลค่า (บาท)</label>
                      <input type="number" className="form-input" value={form.price} onChange={e => updateField('price', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">ชื่อผู้รับจ้าง/ผู้ขาย/ผู้ให้</label>
                      <input type="text" className="form-input" value={form.contract_no || ''} onChange={e => updateField('contract_no', e.target.value)} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label required">ซื้อ/จ้าง/ได้มา เมื่อวันที่</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      <select className="form-input" value={acqDay} onChange={e => setAcqDay(e.target.value)} required>
                        <option value="">-- วันที่ --</option>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <select className="form-input" value={acqMonth} onChange={e => setAcqMonth(e.target.value)} required>
                        <option value="">-- เดือน --</option>
                        <option value="01">มกราคม</option>
                        <option value="02">กุมภาพันธ์</option>
                        <option value="03">มีนาคม</option>
                        <option value="04">เมษายน</option>
                        <option value="05">พฤษภาคม</option>
                        <option value="06">มิถุนายน</option>
                        <option value="07">กรกฎาคม</option>
                        <option value="08">สิงหาคม</option>
                        <option value="09">กันยายน</option>
                        <option value="10">ตุลาคม</option>
                        <option value="11">พฤศจิกายน</option>
                        <option value="12">ธันวาคม</option>
                      </select>
                      <input type="text" className="form-input" placeholder="ปี พ.ศ. (เช่น 2569)" value={acqYear} onChange={e => setAcqYear(e.target.value.replace(/\D/g, '').slice(0, 4))} required />
                    </div>
                  </div>

                  <h4 style={{ margin: '16px 0 8px 0', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>อื่นๆ</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">ขนาด กว้าง (เมตร)</label>
                      <input type="number" step="0.01" className="form-input" value={form.width_m} onChange={e => updateField('width_m', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">ยาว (เมตร)</label>
                      <input type="number" step="0.01" className="form-input" value={form.length_m} onChange={e => updateField('length_m', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">หนา (เมตร)</label>
                      <input type="number" step="0.001" className="form-input" value={form.thickness_m} onChange={e => updateField('thickness_m', parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">หรือพื้นที่ก่อสร้างไม่น้อยกว่า (ตารางเมตร)</label>
                    <input type="number" step="0.01" className="form-input" value={form.area_sqm} onChange={e => updateField('area_sqm', parseFloat(e.target.value) || 0)} />
                  </div>

                  <h4 style={{ margin: '16px 0 8px 0', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>การเปลี่ยนแปลงส่วนราชการและผู้ดูแลรับผิดชอบ</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">พ.ศ.</label>
                      <input type="text" className="form-input" placeholder="ปี พ.ศ." value={form.fiscal_year || ''} onChange={e => updateField('fiscal_year', e.target.value.replace(/\D/g, '').slice(0, 4))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">ชื่อส่วนราชการ (สำนัก,กอง,ฝ่าย)</label>
                      <select className="form-input" value={form.department_id} onChange={(e) => updateField('department_id', e.target.value)}>
                        <option value="">-- เลือกส่วนราชการ --</option>
                        {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">ชื่อหัวหน้าส่วนราชการ</label>
                    <input type="text" className="form-input" value={form.responsible_officer || ''} onChange={e => updateField('responsible_officer', e.target.value)} />
                  </div>

                  <h4 style={{ margin: '16px 0 8px 0', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>รูปถ่าย</h4>
                  <div className="form-group">
                    <input type="file" accept="image/*" className="form-input" onChange={handleFileChange} />
                    {previewUrl && (
                      <div style={{ marginTop: '12px' }}>
                        <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                      </div>
                    )}
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

              {activeTab === 'repairs' && !editingConstruction && (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748B' }}>
                  <FolderTree size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                  <p>กรุณาบันทึกข้อมูลหลักของสิ่งก่อสร้างให้เสร็จสิ้นก่อน<br/>จึงจะสามารถเพิ่มประวัติการซ่อมบำรุงได้</p>
                </div>
              )}

              {activeTab === 'repairs' && editingConstruction && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <h4 style={{ marginBottom: '12px', fontSize: '0.9rem' }}>เพิ่มรายการซ่อม/ปรับปรุง</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <input type="date" className="form-input" value={newRepair.repair_date || ''} onChange={e => setNewRepair({ ...newRepair, repair_date: e.target.value })} required />
                      <input type="text" className="form-input" placeholder="รายการซ่อม/ปรับปรุงแก้ไข" value={newRepair.detail || ''} onChange={e => setNewRepair({ ...newRepair, detail: e.target.value })} required />
                      <input type="number" className="form-input" placeholder="จำนวนเงิน (บาท)" value={newRepair.amount || ''} onChange={e => setNewRepair({ ...newRepair, amount: parseFloat(e.target.value) || 0 })} required />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px' }}>
                      <input type="text" className="form-input" placeholder="ชื่อผู้รับจ้าง/ผู้รับทำ" value={newRepair.contractor || ''} onChange={e => setNewRepair({ ...newRepair, contractor: e.target.value })} />
                      <input type="text" className="form-input" placeholder="หมายเหตุ" value={newRepair.remark || ''} onChange={e => setNewRepair({ ...newRepair, remark: e.target.value })} />
                      <button type="button" className="btn btn-primary" onClick={handleAddRepair} disabled={repairLoading || !newRepair.detail}>
                        {repairLoading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                        เพิ่มรายการ
                      </button>
                    </div>
                  </div>

                  <table style={{ width: '100%', fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>วัน เดือน ปี</th>
                        <th>รายการซ่อม</th>
                        <th className="text-right">จำนวนเงิน</th>
                        <th>ผู้รับจ้าง</th>
                        <th>หมายเหตุ</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {editingConstruction.construction_repairs?.map(r => (
                        <tr key={r.id}>
                          <td>{r.repair_date ? new Date(r.repair_date).toLocaleDateString('th-TH') : '-'}</td>
                          <td>{r.detail}</td>
                          <td className="text-right">{r.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td>{r.contractor || '-'}</td>
                          <td>{r.remark || '-'}</td>
                          <td className="text-right">
                            <button type="button" className="btn-icon btn-icon-del" onClick={() => handleDeleteRepair(r.id)}><Trash2 size={12} /></button>
                          </td>
                        </tr>
                      ))}
                      {(!editingConstruction.construction_repairs || editingConstruction.construction_repairs.length === 0) && (
                        <tr><td colSpan={6} className="text-center text-muted" style={{ padding: '20px' }}>ยังไม่มีประวัติการซ่อมบำรุง</td></tr>
                      )}
                    </tbody>
                  </table>
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
