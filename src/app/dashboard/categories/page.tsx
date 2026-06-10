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
      showToast('ไม่สามารถโหลดข้อมูลหมวดหมู่ได้: ' + err.message, 'error');
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
    setTargetDeptId(selectedDeptId || (departments[0]?.id || ''));
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

    const deptIdToSave = profile?.role === 'admin' ? targetDeptId : profile?.department_id;

    if (!deptIdToSave) {
      showToast('กรุณาระบุส่วนราชการ', 'warning');
      setModalLoading(false);
      return;
    }

    try {
      if (editingCategory) {
        // Update
        const { error } = await supabase
          .from('categories')
          .update({
            code,
            name,
            description,
            department_id: deptIdToSave,
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
        showToast('แก้ไขหมวดหมู่สำเร็จ');
      } else {
        // Insert
        const { error } = await supabase.from('categories').insert({
          code,
          name,
          description,
          department_id: deptIdToSave,
        });

        if (error) throw error;
        showToast('เพิ่มหมวดหมู่สำเร็จ');
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
        showToast(`ไม่สามารถลบได้ เนื่องจากมีครุภัณฑ์จำนวน ${count} รายการใช้งานหมวดหมู่นี้อยู่`, 'error');
        return;
      }

      // Safe to delete
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryToDelete.id);

      if (error) throw error;
      showToast('ลบหมวดหมู่เรียบร้อยแล้ว');
      fetchCategories();
    } catch (err: any) {
      showToast('ไม่สามารถลบหมวดหมู่ได้: ' + err.message, 'error');
    } finally {
      setCategoryToDelete(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <FolderTree size={24} />
            จัดการหมวดหมู่ครุภัณฑ์
          </h2>
          <p className="page-subtitle">
            {selectedDeptId
              ? `สังกัด: ${departments.find((d) => d.id === selectedDeptId)?.name}`
              : 'แสดงหมวดหมู่ทั้งหมดของทุกส่วนราชการ'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} />
          เพิ่มหมวดหมู่
        </button>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="loading">
              <Loader2 className="animate-spin text-primary" size={26} style={{ margin: '0 auto' }} />
              <p style={{ marginTop: '8px' }}>กำลังโหลดหมวดหมู่...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="empty-state">
              <FolderTree />
              <p>ยังไม่มีข้อมูลหมวดหมู่ในระบบ</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '120px' }}>รหัสหมวดหมู่</th>
                    <th>ชื่อหมวดหมู่</th>
                    <th>คำอธิบาย</th>
                    {profile?.role === 'admin' && <th>ส่วนราชการ</th>}
                    <th className="text-center" style={{ width: '120px' }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id}>
                      <td style={{ fontWeight: 600 }}>{cat.code}</td>
                      <td style={{ fontWeight: 500, color: 'var(--text-dark)' }}>{cat.name}</td>
                      <td style={{ color: 'var(--text-mid)' }}>{cat.description || '-'}</td>
                      {profile?.role === 'admin' && (
                        <td>
                          <span className="badge">
                            {departments.find((d) => d.id === cat.department_id)?.short_name || 'ไม่ระบุ'}
                          </span>
                        </td>
                      )}
                      <td className="text-center">
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            className="btn-icon btn-icon-edit"
                            onClick={() => openEditModal(cat)}
                            title="แก้ไข"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn-icon btn-icon-del"
                            onClick={() => handleDeleteClick(cat)}
                            title="ลบ"
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
              {editingCategory ? 'แก้ไขหมวดหมู่ครุภัณฑ์' : 'เพิ่มหมวดหมู่ครุภัณฑ์'}
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

              <div className="form-group">
                <label className="form-label required">รหัสหมวดหมู่</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="เช่น CAT-001 หรือ 01"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label required">ชื่อหมวดหมู่</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="เช่น ครุภัณฑ์สำนักงาน"
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
        title="ยืนยันการลบหมวดหมู่"
        message={`คุณแน่ใจหรือไม่ที่จะลบหมวดหมู่ "${categoryToDelete?.name}"? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
}
