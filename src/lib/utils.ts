// Utility functions for E-Asset Management

export function formatNumber(n: number): string {
  return Number(n).toLocaleString('th-TH');
}

export function formatMoney(n: number): string {
  return Number(n).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function getThaiDate(): string {
  const d = new Date();
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getThaiDateFull(): string {
  const d = new Date();
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

export function getThaiDateTime(): string {
  const d = new Date();
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function getStatusColor(status: string): { bg: string; color: string; icon: string } {
  switch (status) {
    case 'ใช้งาน':
      return { bg: 'var(--success-light)', color: 'var(--success)', icon: 'check-circle' };
    case 'ชำรุด':
      return { bg: 'var(--danger-light)', color: 'var(--danger)', icon: 'x-circle' };
    case 'จำหน่าย':
      return { bg: 'var(--warning-light)', color: 'var(--warning)', icon: 'minus-circle' };
    case 'ให้ยืม':
      return { bg: 'var(--info-light)', color: 'var(--info)', icon: 'hand-helping' };
    default:
      return { bg: '#f0f0f0', color: '#666', icon: 'circle' };
  }
}

export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export const ACQUISITION_METHODS = [
  'การจัดซื้อ (ด้วยวิธีประกวดราคา, เฉพาะเจาะจง ฯลฯ)',
  'การบริจาค',
  'การแลกเปลี่ยน',
  'การโอน',
];

export const ASSET_STATUSES = ['ใช้งาน', 'ชำรุด', 'จำหน่าย', 'ให้ยืม'];
