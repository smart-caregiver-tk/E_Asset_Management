// ============================================================================
// Real Data Migration Script: Caregiver -> E-Asset Management (Smart Vehicle)
// ============================================================================
// คำสั่งสำหรับรัน:
// node scripts/migrate-real.js
// ============================================================================

const { Client } = require('pg');
const path = require('path');

// โหลด Environment Variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../.env.migration') });

// ข้อมูลแผนกปลายทาง (E-Asset Management UUIDs)
const DEPT_MAP = {
  'admin': '8709d278-351e-4531-81d8-6796c990a6ca', // สำนักปลัดเทศบาล (คีย์ admin ย้ายเข้าสำนักปลัดฯ)
  'secretariat': '8709d278-351e-4531-81d8-6796c990a6ca', // สำนักปลัดเทศบาล
  'finance': '3fcf0e78-fcd8-4886-a99f-8693707d9c14', // กองคลัง
  'engineering': '93ad6e31-24b3-48f8-9862-320bf40fb3f2', // กองช่าง
  'education': '2ae6ff1a-dabd-4ff7-b8a1-fbc77526da63', // กองการศึกษา
  'health': '36878258-894b-4052-a94f-c59522ada7a7', // กองสาธารณสุขและสิ่งแวดล้อม
  'strategy': '9fb478b5-c25c-4513-8803-cf9dd2fad05f', // กองยุทธศาสตร์และงบประมาณ
  'welfare': 'd4918bc1-94ec-4e5f-b65e-2fb3c4e40d9f', // กองสวัสดิการสังคม
  'personnel': '9740c774-b7f3-4c61-a658-47c0fa036274', // กองการเจ้าหน้าที่
  'audit': 'ce833406-2d01-4130-aba5-9288328f45e5', // หน่วยตรวจสอบภายใน
  'secretariat_prevention': 'e24d5e05-05b5-48c5-81cc-5cef495eeafd', // สำนักปลัดเทศบาล (งานป้องกันฯ)
  'secretariat_security': '5197aac7-723f-4e49-a61d-797eae95b2d7', // สำนักปลัดเทศบาล (งานเทศกิจฯ)
  'school1': '659cf3b4-f311-4536-93fe-9afb60c43d20', // โรงเรียนเทศบาล 1 (สมุห์พร้อม)
  'school2': '92c69a6e-04b3-4007-bbe6-794edd86de69'  // โรงเรียนเทศบาล 2 (จิตรประไพชาเล่ต์)
};

async function runRealMigration() {
  const oldUrl = process.env.OLD_CAREGIVER_DATABASE_URL;
  const newUrl = process.env.NEW_EASSET_DATABASE_URL;

  if (!oldUrl || !newUrl || oldUrl.includes('[YOUR_OLD_DB_PASSWORD]') || newUrl.includes('[YOUR_NEW_DB_PASSWORD]')) {
    console.error('❌ ข้อมูลการเชื่อมต่อฐานข้อมูลไม่ครบถ้วน!');
    console.error('กรุณาตั้งค่าทั้ง OLD_CAREGIVER_DATABASE_URL และ NEW_EASSET_DATABASE_URL ใน .env.migration');
    process.exit(1);
  }

  console.log('🔌 กำลังเชื่อมต่อกับฐานข้อมูลต้นทาง (Smart Caregiver)...');
  const sourceClient = new Client({ connectionString: oldUrl });
  await sourceClient.connect();
  console.log('✅ เชื่อมต่อฐานข้อมูลต้นทางสำเร็จ!');

  console.log('🔌 กำลังเชื่อมต่อกับฐานข้อมูลปลายทาง (E-Asset Management)...');
  const targetClient = new Client({ connectionString: newUrl });
  await targetClient.connect();
  console.log('✅ เชื่อมต่อฐานข้อมูลปลายทางสำเร็จ!\n');

  try {
    // ---------------------------------------------------------
    // 1. ดึงข้อมูลและย้ายตาราง vehicles -> vehicle_cars
    // ---------------------------------------------------------
    console.log('📦 เริ่มการย้ายตาราง vehicles...');
    const { rows: oldVehicles } = await sourceClient.query('SELECT * FROM vehicles');
    console.log(`🔍 พบข้อมูลรถยนต์ต้นทาง: ${oldVehicles.length} รายการ`);

    let vehiclesInserted = 0;
    let vehiclesSkipped = 0;

    for (const car of oldVehicles) {
      const targetDeptId = DEPT_MAP[car.department_id] || null;

      const query = `
        INSERT INTO vehicle_cars (
          id, license_plate, vehicle_name, vehicle_type, brand, model, year, color,
          fuel_type, mileage_current, status, department_id, source_department_key,
          insurance_expire, tax_expire, responsible_officer, image_url, notes, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        ON CONFLICT (id) DO NOTHING
      `;

      const res = await targetClient.query(query, [
        car.id,
        car.license_plate,
        car.vehicle_name,
        car.vehicle_type || 'other',
        car.brand || '',
        car.model || '',
        car.year || 2569,
        car.color || '',
        car.fuel_type || 'diesel',
        car.mileage_current || 0,
        car.status || 'available',
        targetDeptId,
        car.department_id || '',
        car.insurance_expire || null,
        car.tax_expire || null,
        car.responsible_officer || '',
        car.image_url || '',
        car.notes || '',
        car.created_at || new Date(),
        car.updated_at || new Date()
      ]);

      if (res.rowCount > 0) {
        vehiclesInserted++;
      } else {
        vehiclesSkipped++;
      }
    }
    console.log(`✅ ย้ายตาราง vehicle_cars สำเร็จ: นำเข้า ${vehiclesInserted} รายการ, ข้าม ${vehiclesSkipped} รายการ\n`);

    // ---------------------------------------------------------
    // 2. ดึงข้อมูลและย้ายตาราง drivers -> vehicle_drivers
    // ---------------------------------------------------------
    console.log('📦 เริ่มการย้ายตาราง drivers...');
    const { rows: oldDrivers } = await sourceClient.query('SELECT * FROM drivers');
    console.log(`🔍 พบข้อมูลคนขับรถต้นทาง: ${oldDrivers.length} รายการ`);

    let driversInserted = 0;
    let driversSkipped = 0;

    for (const d of oldDrivers) {
      const targetDeptId = DEPT_MAP[d.department_id] || null;

      const query = `
        INSERT INTO vehicle_drivers (
          id, name, employee_id, department_id, source_department_key, license_no,
          license_type, license_expire, phone, status, notes, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO NOTHING
      `;

      const res = await targetClient.query(query, [
        d.id,
        d.name,
        d.employee_id || '',
        targetDeptId,
        d.department_id || '',
        d.license_no || '',
        d.license_type || 'ท.2',
        d.license_expire || null,
        d.phone || '',
        d.status || 'active',
        d.notes || '',
        d.created_at || new Date()
      ]);

      if (res.rowCount > 0) {
        driversInserted++;
      } else {
        driversSkipped++;
      }
    }
    console.log(`✅ ย้ายตาราง vehicle_drivers สำเร็จ: นำเข้า ${driversInserted} รายการ, ข้าม ${driversSkipped} รายการ\n`);

    // ---------------------------------------------------------
    // 3. ดึงข้อมูลและย้ายตาราง trip_logs -> vehicle_trips
    // ---------------------------------------------------------
    console.log('📦 เริ่มการย้ายตาราง trip_logs...');
    const { rows: oldTrips } = await sourceClient.query('SELECT * FROM trip_logs');
    console.log(`🔍 พบข้อมูลใบขอใช้รถต้นทาง: ${oldTrips.length} รายการ`);

    let tripsInserted = 0;
    let tripsSkipped = 0;

    for (const t of oldTrips) {
      const targetDeptId = DEPT_MAP[t.user_department] || null;

      const query = `
        INSERT INTO vehicle_trips (
          id, trip_no, vehicle_id, driver_id, user_name, user_department, source_department_key,
          user_position, destination, purpose, depart_date, depart_time, return_date, return_time,
          mileage_out, mileage_in, distance_total, recorder_name, recorder_position, status,
          approved_by, approved_at, passengers_count, addressed_to, notes, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
        ON CONFLICT (id) DO NOTHING
      `;

      const res = await targetClient.query(query, [
        t.id,
        t.trip_no,
        t.vehicle_id,
        t.driver_id,
        t.user_name || '',
        targetDeptId,
        t.user_department || '',
        t.user_position || '',
        t.destination || '',
        t.purpose || '',
        t.depart_date,
        t.depart_time || '',
        t.return_date || null,
        t.return_time || '',
        t.mileage_out || 0,
        t.mileage_in || null,
        t.distance_total || null,
        t.recorder_name || '',
        t.recorder_position || '',
        t.status || 'pending',
        t.approved_by || '',
        t.approved_at || null,
        t.passengers_count || 1,
        t.addressed_to || 'นายกเทศมนตรีเมืองทับกวาง',
        t.notes || '',
        t.created_at || new Date()
      ]);

      if (res.rowCount > 0) {
        tripsInserted++;
      } else {
        tripsSkipped++;
      }
    }
    console.log(`✅ ย้ายตาราง vehicle_trips สำเร็จ: นำเข้า ${tripsInserted} รายการ, ข้าม ${tripsSkipped} รายการ\n`);

    console.log('================================================================');
    console.log('🎉 เสร็จสิ้นกระบวนการนำเข้าข้อมูลจริง (Phase 2 Data Import Complete)');
    console.log('================================================================');

  } catch (err) {
    console.error('❌ เกิดข้อผิดพลาดร้ายแรงระหว่างทำการย้ายข้อมูล:', err.message);
  } finally {
    await sourceClient.end();
    await targetClient.end();
  }
}

runRealMigration();
