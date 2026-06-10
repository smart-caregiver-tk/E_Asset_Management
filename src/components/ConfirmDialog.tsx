'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop active">
      <div className="modal modal-sm">
        <div className="modal-header">
          <h3>
            <AlertTriangle className="text-warning" size={20} />
            {title}
          </h3>
        </div>
        <div className="modal-body" style={{ textAlign: 'center', padding: '24px 20px' }}>
          <p style={{ color: 'var(--text-mid)', fontSize: '0.95rem', lineHeight: '1.5' }}>
            {message}
          </p>
        </div>
        <div className="modal-footer" style={{ justifyContent: 'center' }}>
          <button className="btn btn-outline" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
