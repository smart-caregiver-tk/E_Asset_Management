'use client';

import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthProvider';
import { useToast } from './Toast';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';

interface PhotoUploaderProps {
  photoUrls: string[];
  onChange: (urls: string[]) => void;
}

export default function PhotoUploader({ photoUrls, onChange }: PhotoUploaderProps) {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [uploading, setUploading] = useState<number | null>(null); // Index of slot uploading
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File, index: number) => {
    if (!profile) return;
    setUploading(index);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.department_id || 'admin'}/${Date.now()}_${index}.${fileExt}`;
      const filePath = `photos/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('asset-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('asset-photos')
        .getPublicUrl(filePath);

      const updatedUrls = [...photoUrls];
      updatedUrls[index] = publicUrl;
      // Filter out any trailing empty slots if they exist
      onChange(updatedUrls.filter(Boolean));
      showToast(`อัปโหลดรูปภาพที่ ${index + 1} สำเร็จ`);
    } catch (err: any) {
      showToast('ไม่สามารถอัปโหลดภาพได้: ' + err.message, 'error');
    } finally {
      setUploading(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files[0], index);
    }
  };

  const handleDelete = async (index: number) => {
    const urlToDelete = photoUrls[index];
    if (!urlToDelete) return;

    try {
      // Extract file path from public URL
      // Public URL format is: https://[project].supabase.co/storage/v1/object/public/asset-photos/[filePath]
      const pathParts = urlToDelete.split('/asset-photos/');
      if (pathParts.length > 1) {
        const filePath = pathParts[1];
        const { error } = await supabase.storage
          .from('asset-photos')
          .remove([filePath]);
        if (error) throw error;
      }

      const updatedUrls = [...photoUrls];
      updatedUrls.splice(index, 1);
      onChange(updatedUrls.filter(Boolean));
      showToast(`ลบรูปภาพที่ ${index + 1} เรียบร้อย`);
    } catch (err: any) {
      showToast('ไม่สามารถลบภาพได้: ' + err.message, 'error');
    }
  };

  const renderSlot = (index: number, ref: React.RefObject<HTMLInputElement | null>) => {
    const url = photoUrls[index];
    const isUploading = uploading === index;

    return (
      <div
        style={{
          flex: 1,
          height: '180px',
          border: '2px dashed var(--border)',
          borderRadius: 'var(--radius-sm)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
          overflow: 'hidden',
        }}
      >
        {isUploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Loader2 className="animate-spin text-primary" size={24} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>กำลังอัปโหลด...</span>
          </div>
        ) : url ? (
          <>
            <img
              src={url}
              alt={`รูปภาพครุภัณฑ์ที่ ${index + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
            <button
              type="button"
              onClick={() => handleDelete(index)}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.9)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow)',
              }}
              title="ลบรูปภาพ"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <div
            onClick={() => ref.current?.click()}
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: '16px',
            }}
          >
            <Upload size={24} style={{ color: 'var(--text-light)', marginBottom: '8px' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-mid)' }}>
              รูปภาพที่ {index + 1}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '4px' }}>
              คลิกเพื่อเลือกไฟล์รูปภาพ
            </span>
            <input
              type="file"
              ref={ref}
              onChange={(e) => handleFileChange(e, index)}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
      {renderSlot(0, fileInputRef1)}
      {renderSlot(1, fileInputRef2)}
    </div>
  );
}
