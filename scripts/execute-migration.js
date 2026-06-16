// ============================================================================
// Migration Runner Script: Executes supabase-vehicle-migration.sql
// ============================================================================
// คำสั่งสำหรับรัน:
// node scripts/execute-migration.js
// ============================================================================

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// โหลด Environment Variables อิงจากโฟลเดอร์ของสคริปต์โดยตรง
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../.env.migration') });

async function runMigration() {
  const connectionString = process.env.NEW_EASSET_DATABASE_URL;

  if (!connectionString || connectionString.includes('[YOUR_NEW_DB_PASSWORD]')) {
    console.error('❌ ไม่พบข้อมูลการเชื่อมต่อฐานข้อมูลใหม่!');
    console.error('กรุณากรอก NEW_EASSET_DATABASE_URL ในไฟล์ .env.local หรือ .env.migration ก่อนเรียกใช้งาน');
    console.error('ตัวอย่าง: NEW_EASSET_DATABASE_URL="postgresql://postgres:[password]@db.auzohtekymjadzctnzll.supabase.co:5432/postgres"');
    process.exit(1);
  }

  console.log('🔌 กำลังเชื่อมต่อกับ Supabase Database (E-Asset Management)...');
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ!');

    const sqlPath = path.join(__dirname, '../supabase-vehicle-migration.sql');
    console.log(`📖 กำลังอ่านสคริปต์ SQL: ${sqlPath}`);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('⚡ กำลังรันคำสั่ง SQL Migration...');
    // รัน SQL ทั้งหมดใน Transaction เดียวกัน
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');

    console.log('🎉 ย้ายโครงสร้างฐานข้อมูล (SQL Migration) สำเร็จเรียบร้อย!');

  } catch (err) {
    console.error('❌ เกิดข้อผิดพลาดระหว่างรัน SQL Migration:');
    console.error(err.message);
    try {
      await client.query('ROLLBACK');
      console.log('🔄 ทำการ Rollback รายการทั้งหมดเพื่อความปลอดภัยแล้ว');
    } catch (rollbackErr) {
      console.error('❌ Rollback ล้มเหลว:', rollbackErr.message);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
