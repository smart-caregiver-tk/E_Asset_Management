-- ============================================================
-- E-Asset Management — Construction Repairs
-- ทะเบียนพัสดุที่ดินและสิ่งก่อสร้าง (บันทึกการซ่อม/ปรับปรุงแก้ไขพัสดุ)
-- ============================================================

CREATE TABLE IF NOT EXISTS construction_repairs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  construction_id UUID NOT NULL REFERENCES constructions(id) ON DELETE CASCADE,
  repair_date DATE,
  detail TEXT NOT NULL,
  amount DECIMAL(15,2) DEFAULT 0,
  contractor TEXT DEFAULT '',
  remark TEXT DEFAULT '',
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE construction_repairs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Department reads own construction_repairs" ON construction_repairs;
DROP POLICY IF EXISTS "Department inserts own construction_repairs" ON construction_repairs;
DROP POLICY IF EXISTS "Department updates own construction_repairs" ON construction_repairs;
DROP POLICY IF EXISTS "Department deletes own construction_repairs" ON construction_repairs;
DROP POLICY IF EXISTS "Admin can manage all construction_repairs" ON construction_repairs;

CREATE POLICY "Department reads own construction_repairs" ON construction_repairs FOR SELECT USING (
  department_id IN (SELECT department_id FROM profiles WHERE id = auth.uid())
  OR public.is_admin()
);
CREATE POLICY "Department inserts own construction_repairs" ON construction_repairs FOR INSERT WITH CHECK (
  department_id IN (SELECT department_id FROM profiles WHERE id = auth.uid())
  OR public.is_admin()
);
CREATE POLICY "Department updates own construction_repairs" ON construction_repairs FOR UPDATE USING (
  department_id IN (SELECT department_id FROM profiles WHERE id = auth.uid())
  OR public.is_admin()
);
CREATE POLICY "Department deletes own construction_repairs" ON construction_repairs FOR DELETE USING (
  department_id IN (SELECT department_id FROM profiles WHERE id = auth.uid())
  OR public.is_admin()
);
CREATE POLICY "Admin can manage all construction_repairs" ON construction_repairs FOR ALL USING (
  public.is_admin()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_construction_repairs_cid ON construction_repairs(construction_id);
CREATE INDEX IF NOT EXISTS idx_construction_repairs_dept ON construction_repairs(department_id);
