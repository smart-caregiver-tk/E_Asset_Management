-- ============================================================
-- E-Asset Management — Supabase Database Setup
-- เทศบาลเมืองทับกวาง (Multi-Department)
-- ============================================================

-- 1. ตาราง departments (ส่วนราชการ)
CREATE TABLE IF NOT EXISTS departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  short_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ตาราง profiles (ข้อมูลผู้ใช้)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'department' CHECK (role IN ('admin', 'department')),
  department_id UUID REFERENCES departments(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ตาราง categories (หมวดหมู่)
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  department_id UUID NOT NULL REFERENCES departments(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ตาราง assets (ครุภัณฑ์)
CREATE TABLE IF NOT EXISTS assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  asset_type TEXT DEFAULT '',
  manufacturer TEXT DEFAULT '',
  model TEXT DEFAULT '',
  serial_no TEXT DEFAULT '',
  engine_no TEXT DEFAULT '',
  frame_no TEXT DEFAULT '',
  plate_no TEXT DEFAULT '',
  special_feature TEXT DEFAULT '',
  acquisition_date TEXT DEFAULT '',
  acquisition_method TEXT DEFAULT '',
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  location TEXT DEFAULT '',
  quantity INTEGER DEFAULT 1,
  unit TEXT DEFAULT '',
  unit_price DECIMAL(15,2) DEFAULT 0,
  total_value DECIMAL(15,2) DEFAULT 0,
  warranty_months INTEGER DEFAULT 0,
  warranty_end_date TEXT DEFAULT '',
  warranty_company TEXT DEFAULT '',
  depreciation_y1 TEXT DEFAULT '',
  depreciation_y2 TEXT DEFAULT '',
  depreciation_y3 TEXT DEFAULT '',
  depreciation_y4 TEXT DEFAULT '',
  depreciation_y5 TEXT DEFAULT '',
  disposal_value DECIMAL(15,2) DEFAULT 0,
  profit_loss DECIMAL(15,2) DEFAULT 0,
  status TEXT DEFAULT 'ใช้งาน',
  borrower TEXT DEFAULT '',
  borrow_date TEXT DEFAULT '',
  return_date TEXT DEFAULT '',
  dispose_date TEXT DEFAULT '',
  photo_urls TEXT[] DEFAULT '{}',
  remark TEXT DEFAULT '',
  department_id UUID NOT NULL REFERENCES departments(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ตาราง repairs (ประวัติซ่อม)
CREATE TABLE IF NOT EXISTS repairs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  sequence INTEGER DEFAULT 1,
  doc_no TEXT DEFAULT '',
  doc_date TEXT DEFAULT '',
  detail TEXT NOT NULL,
  amount DECIMAL(15,2) DEFAULT 0,
  contractor TEXT DEFAULT '',
  remark TEXT DEFAULT '',
  department_id UUID NOT NULL REFERENCES departments(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ตาราง activity_logs (Log)
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  detail TEXT DEFAULT '',
  user_id UUID REFERENCES auth.users(id),
  department_id UUID REFERENCES departments(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- เพิ่มข้อมูล 9 ส่วนราชการ
-- ============================================================
INSERT INTO departments (name, short_name) VALUES
  ('สำนักปลัดเทศบาล', 'สำนักปลัดฯ'),
  ('กองคลัง', 'กองคลัง'),
  ('กองช่าง', 'กองช่าง'),
  ('กองการศึกษา', 'กองการศึกษา'),
  ('กองสาธารณสุขและสิ่งแวดล้อม', 'กองสาธารณสุขฯ'),
  ('กองสวัสดิการสังคม', 'กองสวัสดิการฯ'),
  ('กองยุทธศาสตร์และงบประมาณ', 'กองยุทธศาสตร์ฯ'),
  ('กองการเจ้าหน้าที่', 'กองการเจ้าหน้าที่'),
  ('หน่วยตรวจสอบภายใน', 'หน่วยตรวจสอบฯ')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- Enable Row Level Security
-- ============================================================
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE repairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies
-- ============================================================

-- departments: ทุกคนอ่านได้
DROP POLICY IF EXISTS "Anyone can read departments" ON departments;
CREATE POLICY "Anyone can read departments" ON departments FOR SELECT USING (true);

-- profiles: อ่านโปรไฟล์ตัวเอง
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can read all profiles" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
-- admin อ่านทุกคน
CREATE POLICY "Admin can read all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- categories: department เห็นของตัวเอง, admin เห็นทั้งหมด
DROP POLICY IF EXISTS "Department reads own categories" ON categories;
DROP POLICY IF EXISTS "Department inserts own categories" ON categories;
DROP POLICY IF EXISTS "Department updates own categories" ON categories;
DROP POLICY IF EXISTS "Department deletes own categories" ON categories;
CREATE POLICY "Department reads own categories" ON categories FOR SELECT USING (
  department_id IN (SELECT department_id FROM profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Department inserts own categories" ON categories FOR INSERT WITH CHECK (
  department_id IN (SELECT department_id FROM profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Department updates own categories" ON categories FOR UPDATE USING (
  department_id IN (SELECT department_id FROM profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Department deletes own categories" ON categories FOR DELETE USING (
  department_id IN (SELECT department_id FROM profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- assets: department เห็นของตัวเอง, admin เห็นทั้งหมด
DROP POLICY IF EXISTS "Department reads own assets" ON assets;
DROP POLICY IF EXISTS "Department inserts own assets" ON assets;
DROP POLICY IF EXISTS "Department updates own assets" ON assets;
DROP POLICY IF EXISTS "Department deletes own assets" ON assets;
CREATE POLICY "Department reads own assets" ON assets FOR SELECT USING (
  department_id IN (SELECT department_id FROM profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Department inserts own assets" ON assets FOR INSERT WITH CHECK (
  department_id IN (SELECT department_id FROM profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Department updates own assets" ON assets FOR UPDATE USING (
  department_id IN (SELECT department_id FROM profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Department deletes own assets" ON assets FOR DELETE USING (
  department_id IN (SELECT department_id FROM profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- repairs: department เห็นของตัวเอง, admin เห็นทั้งหมด
DROP POLICY IF EXISTS "Department reads own repairs" ON repairs;
DROP POLICY IF EXISTS "Department inserts own repairs" ON repairs;
DROP POLICY IF EXISTS "Department deletes own repairs" ON repairs;
CREATE POLICY "Department reads own repairs" ON repairs FOR SELECT USING (
  department_id IN (SELECT department_id FROM profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Department inserts own repairs" ON repairs FOR INSERT WITH CHECK (
  department_id IN (SELECT department_id FROM profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Department deletes own repairs" ON repairs FOR DELETE USING (
  department_id IN (SELECT department_id FROM profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- activity_logs: department เห็นของตัวเอง, admin เห็นทั้งหมด
DROP POLICY IF EXISTS "Department reads own logs" ON activity_logs;
DROP POLICY IF EXISTS "Anyone can insert logs" ON activity_logs;
CREATE POLICY "Department reads own logs" ON activity_logs FOR SELECT USING (
  department_id IN (SELECT department_id FROM profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Anyone can insert logs" ON activity_logs FOR INSERT WITH CHECK (true);

-- ============================================================
-- Auto-create profile on signup (Trigger)
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role, department_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'department'),
    (NEW.raw_user_meta_data->>'department_id')::UUID
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- Updated_at auto-update trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS assets_updated_at ON assets;
CREATE TRIGGER assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Storage Bucket สำหรับรูปภาพครุภัณฑ์
-- ============================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('asset-photos', 'asset-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: ทุกคนอ่านรูปได้, login แล้วอัปโหลดได้
DROP POLICY IF EXISTS "Public read asset photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload asset photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete asset photos" ON storage.objects;
CREATE POLICY "Public read asset photos" ON storage.objects FOR SELECT USING (bucket_id = 'asset-photos');
CREATE POLICY "Authenticated upload asset photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'asset-photos' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated delete asset photos" ON storage.objects FOR DELETE USING (bucket_id = 'asset-photos' AND auth.role() = 'authenticated');
