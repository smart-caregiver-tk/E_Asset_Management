'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import { FolderTree, Plus, Edit2, Trash2, Loader2, Save, X } from 'lucide-react';
import type { Category } from '@/types/database';

export default function CategoriesPage() {
  const { profile, selectedDeptId, departments } = useAuth();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form Fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetDeptId, setTargetDeptId] = useState('');

  // Delete Confirm State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      let query = supabase.from('categories').select('*');
      if (selectedDeptId) {
        query = query.eq('department_id', selectedDeptId);
      }
      const { data, error } = await query.order('code');
      if (error) throw error;
      setCategories(data || []);
    } catch (err: any) {
      showToast('ไม่สามารถโหลดข้อมูลประเภทครุภัณฑ์ได้: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchCategories();
    }
  }, [selectedDeptId, profile]);

  const openAddModal = () => {
    setEditingCategory(null);
    setCode('');
    setName('');
    setDescription('');
    // Admin: default = '' (ทุกหน่วยงาน), Department user: default = กองตัวเอง
    setTargetDeptId(selectedDeptId || '');
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setCode(cat.code);
    setName(cat.name);
    setDescription(cat.description || '');
    setTargetDeptId(cat.department_id);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);

    const isAllDepts = profile?.role === 'admin' && !targetDeptId;
    const deptIdToSave = profile?.role === 'admin' ? targetDeptId : profile?.department_id;

    // ผู้ใช้ทั่วไปต้องมี department_id เสมอ
    if (profile?.role !== 'admin' && !deptIdToSave) {
      showToast('กรุณาระบุส่วนราชการ', 'warning');
      setModalLoading(false);
      return;
    }
    // Admin ที่ไม่ได้เลือกทั้งสองอย่าง
    if (profile?.role === 'admin' && !isAllDepts && !deptIdToSave) {
      showToast('กรุณาระบุส่วนราชการ', 'warning');
      setModalLoading(false);
      return;
    }

    try {
      if (editingCategory) {
        // แก้ไข: อัปเดตเฉพาะ row นี้ (1 รายการ) — ไม่ sync ข้าม dept
        const { error } = await supabase
          .from('categories')
          .update({ code, name, description })
          .eq('id', editingCategory.id);
        if (error) throw error;
        showToast('แก้ไขประเภทครุภัณฑ์สำเร็จ (แก้ไขเฉพาะรายการนี้เท่านั้น)');

      } else if (isAllDepts) {
        // [Admin] เพิ่มแบบ "ทุกหน่วยงาน"
        // ตรวจสอบว่า dept ไหนมีรหัสนี้อยู่แล้ว → ข้ามเพื่อกันซ้ำ
        const { data: existing } = await supabase
          .from('categories')
          .select('department_id')
          .eq('code', code);

        const existingDeptIds = new Set((existing || []).map((e: any) => e.department_id));
        const depsToInsert = departments.filter((d) => !existingDeptIds.has(d.id));
        const skippedCount = departments.length - depsToInsert.length;

        if (depsToInsert.length === 0) {
          showToast(`ประเภทครุภัณฑ์รหัส "${code}" มีอยู่ในทุกส่วนราชการแล้ว ไม่มีการเพิ่มใหม่`, 'warning');
          setModalLoading(false);
          return;
        }

        const insertRows = depsToInsert.map((dept) => ({
          code, name, description, department_id: dept.id,
        }));

        const { error } = await supabase.from('categories').insert(insertRows);
        if (error) throw error;

        if (skippedCount > 0) {
          showToast(`เพิ่ม "${name}" ให้ ${depsToInsert.length} ส่วนราชการ (ข้าม ${skippedCount} ที่มีอยู่แล้ว) ✅`);
        } else {
          showToast(`เพิ่ม "${name}" ให้ครบทั้ง ${departments.length} ส่วนราชการแล้ว ✅`);
        }

      } else {
        // [Admin หรือ Department] เพิ่มแบบ dept เดียว — ตรวจสอบซ้ำก่อน
        const { data: existing } = await supabase
          .from('categories')
          .select('id')
          .eq('code', code)
          .eq('department_id', deptIdToSave);

        if (existing && existing.length > 0) {
          showToast(`ประเภทครุภัณฑ์รหัส "${code}" มีอยู่ในส่วนราชการนี้แล้ว`, 'warning');
          setModalLoading(false);
          return;
        }

        const { error } = await supabase.from('categories').insert({
          code, name, description, department_id: deptIdToSave,
        });
        if (error) throw error;
        showToast('เพิ่มประเภทครุภัณฑ์สำเร็จ');
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteClick = (cat: Category) => {
    setCategoryToDelete(cat);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    setDeleteConfirmOpen(false);

    try {
      // Check if there are assets using this category
      const { count, error: countError } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryToDelete.id);

      if (countError) throw countError;

      if (count && count > 0) {
        showToast(`ไม่สามารถลบได้ เนื่องจากมีครุภัณฑ์จำนวน ${count} รายการใช้งานประเภทนี้อยู่`, 'error');
        return;
      }

      // Safe to delete
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryToDelete.id);

      if (error) throw error;
      showToast('ลบประเภทครุภัณฑ์เรียบร้อยแล้ว');
      fetchCategories();
    } catch (err: any) {
      showToast('ไม่สามารถลบประเภทครุภัณฑ์ได้: ' + err.message, 'error');
    } finally {
      setCategoryToDelete(null);
    }
  };

  // [Admin + ไม่ได้กรอง dept] → dedup ตาม code ไม่แสดงซ้ำ
  // นับจำนวน dept ที่มีแต่ละ code เพื่อแสดง badge "ส่วนกลาง"
  const codeCountMap: Record<string, number> = {};
  categories.forEach((c) => { codeCountMap[c.code] = (codeCountMap[c.code] || 0) + 1; });

  const displayCategories =
    profile?.role === 'admin' && !selectedDeptId
      ? (() => {
          const seen = new Set<string>();
          return categories
            .filter((c) => {
              if (seen.has(c.code)) return false;
              seen.add(c.code);
              return true;
            })
            .map((c) => ({ ...c, _deptCount: codeCountMap[c.code] ?? 1 }));
        })()
      : categories.map((c) => ({ ...c, _deptCount: 1 }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <FolderTree size={24} />
            จัดการประเภทครุภัณฑ์
          </h2>
          <p className="page-subtitle">
            {selectedDeptId
              ? `สังกัด: ${departments.find((d) => d.id === selectedDeptId)?.name}`
              : 'แสดงประเภทครุภัณฑ์ทั้งหมดของทุกส่วนราชการ'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} />
          เพิ่มประเภทครุภัณฑ์
        </button>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="loading">
              <Loader2 className="animate-spin text-primary" size={26} style={{ margin: '0 auto' }} />
              <p style={{ marginTop: '8px' }}>กำลังโหลดประเภทครุภัณฑ์...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="empty-state">
              <FolderTree />
              <p>ยังไม่มีข้อมูลประเภทครุภัณฑ์ในระบบ</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '120px' }}>รหัสประเภท</th>
                    <th>ชื่อประเภท</th>
                    <th>คำอธิบาย</th>
                    {profile?.role === 'admin' && <th>ส่วนราชการ</th>}
                    <th className="text-center" style={{ width: '120px' }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {displayCategories.map((cat: any) => (
                    <tr key={cat.id}>
                      <td style={{ fontWeight: 600 }}>{cat.code}</td>
                      <td style={{ fontWeight: 500, color: 'var(--text-dark)' }}>{cat.name}</td>
                      <td style={{ color: 'var(--text-mid)' }}>{cat.description || '-'}</td>
                      {profile?.role === 'admin' && (
                        <td>
                          {cat._deptCount > 1 ? (
                            <span className="badge" style={{ background: 'var(--primary)', color: '#fff' }}>
                              ทุกหน่วยงาน ({cat._deptCount})
                            </span>
                          ) : (
                            <span className="badge">
                              {departments.find((d) => d.id === cat.department_id)?.short_name || 'ไม่ระบุ'}
                            </span>
                          )}
                        </td>
                      )}
                      <td className="text-center">
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            className="btn-icon btn-icon-edit"
                            onClick={() => openEditModal(cat)}
                            title={cat._deptCount > 1 ? 'แก้ไขเฉพาะรายการนี้ (ไม่ sync ทุก dept)' : 'แก้ไข'}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn-icon btn-icon-del"
                            onClick={() => handleDeleteClick(cat)}
                            title={cat._deptCount > 1 ? 'ลบเฉพาะรายการนี้ (ไม่ลบทุก dept)' : 'ลบ'}
                          >
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
        <div className="modal">
          <div className="modal-header">
            <h3>
              <FolderTree size={20} />
              {editingCategory ? 'แก้ไขประเภทครุภัณฑ์' : 'เพิ่มประเภทครุภัณฑ์'}
            </h3>
            <button className="modal-close" onClick={() => setModalOpen(false)}>
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSave}>
            <div className="modal-body">
              {profile?.role === 'admin' && !selectedDeptId && (
                <div className="form-group">
                  <label className="form-label required">ส่วนราชการ</label>
                  <select
                    className="form-input"
                    value={targetDeptId}
                    onChange={(e) => setTargetDeptId(e.target.value)}
                  >
                    <option value="">-- ทุกหน่วยงาน (บันทึกให้ทุกส่วนราชการ) --</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label required">ประเภทครุภัณฑ์ (รหัสและชื่อ)</label>
                <select
                  className="form-input"
                  value={code}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCode(val);
                    const nameMap: Record<string, string> = {
                      '01': 'ครุภัณฑ์สำนักงาน',
                      '02': 'ครุภัณฑ์การศึกษา',
                      '03': 'ครุภัณฑ์ยานพาหนะและขนส่ง',
                      '04': 'ครุภัณฑ์การเกษตร',
                      '05': 'ครุภัณฑ์ก่อสร้าง',
                      '06': 'ครุภัณฑ์ไฟฟ้าและวิทยุ',
                      '07': 'ครุภัณฑ์โฆษณาและเผยแพร่',
                      '08': 'ครุภัณฑ์วิทยาศาสตร์หรือการแพทย์',
                      '09': 'ครุภัณฑ์งานบ้านงานครัว',
                      '10': 'ครุภัณฑ์โรงงาน',
                      '11': 'ครุภัณฑ์กีฬา',
                      '12': 'ครุภัณฑ์สำรวจ',
                      '13': 'ครุภัณฑ์ดนตรีและนาฏศิลป์',
                      '14': 'ครุภัณฑ์คอมพิวเตอร์หรืออิเล็กทรอนิกส์',
                      '15': 'ครุภัณฑ์สนาม',
                      '16': 'ครุภัณฑ์อื่น',
                    };
                    if (nameMap[val]) setName(nameMap[val]);
                  }}
                  required
                >
                  <option value="">-- เลือกประเภทครุภัณฑ์ --</option>
                  <option value="01">01 ครุภัณฑ์สำนักงาน</option>
                  <option value="02">02 ครุภัณฑ์การศึกษา</option>
                  <option value="03">03 ครุภัณฑ์ยานพาหนะและขนส่ง</option>
                  <option value="04">04 ครุภัณฑ์การเกษตร</option>
                  <option value="05">05 ครุภัณฑ์ก่อสร้าง</option>
                  <option value="06">06 ครุภัณฑ์ไฟฟ้าและวิทยุ</option>
                  <option value="07">07 ครุภัณฑ์โฆษณาและเผยแพร่</option>
                  <option value="08">08 ครุภัณฑ์วิทยาศาสตร์หรือการแพทย์</option>
                  <option value="09">09 ครุภัณฑ์งานบ้านงานครัว</option>
                  <option value="10">10 ครุภัณฑ์โรงงาน</option>
                  <option value="11">11 ครุภัณฑ์กีฬา</option>
                  <option value="12">12 ครุภัณฑ์สำรวจ</option>
                  <option value="13">13 ครุภัณฑ์ดนตรีและนาฏศิลป์</option>
                  <option value="14">14 ครุภัณฑ์คอมพิวเตอร์หรืออิเล็กทรอนิกส์</option>
                  <option value="15">15 ครุภัณฑ์สนาม</option>
                  <option value="16">16 ครุภัณฑ์อื่น</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label required">ชื่อประเภท</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="กรอกชื่อประเภทครุภัณฑ์"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">คำอธิบายรายละเอียด</label>
                <textarea
                  className="form-input"
                  placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
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
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>บันทึกข้อมูล</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="ยืนยันการลบประเภทครุภัณฑ์"
        message={`คุณแน่ใจหรือไม่ที่จะลบประเภทครุภัณฑ์ "${categoryToDelete?.name}"? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
}
