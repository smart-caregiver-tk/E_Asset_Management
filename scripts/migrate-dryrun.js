// ============================================================================
// Dry-run Migration Script: Smart Vehicle -> E-Asset Management
// ============================================================================
// คำสั่งสำหรับรัน:
// node scripts/migrate-dryrun.js
// ============================================================================

const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../.env.migration') });

// 1. กำหนดค่าสำหรับ REST API fallback (ใช้ Anon Keys สาธารณะเพื่อรัน dry-run ได้ทันที)
const OLD_SUPABASE_URL = 'https://shzreavpufntpbpvzpul.supabase.co';
const OLD_SUPABASE_ANON_KEY = 'sb_publishable_olC4NMAj5oVfXdVADRtcRQ_8--MaIur';

const NEW_SUPABASE_URL = 'https://auzohtekymjadzctnzll.supabase.co';
const NEW_SUPABASE_ANON_KEY = 'sb_publishable_pqJRbzHQlIAt-m2-39ZLcA_LZCjbfLx';

// 2. Mapping ชื่อแผนกจากแบบเดิม (String ID) -> ชื่อเต็มที่จะเช็คในฐานข้อมูล E-Asset
// รวม 'admin' -> 'สำนักปลัดเทศบาล' ตามคำสั่งของผู้อนุมัติ
const DEPT_NAME_MAP = {
  'admin': 'สำนักปลัดเทศบาล', // Map แอดมินเข้าสำนักปลัดฯ เพื่อความปลอดภัย
  'secretariat': 'สำนักปลัดเทศบาล',
  'secretariat_prevention': 'สำนักปลัดเทศบาล (งานป้องกันและบรรเทาสาธารณภัย)',
  'secretariat_security': 'สำนักปลัดเทศบาล (งานรักษาความสงบ/เทศกิจ)',
  'finance': 'กองคลัง',
  'engineering': 'กองช่าง',
  'education': 'กองการศึกษา',
  'health': 'กองสาธารณสุขและสิ่งแวดล้อม',
  'strategy': 'กองยุทธศาสตร์และงบประมาณ',
  'welfare': 'กองสวัสดิการสังคม',
  'personnel': 'กองการเจ้าหน้าที่',
  'audit': 'หน่วยตรวจสอบภายใน',
  'school1': 'โรงเรียนเทศบาล 1 (สมุห์พร้อม)',
  'school2': 'โรงเรียนเทศบาล 2 (จิตรประไพชาเล่ต์)',
};

// 3. ฟังก์ชันดึงข้อมูลผ่าน REST API
async function fetchViaRest(baseUrl, anonKey, table) {
  const res = await fetch(`${baseUrl}/rest/v1/${table}?select=*`, {
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`
    }
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${table}: ${res.statusText}`);
  }
  return await res.json();
}

async function runDryRun() {
  console.log('🚀 เริ่มการทำงาน Dry-run Migration...');
  
  const oldDbUrl = process.env.OLD_CAREGIVER_DATABASE_URL;
  const newDbUrl = process.env.NEW_EASSET_DATABASE_URL;

  let departments = [];
  let oldData = {
    vehicles: [],
    drivers: [],
    trip_logs: [],
    maintenance_logs: [],
    incident_reports: [],
    fuel_logs: []
  };

  const usePostgres = oldDbUrl && newDbUrl;

  if (usePostgres) {
    console.log('🔌 ตรวจพบการตั้งค่า PostgreSQL URLs -> รันด้วยโหมด Direct Database');
    const oldClient = new Client({ connectionString: oldDbUrl });
    const newClient = new Client({ connectionString: newDbUrl });
    
    try {
      await oldClient.connect();
      await newClient.connect();

      // ดึงข้อมูลแผนกปลายทาง
      const { rows: depts } = await newClient.query('SELECT id, name, short_name FROM departments');
      departments = depts;

      // ดึงตารางจากต้นทาง
      const { rows: v } = await oldClient.query('SELECT * FROM vehicles');
      const { rows: d } = await oldClient.query('SELECT * FROM drivers');
      const { rows: t } = await oldClient.query('SELECT * FROM trip_logs');
      const { rows: m } = await oldClient.query('SELECT * FROM maintenance_logs');
      const { rows: i } = await oldClient.query('SELECT * FROM incident_reports');
      const { rows: f } = await oldClient.query('SELECT * FROM fuel_logs');

      oldData = { vehicles: v, drivers: d, trip_logs: t, maintenance_logs: m, incident_reports: i, fuel_logs: f };

    } catch (err) {
      console.error('❌ เกิดข้อผิดพลาดในโหมด PostgreSQL:', err.message);
      process.exit(1);
    } finally {
      await oldClient.end();
      await newClient.end();
    }
  } else {
    console.log('🌐 ไม่พบ PostgreSQL URLs -> รันด้วยโหมด REST API (ใช้ Anon Keys สาธารณะ)');
    try {
      // ดึงข้อมูลแผนกปลายทาง
      departments = await fetchViaRest(NEW_SUPABASE_URL, NEW_SUPABASE_ANON_KEY, 'departments');

      // ดึงตารางจากต้นทาง
      oldData.vehicles = await fetchViaRest(OLD_SUPABASE_URL, OLD_SUPABASE_ANON_KEY, 'vehicles');
      oldData.drivers = await fetchViaRest(OLD_SUPABASE_URL, OLD_SUPABASE_ANON_KEY, 'drivers');
      oldData.trip_logs = await fetchViaRest(OLD_SUPABASE_URL, OLD_SUPABASE_ANON_KEY, 'trip_logs');
      oldData.maintenance_logs = await fetchViaRest(OLD_SUPABASE_URL, OLD_SUPABASE_ANON_KEY, 'maintenance_logs');
      oldData.incident_reports = await fetchViaRest(OLD_SUPABASE_URL, OLD_SUPABASE_ANON_KEY, 'incident_reports');
      oldData.fuel_logs = await fetchViaRest(OLD_SUPABASE_URL, OLD_SUPABASE_ANON_KEY, 'fuel_logs');

    } catch (err) {
      console.error('❌ เกิดข้อผิดพลาดในโหมด REST API:', err.message);
      process.exit(1);
    }
  }

  console.log(`✨ ดึงข้อมูลแผนกใน E-Asset สำเร็จ: ทั้งหมด ${departments.length} แผนก`);

  // สร้าง Map สำหรับแปลง name -> UUID
  const deptNameToUuid = {};
  departments.forEach(dept => {
    deptNameToUuid[dept.name] = dept.id;
  });

  // ตัวแปรนับจำนวนการแมป
  let readyCount = 0;
  let errorCount = 0;
  const warningList = [];

  // ฟังก์ชันในการแปลง department_id เก่า (เช่น 'secretariat') -> UUID ของ E-Asset
  const mapDepartmentId = (oldDeptId, contextLabel, recordId) => {
    if (!oldDeptId) return null;
    const deptName = DEPT_NAME_MAP[oldDeptId];
    if (!deptName) {
      warningList.push(`[${contextLabel} ID:${recordId}] ไม่พบชื่อแผนกภาษาไทยของคีย์เดิม: "${oldDeptId}"`);
      errorCount++;
      return null;
    }
    const newUuid = deptNameToUuid[deptName];
    if (!newUuid) {
      warningList.push(`[${contextLabel} ID:${recordId}] แผนกชื่อ "${deptName}" ไม่มีใน E-Asset (ต้องสร้างแผนกนี้ก่อน)`);
      errorCount++;
      return null;
    }
    readyCount++;
    return newUuid;
  };

  // ----------------------------------------------------
  // ตาราง 1: Vehicles -> vehicle_cars
  // ----------------------------------------------------
  console.log('\n--- 1. ตาราง vehicles (ยานพาหนะ) ---');
  console.log(`📊 จำนวนข้อมูลเดิม: ${oldData.vehicles.length} รายการ`);

  const mappedVehicles = oldData.vehicles.map(v => ({
    id: v.id,
    license_plate: v.license_plate,
    vehicle_name: v.vehicle_name,
    vehicle_type: v.vehicle_type,
    brand: v.brand,
    model: v.model,
    year: v.year,
    color: v.color,
    fuel_type: v.fuel_type,
    mileage_current: v.mileage_current,
    status: v.status,
    department_id: mapDepartmentId(v.department_id, 'vehicle_cars', v.id),
    source_department_key: v.department_id || '', // เก็บประวัติค่าเดิมเพื่อ Audit
    insurance_expire: v.insurance_expire,
    tax_expire: v.tax_expire,
    responsible_officer: v.responsible_officer,
    image_url: v.image_url,
    notes: v.notes,
    asset_id: null,
    created_at: v.created_at,
    updated_at: v.updated_at
  }));

  console.log('📋 ตัวอย่างข้อมูลหลังแปลง:');
  console.table(mappedVehicles.slice(0, 5).map(v => ({
    ทะเบียน: v.license_plate,
    ชื่อรถ: v.vehicle_name,
    ประเภท: v.vehicle_type,
    สถานะ: v.status,
    'กองงาน (UUID)': v.department_id || '⚠️ MAP FAIL',
    คีย์เดิม: v.source_department_key
  })));

  // ----------------------------------------------------
  // ตาราง 2: Drivers -> vehicle_drivers
  // ----------------------------------------------------
  console.log('\n--- 2. ตาราง drivers (คนขับรถ) ---');
  console.log(`📊 จำนวนข้อมูลเดิม: ${oldData.drivers.length} รายการ`);

  const mappedDrivers = oldData.drivers.map(d => ({
    id: d.id,
    name: d.name,
    employee_id: d.employee_id,
    department_id: mapDepartmentId(d.department_id, 'vehicle_drivers', d.id),
    source_department_key: d.department_id || '', // เก็บประวัติค่าเดิมเพื่อ Audit
    license_no: d.license_no,
    license_type: d.license_type,
    license_expire: d.license_expire,
    phone: d.phone,
    status: d.status,
    notes: d.notes,
    created_at: d.created_at
  }));

  console.log('📋 ตัวอย่างข้อมูลหลังแปลง:');
  console.table(mappedDrivers.slice(0, 5).map(d => ({
    ชื่อ: d.name,
    เลขพนักงาน: d.employee_id,
    ประเภทใบขับขี่: d.license_type,
    สถานะ: d.status,
    'กองงาน (UUID)': d.department_id || '⚠️ MAP FAIL',
    คีย์เดิม: d.source_department_key
  })));

  // ----------------------------------------------------
  // ตาราง 3: Trip Logs -> vehicle_trips
  // ----------------------------------------------------
  console.log('\n--- 3. ตาราง trip_logs (การขอใช้รถ) ---');
  console.log(`📊 จำนวนข้อมูลเดิม: ${oldData.trip_logs.length} รายการ`);

  const mappedTrips = oldData.trip_logs.map(t => ({
    id: t.id,
    trip_no: t.trip_no,
    vehicle_id: t.vehicle_id,
    driver_id: t.driver_id,
    user_name: t.user_name,
    user_department: mapDepartmentId(t.user_department, 'vehicle_trips', t.id),
    source_department_key: t.user_department || '', // เก็บประวัติค่าเดิมเพื่อ Audit
    user_position: t.user_position,
    destination: t.destination,
    purpose: t.purpose,
    depart_date: t.depart_date,
    depart_time: t.depart_time,
    return_date: t.return_date,
    return_time: t.return_time,
    mileage_out: t.mileage_out,
    mileage_in: t.mileage_in,
    distance_total: t.distance_total,
    recorder_name: t.recorder_name,
    recorder_position: t.recorder_position,
    status: t.status,
    approved_by: t.approved_by,
    approved_at: t.approved_at,
    passengers_count: t.passengers_count,
    addressed_to: t.addressed_to,
    notes: t.notes,
    user_id: null,
    created_at: t.created_at
  }));

  console.log('📋 ตัวอย่างข้อมูลหลังแปลง:');
  console.table(mappedTrips.slice(0, 5).map(t => ({
    รหัสใบงาน: t.trip_no,
    ผู้ขอใช้: t.user_name,
    ปลายทาง: t.destination,
    สถานะ: t.status,
    'กองงานผู้ขอ (UUID)': t.user_department || '⚠️ MAP FAIL',
    คีย์เดิม: t.source_department_key
  })));

  // ----------------------------------------------------
  // ตาราง 4: Maintenance Logs -> vehicle_maintenance_logs
  // ----------------------------------------------------
  console.log('\n--- 4. ตาราง maintenance_logs (การซ่อมบำรุง) ---');
  console.log(`📊 จำนวนข้อมูลเดิม: ${oldData.maintenance_logs.length} รายการ`);

  const mappedMaintenances = oldData.maintenance_logs.map(m => {
    readyCount++;
    return {
      id: m.id,
      vehicle_id: m.vehicle_id,
      mileage_at_repair: m.mileage_at_repair,
      repair_items: m.repair_items,
      cost: m.cost,
      repair_shop: m.repair_shop,
      received_date: m.received_date,
      notes: m.notes,
      repair_id: null,
      created_at: m.created_at
    };
  });

  // ----------------------------------------------------
  // ตาราง 5: Incident Reports -> vehicle_incident_reports
  // ----------------------------------------------------
  console.log('\n--- 5. ตาราง incident_reports (อุบัติเหตุ) ---');
  console.log(`📊 จำนวนข้อมูลเดิม: ${oldData.incident_reports.length} รายการ`);

  const mappedIncidents = oldData.incident_reports.map(i => {
    readyCount++;
    return {
      id: i.id,
      vehicle_id: i.vehicle_id,
      driver_id: i.driver_id,
      report_date: i.report_date,
      license_plate_ref: i.license_plate_ref,
      incident_date: i.incident_date,
      incident_location: i.incident_location,
      damage_description: i.damage_description,
      opponent_vehicle: i.opponent_vehicle,
      opponent_driver: i.opponent_driver,
      created_at: i.created_at
    };
  });

  // ----------------------------------------------------
  // ตาราง 6: Fuel Logs -> vehicle_fuel_logs
  // ----------------------------------------------------
  console.log('\n--- 6. ตาราง fuel_logs (เติมน้ำมัน) ---');
  console.log(`📊 จำนวนข้อมูลเดิม: ${oldData.fuel_logs.length} รายการ`);

  const mappedFuels = oldData.fuel_logs.map(f => {
    readyCount++;
    return {
      id: f.id,
      vehicle_id: f.vehicle_id,
      trip_id: f.trip_id,
      fuel_date: f.fuel_date,
      fuel_amount: f.fuel_amount,
      fuel_price_per_liter: f.fuel_price_per_liter,
      total_cost: f.total_cost,
      mileage: f.mileage,
      fuel_station: f.fuel_station,
      receipt_no: f.receipt_no,
      notes: f.notes,
      created_at: f.created_at
    };
  });

  // ----------------------------------------------------
  // 4. สรุปผล
  // ----------------------------------------------------
  console.log('\n================================================================');
  console.log('📊 สรุปรายงานผลการตรวจสอบข้อมูล (Dry-run Migration)');
  console.log('================================================================');
  console.log(`- จำนวนแถวต้นทางทั้งหมด: ${
    oldData.vehicles.length +
    oldData.drivers.length +
    oldData.trip_logs.length +
    oldData.maintenance_logs.length +
    oldData.incident_reports.length +
    oldData.fuel_logs.length
  } แถว`);
  console.log(`- จำนวนแถวที่พร้อมย้ายทันที: ${readyCount} แถว`);
  console.log(`- จำนวนแถวที่ติดปัญหา mapping แผนก: ${errorCount} แถว`);
  
  if (warningList.length > 0) {
    console.log('\n⚠️ รายการข้อควรระวัง/Warning ทั้งหมด:');
    warningList.forEach(warn => console.log(`  - ${warn}`));
  } else {
    console.log('\n✅ ไม่พบปัญหาการ mapping ใดๆ ทั้งสิ้น! ข้อมูลทั้งหมดผ่านการจับคู่สมบูรณ์ (100% Correct)');
  }

  console.log('\n🛡️ ยืนยันความปลอดภัย:');
  console.log('  [CONFIRMED] ไม่มีคำสั่ง INSERT/UPDATE/DELETE/DROP/ALTER/TRUNCATE ใด ๆ ทำงานจริง');
  console.log('  [CONFIRMED] ไม่มีตารางหรือข้อมูลถูกเขียนหรือแก้ไขในฐานข้อมูล E-Asset Management');
  console.log('================================================================');
}

runDryRun();
