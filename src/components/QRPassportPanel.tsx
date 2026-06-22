'use client';

import React, { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { supabase } from '@/lib/supabase';
import { useToast } from './Toast';
import ConfirmDialog from './ConfirmDialog';
import {
  QrCode,
  RefreshCw,
  Power,
  PowerOff,
  Download,
  Printer,
  ExternalLink,
  Loader2
} from 'lucide-react';
import type { Asset } from '@/types/database';

interface QRPassportPanelProps {
  asset: Asset;
  onRefresh: () => void;
}

export default function QRPassportPanel({ asset, onRefresh }: QRPassportPanelProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // Get base URL for QR link
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  const qrLink = asset.qr_public_token ? `${appUrl}/asset-passport/${asset.qr_public_token}` : '';

  // Toggle Enable/Disable
  const handleToggleQR = async () => {
    setLoading(true);
    const newStatus = !asset.qr_public_enabled;
    try {
      const { error } = await supabase.rpc('admin_manage_qr_passport', {
        p_asset_id: asset.id,
        p_action: 'toggle'
      });

      if (error) throw error;
      showToast(newStatus ? 'เปิดใช้งาน QR Passport สำเร็จ' : 'ปิดใช้งาน QR Passport แล้ว', 'success');
      onRefresh();
    } catch (err: any) {
      showToast('ไม่สามารถอัปเดตสถานะ QR ได้: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Regenerate Token (Confirm required)
  const handleRegenerateToken = async () => {
    setConfirmOpen(false);
    setLoading(true);
    try {
      const { error } = await supabase.rpc('admin_manage_qr_passport', {
        p_asset_id: asset.id,
        p_action: 'regenerate'
      });

      if (error) throw error;
      showToast('สร้างรหัส QR ใหม่สำเร็จ รหัสเดิมจะใช้งานไม่ได้อีกต่อไป', 'success');
      onRefresh();
    } catch (err: any) {
      showToast('ไม่สามารถสร้างรหัส QR ใหม่ได้: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrRef.current) return;
    const canvas = qrRef.current.querySelector('canvas');
    if (!canvas) return;

    const pngUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `QR_${asset.code}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handlePrint = () => {
    // Navigate to a dedicated print page for this specific asset
    window.open(`/dashboard/assets/${asset.id}/qr-print`, '_blank');
  };

  const handleOpenPreview = () => {
    if (!qrLink) return;
    window.open(qrLink, '_blank');
  };

  if (!asset) return null;

  return (
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', padding: '16px 0' }}>
      {/* Left Column: QR Display */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        background: 'var(--bg)', 
        padding: '24px', 
        borderRadius: 'var(--radius-md)', 
        border: '1px solid var(--border)' 
      }}>
        {asset.qr_public_enabled ? (
          <div style={{ padding: '4px', background: '#fff', borderRadius: '8px' }} ref={qrRef}>
            <QRCodeCanvas 
              value={qrLink} 
              size={180}
              level={"H"}
              includeMargin={true}
            />
          </div>
        ) : (
          <div style={{ 
            width: '180px', 
            height: '180px', 
            background: 'var(--border-light)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            borderRadius: '8px',
            color: 'var(--text-light)',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <PowerOff size={32} />
            <span style={{ fontSize: '0.85rem' }}>QR ถูกปิดใช้งาน</span>
          </div>
        )}
        
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px', 
            padding: '4px 12px', 
            borderRadius: '20px', 
            fontSize: '0.8rem',
            fontWeight: '600',
            background: asset.qr_public_enabled ? 'var(--success-light)' : 'var(--danger-light)',
            color: asset.qr_public_enabled ? 'var(--success)' : 'var(--danger)'
          }}>
            <span style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: 'currentColor' 
            }} />
            สถานะ: {asset.qr_public_enabled ? 'เปิดใช้งานสาธารณะ' : 'ปิดการใช้งาน'}
          </div>
        </div>
      </div>

      {/* Right Column: Actions */}
      <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <QrCode size={18} />
          ตั้งค่า QR Asset Passport
        </h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-mid)' }}>
          ระบบจะสร้าง QR Code ที่ชี้ไปยังหน้าข้อมูลสาธารณะของครุภัณฑ์ชิ้นนี้ 
          ผู้ที่สแกนไม่จำเป็นต้องเข้าสู่ระบบ แต่จะไม่เห็นข้อมูลส่วนตัวหรือมูลค่าทางการเงิน
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
          
          <button 
            type="button" 
            className={`btn ${asset.qr_public_enabled ? 'btn-outline' : 'btn-primary'}`} 
            onClick={handleToggleQR}
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : (asset.qr_public_enabled ? <PowerOff size={16} /> : <Power size={16} />)}
            <span>{asset.qr_public_enabled ? 'ปิดการใช้งาน QR ชั่วคราว' : 'เปิดใช้งาน QR Passport'}</span>
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={() => setConfirmOpen(true)}
              disabled={loading}
              style={{ justifyContent: 'center' }}
            >
              <RefreshCw size={16} />
              สร้างรหัส QR ใหม่
            </button>
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={handleDownload}
              disabled={loading || !asset.qr_public_enabled}
              style={{ justifyContent: 'center' }}
            >
              <Download size={16} />
              โหลด PNG
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={handlePrint}
              disabled={loading || !asset.qr_public_enabled}
              style={{ justifyContent: 'center' }}
            >
              <Printer size={16} />
              พิมพ์ฉลาก (A4)
            </button>
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={handleOpenPreview}
              disabled={loading || !asset.qr_public_enabled}
              style={{ justifyContent: 'center' }}
            >
              <ExternalLink size={16} />
              ดูหน้าตัวอย่าง
            </button>
          </div>
        </div>

        {asset.qr_code_updated_at && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: 'auto', paddingTop: '16px' }}>
            อัปเดตสถานะ QR ล่าสุด: {new Date(asset.qr_code_updated_at).toLocaleString('th-TH')}
          </p>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        title="ยืนยันการสร้าง QR ใหม่"
        message="การสร้าง QR ใหม่จะทำให้ QR เดิมที่ถูกพิมพ์ไปแล้วไม่สามารถสแกนเพื่อดูข้อมูลได้อีกต่อไป (ลิงก์เก่าจะตาย) คุณแน่ใจที่จะดำเนินการต่อหรือไม่?"
        onConfirm={handleRegenerateToken}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
