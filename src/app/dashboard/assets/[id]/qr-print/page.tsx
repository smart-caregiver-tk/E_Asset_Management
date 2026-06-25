'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { QRCodeCanvas } from 'qrcode.react';
import { Loader2, Printer, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function QRPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function loadAsset() {
      try {
        const { data, error } = await supabase
          .from('assets')
          .select('*, departments(name), categories(name)')
          .eq('id', resolvedParams.id)
          .single();

        if (error) throw error;
        setAsset(data);
      } catch (err: any) {
        setError('ไม่สามารถโหลดข้อมูลครุภัณฑ์: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    
    if (resolvedParams.id) {
      loadAsset();
    } else {
      setLoading(false);
      setError('ไม่พบรหัสอ้างอิงครุภัณฑ์');
    }
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>
        <h2>{error || 'ไม่พบข้อมูลครุภัณฑ์'}</h2>
        <button className="btn btn-outline" onClick={() => window.history.length > 1 ? router.back() : window.close()} style={{ marginTop: '20px' }}>
          ปิดหน้าต่าง
        </button>
      </div>
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  const qrLink = asset.qr_public_token ? `${appUrl}/asset-passport/${asset.qr_public_token}` : '';

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '20px' }} className="print-page-wrapper">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-page-wrapper { padding: 0 !important; background: white !important; }
          .sidebar, .topbar { display: none !important; }
          .main-content { margin-left: 0 !important; padding: 0 !important; }
          .page-container { padding: 0 !important; }
        }
      `}} />

      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', maxWidth: '800px', margin: '0 auto 20px' }}>
        <button className="btn btn-outline" onClick={() => window.history.length > 1 ? router.back() : window.close()}>
          <ArrowLeft size={16} /> ปิดหน้าต่าง
        </button>
        <button className="btn btn-primary" onClick={() => window.print()}>
          <Printer size={16} /> พิมพ์ฉลาก
        </button>
      </div>

      <div style={{ 
        background: 'white', 
        width: '10cm', 
        padding: '1cm', 
        margin: '0 auto', 
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        border: '1px solid #e2e8f0',
        borderRadius: '8px'
      }} className="print-label-container">
        
        <div style={{ textAlign: 'center', border: '2px solid #0f172a', padding: '16px', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '14pt', fontWeight: 'bold', margin: '0 0 12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
            รหัสครุภัณฑ์<br/>
            {asset.code}
          </h2>
          
          <div style={{ background: 'white', padding: '8px', display: 'inline-block' }}>
            <QRCodeCanvas 
              value={qrLink} 
              size={140}
              level={"H"}
            />
          </div>

          <p style={{ fontSize: '10pt', margin: '12px 0 4px', fontWeight: '600' }}>
            {asset.name}
          </p>
          <p style={{ fontSize: '8pt', margin: '0', color: '#64748b' }}>
            {asset.departments?.name || '-'}
          </p>
          <p style={{ fontSize: '7pt', margin: '8px 0 0', color: '#94a3b8' }}>
            สแกนเพื่อดูข้อมูลเพิ่มเติม
          </p>
        </div>

      </div>
    </div>
  );
}
