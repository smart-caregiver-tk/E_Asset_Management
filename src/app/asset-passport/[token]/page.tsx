'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Package, 
  MapPin, 
  Hash, 
  Calendar, 
  Wrench, 
  ShieldCheck, 
  AlertTriangle,
  Loader2,
  Building2,
  Image as ImageIcon
} from 'lucide-react';
import Image from 'next/image';

interface AssetPassportProps {
  params: Promise<{
    token: string;
  }>;
}

export default function AssetPassportPage({ params }: AssetPassportProps) {
  const resolvedParams = React.use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPassport() {
      try {
        const { data: assetData, error: rpcError } = await supabase.rpc('get_public_asset_passport', {
          p_token: resolvedParams.token
        });

        if (rpcError) {
          console.error('RPC Error:', rpcError);
          throw rpcError;
        }
        
        if (!assetData) {
          setError('ไม่พบข้อมูลครุภัณฑ์ หรือ QR Code นี้ถูกระงับการใช้งาน');
        } else {
          setData(assetData);
        }
      } catch (err: any) {
        console.error('Error loading passport:', err);
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + err.message);
      } finally {
        setLoading(false);
      }
    }

    if (resolvedParams.token) {
      loadPassport();
    } else {
      setLoading(false);
      setError('ไม่พบรหัส Token หรือรูปแบบไม่ถูกต้อง');
    }
  }, [resolvedParams.token]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '20px' }}>
        <Loader2 className="animate-spin" size={40} style={{ color: '#0ea5e9' }} />
        <p style={{ marginTop: '16px', color: '#64748b', fontWeight: '500' }}>กำลังโหลดข้อมูลครุภัณฑ์...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '20px', textAlign: 'center' }}>
        <div style={{ background: '#fee2e2', padding: '20px', borderRadius: '50%', marginBottom: '20px' }}>
          <AlertTriangle size={48} style={{ color: '#ef4444' }} />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>ไม่สามารถแสดงข้อมูลได้</h2>
        <p style={{ color: '#64748b', maxWidth: '300px' }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', paddingBottom: '40px' }}>
      {/* Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0284c7, #0ea5e9)', padding: '40px 20px 60px', textAlign: 'center', color: '#fff', borderRadius: '0 0 24px 24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '16px', marginBottom: '16px', backdropFilter: 'blur(4px)' }}>
          <Package size={36} color="#fff" />
        </div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: '800', lineHeight: '1.4', marginBottom: '8px' }}>
          {data.name}
        </h1>
        <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '6px 16px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '600', backdropFilter: 'blur(4px)' }}>
          <Hash size={14} style={{ marginRight: '6px' }} />
          {data.code}
        </div>
      </div>

      {/* Main Content Container */}
      <div style={{ maxWidth: '480px', margin: '-30px auto 0', padding: '0 16px' }}>
        
        {/* Photo Section */}
        {data.photo_urls && data.photo_urls.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: '#f8fafc' }}>
              <Image 
                src={data.photo_urls[0]} 
                alt={data.name} 
                fill 
                style={{ objectFit: 'cover' }} 
              />
            </div>
            {data.photo_urls.length > 1 && (
              <div style={{ padding: '8px 12px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#64748b', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <ImageIcon size={14} />
                มีรูปภาพเพิ่มเติมอีก {data.photo_urls.length - 1} รูป (แสดงเฉพาะรูปแรก)
              </div>
            )}
          </div>
        )}

        {/* Status Card */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>สถานะการใช้งาน</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: data.status === 'ใช้งาน' ? '#22c55e' : data.status === 'ชำรุด' ? '#ef4444' : '#f59e0b' }} />
              <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '1.1rem' }}>{data.status}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
             <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>สถานะซ่อมบำรุง</p>
             <p style={{ fontSize: '0.85rem', fontWeight: '600', color: data.repair_status_text === 'ไม่มีประวัติซ่อม' ? '#22c55e' : '#f59e0b' }}>
               {data.repair_status_text}
             </p>
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
            <Building2 size={18} color="#0ea5e9" />
            ข้อมูลพื้นฐาน
          </h3>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            <InfoRow label="ประเภท" value={data.asset_type || '-'} />
            <InfoRow label="หมวดหมู่" value={data.category_name || '-'} />
            <InfoRow label="ยี่ห้อ" value={data.manufacturer || '-'} />
            <InfoRow label="แบบ/ชนิด" value={data.model || '-'} />
            <InfoRow label="Serial No." value={data.serial_no || '-'} />
            {data.plate_no && <InfoRow label="ทะเบียน" value={data.plate_no} />}
          </div>
        </div>

        {/* Location & Department */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
            <MapPin size={18} color="#0ea5e9" />
            การดูแลรักษา
          </h3>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            <InfoRow label="หน่วยงานที่ดูแล" value={data.department_name || '-'} />
            <InfoRow label="สถานที่จัดเก็บ" value={data.location || '-'} />
            <InfoRow label="ปีที่ได้มา" value={data.acquisition_year || '-'} />
          </div>
        </div>

        {/* Footer info */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#e0f2fe', color: '#0369a1', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', marginBottom: '8px' }}>
            <ShieldCheck size={14} />
            ข้อมูลถูกตรวจสอบและรับรองโดยระบบ
          </div>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            อัปเดตล่าสุด: {new Date(data.updated_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '4px' }}>
            E-Asset Management
          </p>
        </div>

      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string, value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px dashed #f1f5f9', paddingBottom: '8px' }}>
      <span style={{ fontSize: '0.85rem', color: '#64748b', minWidth: '100px' }}>{label}</span>
      <span style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: '600', textAlign: 'right' }}>{value}</span>
    </div>
  );
}
