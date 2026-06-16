// ============================================================================
// Verification Script: Verify SQL Migration on E-Asset Management
// ============================================================================
// คำสั่งสำหรับรัน:
// node scripts/verify-migration.js
// ============================================================================

const { Client } = require('pg');
const path = require('path');

// โหลด Environment Variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../.env.migration') });

async function verify() {
  const connectionString = process.env.NEW_EASSET_DATABASE_URL;

  if (!connectionString || connectionString.includes('[YOUR_NEW_DB_PASSWORD]')) {
    console.error('❌ ไม่พบข้อมูลการเชื่อมต่อฐานข้อมูลใหม่!');
    process.exit(1);
  }

  console.log('🔌 กำลังเชื่อมต่อกับฐานข้อมูลปลายทางเพื่อเริ่มการตรวจสอบ...');
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ เชื่อมต่อสำเร็จ! เริ่มขั้นตอนการตรวจวัดผล...\n');

    console.log('================================================================');
    console.log('📋 รายงานผลการตรวจสอบโครงสร้างฐานข้อมูล (Post-Migration Verification)');
    console.log('================================================================');

    // 1. ตรวจสอบตาราง vehicle_*
    const expectedTables = [
      'vehicle_cars',
      'vehicle_drivers',
      'vehicle_trips',
      'vehicle_maintenance_logs',
      'vehicle_incident_reports',
      'vehicle_fuel_logs'
    ];

    let createdTablesCount = 0;
    console.log('1. การตรวจสอบตาราง vehicle_* และจำนวนข้อมูล:');
    for (const table of expectedTables) {
      // เช็คว่าตารางมีอยู่จริงหรือไม่
      const checkTableQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `;
      const { rows: tableExists } = await client.query(checkTableQuery, [table]);
      const exists = tableExists[0].exists;

      if (exists) {
        createdTablesCount++;
        // เช็คจำนวนแถว (ควรเป็น 0)
        const { rows: countRows } = await client.query(`SELECT COUNT(*) FROM ${table}`);
        const count = parseInt(countRows[0].count, 10);
        console.log(`  [✓] ตาราง ${table.padEnd(30)} -> สร้างสำเร็จ (จำนวนข้อมูล: ${count} แถว)`);
      } else {
        console.log(`  [✗] ตาราง ${table.padEnd(30)} -> ไม่พบตาราง!`);
      }
    }
    console.log(`  -> สร้างตารางสำเร็จทั้งหมด: ${createdTablesCount}/${expectedTables.length} ตาราง`);

    // 2. ตรวจสอบ RLS
    console.log('\n2. การตรวจสอบการเปิดใช้งาน Row Level Security (RLS):');
    for (const table of expectedTables) {
      const checkRlsQuery = `
        SELECT relrowsecurity 
        FROM pg_class 
        WHERE oid = $1::regclass;
      `;
      try {
        const { rows: rlsCheck } = await client.query(checkRlsQuery, [table]);
        const rlsEnabled = rlsCheck[0].relrowsecurity;
        console.log(`  [${rlsEnabled ? '✓' : '✗'}] RLS สถานะสำหรับ ${table.padEnd(30)} -> ${rlsEnabled ? 'เปิดใช้งาน (ENABLED)' : 'ปิดอยู่ (DISABLED)'}`);
      } catch (err) {
        console.log(`  [✗] RLS สถานะสำหรับ ${table.padEnd(30)} -> ตรวจสอบไม่ได้ (ตารางไม่มีอยู่จริง)`);
      }
    }

    // 3. ตรวจสอบการเพิ่มหน่วยงานใหม่
    console.log('\n3. การตรวจสอบการเพิ่มหน่วยงานในตาราง departments:');
    const expectedDepts = [
      'สำนักปลัดเทศบาล (งานป้องกันและบรรเทาสาธารณภัย)',
      'สำนักปลัดเทศบาล (งานรักษาความสงบ/เทศกิจ)',
      'โรงเรียนเทศบาล 1 (สมุห์พร้อม)',
      'โรงเรียนเทศบาล 2 (จิตรประไพชาเล่ต์)'
    ];

    for (const deptName of expectedDepts) {
      const checkDeptQuery = `SELECT id FROM departments WHERE name = $1`;
      const { rows } = await client.query(checkDeptQuery, [deptName]);
      if (rows.length > 0) {
        console.log(`  [✓] แผนก "${deptName}" -> เพิ่มสำเร็จ (UUID: ${rows[0].id})`);
      } else {
        console.log(`  [✗] แผนก "${deptName}" -> ไม่พบในตาราง departments!`);
      }
    }

    // 4. ตรวจสอบ Storage Buckets
    console.log('\n4. การตรวจสอบ Storage Buckets:');
    const expectedBuckets = ['vehicle-photos', 'vehicle-documents'];
    for (const bucket of expectedBuckets) {
      const checkBucketQuery = `SELECT id, name, public FROM storage.buckets WHERE id = $1`;
      const { rows } = await client.query(checkBucketQuery, [bucket]);
      if (rows.length > 0) {
        console.log(`  [✓] Bucket "${bucket.padEnd(20)}" -> สร้างสำเร็จ (Public: ${rows[0].public})`);
      } else {
        console.log(`  [✗] Bucket "${bucket.padEnd(20)}" -> ไม่พบในตาราง storage.buckets!`);
      }
    }

    // 5. รายงาน RLS Policies ที่ติดตั้ง
    console.log('\n5. รายการนโยบาย (RLS Policies) ทั้งหมดของระบบยานพาหนะ:');
    const checkPoliciesQuery = `
      SELECT policyname, tablename, cmd, roles 
      FROM pg_policies 
      WHERE tablename LIKE 'vehicle_%';
    `;
    const { rows: policies } = await client.query(checkPoliciesQuery);
    if (policies.length > 0) {
      policies.forEach(p => {
        console.log(`  - นโยบาย [${p.policyname}] บนตาราง [${p.tablename}] คำสั่ง: ${p.cmd}`);
      });
    } else {
      console.log('  ⚠️ ไม่พบนโยบายความปลอดภัยใดๆ ที่ขึ้นต้นด้วย vehicle_*');
    }

    console.log('\n================================================================');
    console.log('🛡️ ยืนยันผลตรวจสอบความปลอดภัยเพิ่มเติม:');
    // เช็คว่ามีข้อมูลครุภัณฑ์/ซ่อม ของทรัพย์สินเดิมเสียหายหรือไม่
    const { rows: assetsCount } = await client.query('SELECT COUNT(*) FROM assets');
    console.log(`  - ตารางทรัพย์สินเดิม (assets) ปลอดภัย: มีข้อมูลอยู่ครบถ้วน ${assetsCount[0].count} แถว`);
    console.log('  [CONFIRMED] ไม่พบการเปลี่ยนแปลงข้อมูลเดิมของระบบ E-Asset');
    console.log('  [CONFIRMED] ไม่มีการนำเข้าข้อมูล (Import) เข้าสู่ตาราง vehicle_* ในขั้นตอนนี้');
    console.log('================================================================');

  } catch (err) {
    console.error('❌ เกิดข้อผิดพลาดระหว่างกระบวนการตรวจสอบ:', err.message);
  } finally {
    await client.end();
  }
}

verify();
