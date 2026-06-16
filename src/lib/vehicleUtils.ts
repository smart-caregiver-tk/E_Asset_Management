// Helper constants and utilities for Smart Vehicle Component

// ประเภทยานพาหนะ — Vehicle Types
export const VEHICLE_TYPES = [
  { id: 'official_mayor', name: 'รถประจำตำแหน่ง นายกเทศมนตรี', icon: '🚗' },
  { id: 'official_clerk', name: 'รถประจำตำแหน่ง ปลัดเทศบาล', icon: '🚗' },
  { id: 'van', name: 'รถยนต์ตู้', icon: '🚐' },
  { id: 'pickup_4door', name: 'รถปิคอัพ 4 ประตู', icon: '🛻' },
  { id: 'pickup_2door', name: 'รถปิคอัพ 2 ประตู', icon: '🛻' },
  { id: 'rescue', name: 'รถกู้ชีพกู้ภัย', icon: '🚑' },
  { id: 'water_truck', name: 'รถบรรทุกน้ำ', icon: '🚛' },
  { id: 'fire_truck', name: 'รถดับเพลิง', icon: '🚒' },
  { id: 'crane', name: 'รถกระเช้า', icon: '🏗️' },
  { id: 'backhoe', name: 'รถแบคโฮ', icon: '🚜' },
  { id: 'garbage_truck', name: 'รถบรรทุกขยะ', icon: '🚛' },
  { id: 'mobile_toilet', name: 'รถสุขาเคลื่อนที่', icon: '🚻' },
  { id: 'motorcycle', name: 'รถจักรยานยนต์', icon: '🏍️' },
  { id: 'tricycle', name: 'รถสามล้อ', icon: '🛺' },
  { id: 'truck_6w', name: 'รถบรรทุก 6 ล้อ', icon: '🚛' },
  { id: 'truck_10w', name: 'รถบรรทุก 10 ล้อ', icon: '🚛' },
  { id: 'tractor_head', name: 'รถลากจูง (หัว)', icon: '🚛' },
  { id: 'tractor_tail', name: 'รถลากจูง (หาง)', icon: '🚛' },
  { id: 'sewage_truck', name: 'รถดูดสิ่งปฏิกูล', icon: '🚛' },
  { id: 'arm_mower', name: 'รถแทรกเตอร์ตัดหญ้าแขน', icon: '🚜' },
  { id: 'crawler_excavator', name: 'รถขุดตีนตะขาบ (แทรกเตอร์)', icon: '🚜' },
  { id: 'backhoe_loader', name: 'รถตักหน้าขุดหลัง', icon: '🚜' },
  { id: 'tractor_mower', name: 'รถแทรกเตอร์ตัดหญ้า', icon: '🚜' },
  { id: 'crawler_farm_tractor', name: 'รถขุดตีนตะขาบ (ฟาร์มแทรกเตอร์)', icon: '🚜' },
  { id: 'other', name: 'รถอื่นๆ', icon: '🚗' },
] as const;

// สถานะยานพาหนะ — Vehicle Status
export const VEHICLE_STATUSES = [
  { id: 'available', name: 'พร้อมใช้งาน', color: '#22c55e', bgColor: '#f0fdf4' },
  { id: 'in_use', name: 'กำลังใช้งาน', color: '#3b82f6', bgColor: '#eff6ff' },
  { id: 'maintenance', name: 'ซ่อมบำรุง', color: '#eab308', bgColor: '#fefce8' },
  { id: 'retired', name: 'เลิกใช้งาน', color: '#94a3b8', bgColor: '#f1f5f9' },
] as const;

// สถานะใบขอใช้รถ
export const TRIP_STATUSES = [
  { id: 'pending', name: 'รอดำเนินการ', color: '#eab308', bgColor: '#fefce8' },
  { id: 'approved', name: 'อนุมัติ', color: '#22c55e', bgColor: '#f0fdf4' },
  { id: 'in_use', name: 'กำลังเดินทาง', color: '#3b82f6', bgColor: '#eff6ff' },
  { id: 'completed', name: 'เสร็จสิ้น', color: '#6366f1', bgColor: '#eef2ff' },
  { id: 'cancelled', name: 'ยกเลิก', color: '#ef4444', bgColor: '#fef2f2' },
] as const;

// ประเภทเชื้อเพลิง
export const FUEL_TYPES = [
  { id: 'diesel', name: 'ดีเซล' },
  { id: 'gasohol91', name: 'แก๊สโซฮอล์ 91' },
  { id: 'gasohol95', name: 'แก๊สโซฮอล์ 95' },
  { id: 'e20', name: 'E20' },
  { id: 'e85', name: 'E85' },
  { id: 'lpg', name: 'LPG' },
  { id: 'ngv', name: 'NGV' },
  { id: 'electric', name: 'ไฟฟ้า' },
] as const;

/**
 * แปลงวันที่เป็น พ.ศ. แบบไทย
 */
export function formatThaiDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const buddhistYear = date.getFullYear() + 543;
  return `${day} ${month} ${buddhistYear} (พ.ศ.)`;
}

/**
 * แปลงวันที่เป็น พ.ศ. แบบสั้น เช่น 16/06/2569
 */
export function formatThaiDateShort(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const buddhistYear = date.getFullYear() + 543;
  return `${day}/${month}/${buddhistYear}`;
}

/**
 * แปลงเวลา เป็นแบบ 24 ชั่วโมง เช่น 21.00 น.
 */
export function formatTime(timeStr: string | null): string {
  if (!timeStr) return '-';
  const cleanTime = timeStr.substring(0, 5).replace(':', '.');
  return cleanTime + ' น.';
}

/**
 * แปลงตัวเลขเป็นรูปแบบมีคอมม่า
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '-';
  return num.toLocaleString('th-TH');
}

/**
 * แปลงตัวเลขเป็นรูปแบบเงินบาท
 */
export function formatCurrency(num: number | null | undefined): string {
  if (num === null || num === undefined) return '-';
  return num.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' บาท';
}

/**
 * หา vehicle type name จาก id
 */
export function getVehicleTypeName(id: string): string {
  return VEHICLE_TYPES.find(v => v.id === id)?.name || id;
}

/**
 * หา vehicle type icon จาก id
 */
export function getVehicleTypeIcon(id: string): string {
  return VEHICLE_TYPES.find(v => v.id === id)?.icon || '🚗';
}

/**
 * หา status info
 */
export function getVehicleStatus(id: string) {
  return VEHICLE_STATUSES.find(s => s.id === id) || { id, name: id, color: '#666', bgColor: '#f5f5f5' };
}

/**
 * หา trip status info
 */
export function getTripStatus(id: string) {
  return TRIP_STATUSES.find(s => s.id === id) || { id, name: id, color: '#666', bgColor: '#f5f5f5' };
}

/**
 * สร้างเลขที่ใบบันทึก TK-YYYYMM-XXXX
 */
export function generateTripNo(): string {
  const now = new Date();
  const year = now.getFullYear() + 543;
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `TK-${year}${month}-${random}`;
}

/**
 * คำนวณระยะทาง
 */
export function calculateDistance(mileageOut: number, mileageIn: number | null): number | null {
  if (mileageIn === null || mileageIn === undefined) return null;
  return mileageIn - mileageOut;
}

/**
 * ตรวจสอบวันหมดอายุ — ใกล้หมดภายใน 30 วัน
 */
export function isExpiringSoon(dateStr: string | null, daysThreshold: number = 30): boolean {
  if (!dateStr) return false;
  const expireDate = new Date(dateStr);
  const now = new Date();
  const diffMs = expireDate.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > 0 && diffDays <= daysThreshold;
}

/**
 * ตรวจสอบหมดอายุแล้ว
 */
export function isExpired(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

/**
 * วันที่ปัจจุบันในรูปแบบ YYYY-MM-DD
 */
export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * เวลาปัจจุบันในรูปแบบ HH:mm
 */
export function getCurrentTime(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}
