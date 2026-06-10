'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import { formatNumber, formatMoney } from '@/lib/utils';
import {
  Wrench,
  Plus,
  Trash2,
  Loader2,
  Save,
  X,
  Search,
  Building2,
  FileText,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import type { Asset, Repair } from '@/types/database';

export default function RepairsPage() {
  const { profile, selectedDeptId, departments } = useAuth();
  const { showToast } = useToast();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [loadingRepairs, setLoadingRepairs] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Form Fields
  const [docNo, setDocNo] = useState('');
  const [docDate, setDocDate] = useState('');
  const [detail, setDetail] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [contractor, setContractor] = useState('');
  const [remark, setRemark] = useState('');

  // Delete Confirm State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [repairToDelete, setRepairToDelete] = useState<Repair | null>(null);

  // Load Assets
  useEffect(() => {
    async function loadAssets() {
      setLoadingAssets(true);
      try {
        let query = supabase.from('assets').select('*');
        if (selectedDeptId) {
          query = query.eq('department_id', selectedDeptId);
        }
        const { data, error } = await query.order('code');
        if (error) throw error;
        setAssets(data || []);
        // Reset selected asset if it doesn't belong to current view anymore
        if (data && !data.some(a => a.id === selectedAssetId)) {
          setSelectedAssetId('');
          setRepairs([]);
        }
      } catch (err: any) {
        showToast('ไม่สามารถโหลดรายการครุภัณฑ์ได้: ' + err.message, 'error');
      } finally {
        setLoadingAssets(false);
      }
    }

    if (profile) {
      loadAssets();
    }
  }, [selectedDeptId, profile]);

  // Load Repairs when asset is selected
  useEffect(() => {
    async function loadRepairs() {
      if (!selectedAssetId) {
        setRepairs([]);
        return;
      }
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
        showToast('ไม่สามารถโหลดประวัติการซ่อมได้: ' + err.message, 'error');
      } finally {
        setLoadingRepairs(false);
      }
    }

    loadRepairs();
  }, [selectedAssetId]);

  const openAddModal = () => {
    if (!selectedAssetId) {
      showToast('กรุณาเลือกครุภัณฑ์ที่ต้องการบันทึกการซ่อมก่อน', 'warning');
      return;
    }
    setDocNo('');
    setDocDate('');
    setDetail('');
    setAmount(0);
    setContractor('');
    setRemark('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail) {
      showToast('กรุณากรอกรายการซ่อมแซม', 'warning');
      return;
    }

    setModalLoading(true);
    const selectedAsset = assets.find(a => a.id === selectedAssetId);

    if (!selectedAsset) {
      showToast('ไม่พบข้อมูลครุภัณฑ์', 'error');
      setModalLoading(false);
      return;
    }

    // Calculate sequence (next number)
    const nextSeq = repairs.length > 0 ? Math.max(...repairs.map(r => r.sequence)) + 1 : 1;

    try {
      const { error } = await supabase.from('repairs').insert({
        asset_id: selectedAssetId,
        sequence: nextSeq,
        doc_no: docNo,
        doc_date: docDate,
        detail,
        amount,
        contractor,
        remark,
        department_id: selectedAsset.department_id,
      });

      if (error) throw error;
      showToast('บันทึกประวัติการซ่อมสำเร็จ');
      setModalOpen(false);

      // Reload repairs
      const { data, error: fetchError } = await supabase
        .from('repairs')
        .select('*')
        .eq('asset_id', selectedAssetId)
        .order('sequence', { ascending: true });
      if (!fetchError) setRepairs(data || []);

    } catch (err: any) {
      showToast('เกิดข้อผิดพลาด: ' + err.message, 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteClick = (repair: Repair) => {
    setRepairToDelete(repair);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!repairToDelete) return;
    setDeleteConfirmOpen(false);

    try {
      const { error } = await supabase
        .from('repairs')
        .delete()
        .eq('id', repairToDelete.id);

      if (error) throw error;
      showToast('ลบรายการซ่อมสำเร็จ');

      // Reload and re-calculate sequences
      const { data, error: fetchError } = await supabase
        .from('repairs')
        .select('*')
        .eq('asset_id', selectedAssetId)
        .order('created_at', { ascending: true });

      if (!fetchError && data) {
        // Update sequences in database if needed, or simply display ordered list
        setRepairs(data);
      }
    } catch (err: any) {
      showToast('ไม่สามารถลบได้: ' + err.message, 'error');
    } finally {
      setRepairToDelete(null);
    }
  };

  const activeAsset = assets.find(a => a.id === selectedAssetId);
  const totalRepairCost = repairs.reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <Wrench size={24} />
            บันทึกประวัติการซ่อมบำรุง
          </h2>
          <p className="page-subtitle">
            เลือกครุภัณฑ์เพื่อตรวจสอบและบันทึกประวัติการบำรุงรักษา
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <label className="form-label" style={{ fontWeight: '700' }}>เลือกครุภัณฑ์ในระบบ</label>
              {loadingAssets ? (
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

            {selectedAssetId && (
              <button className="btn btn-primary" onClick={openAddModal} style={{ marginTop: '20px' }}>
                <Plus size={18} />
                บันทึกการซ่อมใหม่
              </button>
            )}
          </div>
        </div>
      </div>

      {selectedAssetId ? (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>
                <FileText size={18} style={{ color: 'var(--primary)', marginRight: '6px' }} />
                ประวัติการซ่อมแซม: {activeAsset?.name} ({activeAsset?.code})
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: '4px' }}>
                สถานที่ติดตั้ง: {activeAsset?.location || 'ไม่ได้ระบุ'}
              </p>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {loadingRepairs ? (
              <div className="loading">
                <Loader2 className="animate-spin text-primary" size={24} style={{ margin: '0 auto' }} />
                <p style={{ marginTop: '8px' }}>กำลังโหลดประวัติการซ่อม...</p>
              </div>
            ) : repairs.length === 0 ? (
              <div className="empty-state">
                <Wrench />
                <p>ยังไม่มีประวัติการซ่อมบำรุงของครุภัณฑ์ชิ้นนี้</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }} className="text-center">ครั้งที่</th>
                      <th style={{ width: '150px' }}>เลขที่หนังสืออนุมัติ</th>
                      <th style={{ width: '130px' }}>ลงวันที่</th>
                      <th>รายการซ่อมแซมบำรุงรักษา</th>
                      <th className="text-right" style={{ width: '120px' }}>จำนวนเงิน (บาท)</th>
                      <th>ผู้ดำเนินการ/ร้านค้า</th>
                      <th>หมายเหตุ</th>
                      <th className="text-center" style={{ width: '80px' }}>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repairs.map((rep, index) => (
                      <tr key={rep.id}>
                        <td className="text-center" style={{ fontWeight: 600 }}>{index + 1}</td>
                        <td>{rep.doc_no || '-'}</td>
                        <td>{rep.doc_date || '-'}</td>
                        <td style={{ fontWeight: 500, color: 'var(--text-dark)' }}>{rep.detail}</td>
                        <td className="text-right" style={{ fontWeight: 600, color: 'var(--danger)' }}>
                          {formatMoney(Number(rep.amount))}
                        </td>
                        <td>{rep.contractor || '-'}</td>
                        <td style={{ color: 'var(--text-mid)', fontSize: '0.8rem' }}>{rep.remark || '-'}</td>
                        <td className="text-center">
                          <button
                            className="btn-icon btn-icon-del"
                            onClick={() => handleDeleteClick(rep)}
                            title="ลบรายการซ่อม"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'var(--bg)', fontWeight: '700' }}>
                      <td colSpan={4} style={{ textAlign: 'right', padding: '12px 14px' }}>
                        รวมค่าซ่อมแซมบำรุงรักษาทั้งสิ้น
                      </td>
                      <td className="text-right" style={{ color: 'var(--danger)', padding: '12px 14px' }}>
                        {formatMoney(totalRepairCost)}
                      </td>
                      <td colSpan={3} style={{ padding: '12px 14px' }}>บาท</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card" style={{ borderStyle: 'dashed', background: 'transparent' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <AlertCircle size={32} style={{ color: 'var(--text-light)', marginBottom: '8px' }} />
            <p style={{ color: 'var(--text-light)', fontSize: '0.88rem' }}>
              กรุณาเลือกครุภัณฑ์จากด้านบน เพื่อดูและจัดการบันทึกประวัติการบำรุงรักษา
            </p>
          </div>
        </div>
      )}

      {/* Add Repair Modal */}
      <div className={`modal-backdrop ${modalOpen ? 'active' : ''}`}>
        <div className="modal">
          <div className="modal-header">
            <h3>
              <Wrench size={20} />
              บันทึกประวัติการซ่อมบำรุงครุภัณฑ์
            </h3>
            <button className="modal-close" onClick={() => setModalOpen(false)}>
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSave}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">ครุภัณฑ์</label>
                <input
                  type="text"
                  className="form-input"
                  value={`${activeAsset?.code} - ${activeAsset?.name}`}
                  disabled
                  style={{ background: 'var(--border-light)' }}
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">เลขที่หนังสืออนุมัติ</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="เช่น นร 0505/123"
                    value={docNo}
                    onChange={(e) => setDocNo(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ลงวันที่อนุมัติ</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="เช่น 10 มิ.ย. 2567"
                    value={docDate}
                    onChange={(e) => setDocDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label required">รายการซ่อมแซมบำรุงรักษา</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="เช่น เปลี่ยนคอมเพรสเซอร์แอร์ หรือ เปลี่ยนถ่ายน้ำมันเครื่อง"
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  required
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label required">จำนวนเงิน (บาท)</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ผู้ดำเนินการ / ร้านค้าผู้รับจ้าง</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="เช่น หจก. ทับกวางแอร์"
                    value={contractor}
                    onChange={(e) => setContractor(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">หมายเหตุเพิ่มเติม</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="รายละเอียดหมายเหตุ"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
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
                    <span>บันทึกประวัติการซ่อม</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Repair Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="ยืนยันการลบประวัติการซ่อม"
        message="คุณแน่ใจหรือไม่ที่จะลบรายการประวัติการซ่อมแซมชิ้นนี้? การดำเนินการนี้ไม่สามารถยกเลิกภายหลังได้"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
}
