-- ============================================================
-- E-Asset Management — Construction Registry (แบบ พ.ด.1)
-- ทะเบียนพัสดุที่ดินและสิ่งก่อสร้าง
-- เทศบาลเมืองทับกวาง
-- ============================================================

-- ============================================================
-- 1. CONSTRUCTIONS — สิ่งก่อสร้าง (แบบ พ.ด.1)
-- ============================================================
CREATE TABLE IF NOT EXISTS constructions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- ข้อมูลหลัก
  registry_code TEXT NOT NULL,
  construction_type TEXT NOT NULL DEFAULT 'สิ่งก่อสร้าง',
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  location TEXT DEFAULT '',

  -- การได้มา
  procurement_method TEXT DEFAULT '',
  acquisition_date TEXT DEFAULT '',
  contract_no TEXT DEFAULT '',
  price DECIMAL(15,2) DEFAULT 0,
  fiscal_year TEXT DEFAULT '',

  -- ขนาด/มิติ (สำหรับถนน, ท่อ, ฯลฯ)
  width_m DECIMAL(10,2) DEFAULT 0,
  length_m DECIMAL(10,2) DEFAULT 0,
  thickness_m DECIMAL(10,3) DEFAULT 0,
  lanes INTEGER DEFAULT 0,
  shoulder_width_m DECIMAL(10,2) DEFAULT 0,
  area_sqm DECIMAL(15,2) DEFAULT 0,

  -- ข้อมูลที่ดิน
  land_type TEXT DEFAULT '',
  land_rai DECIMAL(10,2) DEFAULT 0,
  land_ngan DECIMAL(10,2) DEFAULT 0,
  land_sqwa DECIMAL(10,2) DEFAULT 0,

  -- สิ่งก่อสร้าง/โรงเรือน
  has_building BOOLEAN DEFAULT FALSE,
  building_completed BOOLEAN DEFAULT FALSE,
  building_no TEXT DEFAULT '',
  building_cost DECIMAL(15,2) DEFAULT 0,

  -- อายุการใช้งานและค่าเสื่อม
  useful_life_years INTEGER DEFAULT 0,
  responsible_officer TEXT DEFAULT '',

  -- สถานะ
  status TEXT DEFAULT 'ใช้งาน',
  photo_urls TEXT[] DEFAULT '{}',
  remark TEXT DEFAULT '',

  -- ส่วนราชการ
  department_id UUID NOT NULL REFERENCES departments(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. CONSTRUCTION_DEPRECIATION — ค่าเสื่อมราคาสะสมรายปี
-- ============================================================
CREATE TABLE IF NOT EXISTS construction_depreciation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  construction_id UUID NOT NULL REFERENCES constructions(id) ON DELETE CASCADE,
  fiscal_year TEXT NOT NULL,
  description TEXT DEFAULT '',
  cost_or_value DECIMAL(15,2) DEFAULT 0,
  accumulated TEXT DEFAULT '',
  remark TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE constructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE construction_depreciation ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. RLS POLICIES — constructions
-- ============================================================
DROP POLICY IF EXISTS "Department reads own constructions" ON constructions;
DROP POLICY IF EXISTS "Department inserts own constructions" ON constructions;
DROP POLICY IF EXISTS "Department updates own constructions" ON constructions;
DROP POLICY IF EXISTS "Admin can manage all constructions" ON constructions;

CREATE POLICY "Department reads own constructions" ON constructions FOR SELECT USING (
  department_id IN (SELECT department_id FROM profiles WHERE id = auth.uid())
  OR public.is_admin()
);
CREATE POLICY "Department inserts own constructions" ON constructions FOR INSERT WITH CHECK (
  department_id IN (SELECT department_id FROM profiles WHERE id = auth.uid())
  OR public.is_admin()
);
CREATE POLICY "Department updates own constructions" ON constructions FOR UPDATE USING (
  department_id IN (SELECT department_id FROM profiles WHERE id = auth.uid())
  OR public.is_admin()
);
CREATE POLICY "Admin can manage all constructions" ON constructions FOR ALL USING (
  public.is_admin()
);

-- ============================================================
-- 5. RLS POLICIES — construction_depreciation
-- ============================================================
DROP POLICY IF EXISTS "Users can read own dept construction_depreciation" ON construction_depreciation;
DROP POLICY IF EXISTS "Users can insert own dept construction_depreciation" ON construction_depreciation;
DROP POLICY IF EXISTS "Users can update own dept construction_depreciation" ON construction_depreciation;
DROP POLICY IF EXISTS "Admin can manage all construction_depreciation" ON construction_depreciation;

CREATE POLICY "Users can read own dept construction_depreciation" ON construction_depreciation FOR SELECT USING (
  construction_id IN (SELECT id FROM constructions WHERE department_id IN (SELECT department_id FROM profiles WHERE id = auth.uid()))
  OR public.is_admin()
);
CREATE POLICY "Users can insert own dept construction_depreciation" ON construction_depreciation FOR INSERT WITH CHECK (
  construction_id IN (SELECT id FROM constructions WHERE department_id IN (SELECT department_id FROM profiles WHERE id = auth.uid()))
  OR public.is_admin()
);
CREATE POLICY "Users can update own dept construction_depreciation" ON construction_depreciation FOR UPDATE USING (
  construction_id IN (SELECT id FROM constructions WHERE department_id IN (SELECT department_id FROM profiles WHERE id = auth.uid()))
  OR public.is_admin()
);
CREATE POLICY "Admin can manage all construction_depreciation" ON construction_depreciation FOR ALL USING (
  public.is_admin()
);

-- ============================================================
-- 6. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_constructions_dept ON constructions(department_id);
CREATE INDEX IF NOT EXISTS idx_constructions_type ON constructions(construction_type);
CREATE INDEX IF NOT EXISTS idx_construction_depreciation_cid ON construction_depreciation(construction_id);
