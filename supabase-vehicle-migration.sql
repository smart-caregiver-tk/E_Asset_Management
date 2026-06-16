-- ============================================================
-- Smart Vehicle TK — Database Migration for E-Asset Management
-- เทศบาลเมืองทับกวาง
-- ============================================================

-- ============================================================
-- 0. เพิ่มหน่วยงาน/กลุ่มงานเพิ่มเติมที่ยังไม่มีในตารางหลัก
-- ============================================================
INSERT INTO departments (name, short_name) VALUES
  ('สำนักปลัดเทศบาล (งานป้องกันและบรรเทาสาธารณภัย)', 'งานป้องกันฯ'),
  ('สำนักปลัดเทศบาล (งานรักษาความสงบ/เทศกิจ)', 'งานรักษาความสงบฯ'),
  ('โรงเรียนเทศบาล 1 (สมุห์พร้อม)', 'รร.เทศบาล 1'),
  ('โรงเรียนเทศบาล 2 (จิตรประไพชาเล่ต์)', 'รร.เทศบาล 2')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 1. VEHICLE_CARS — ทะเบียนยานพาหนะ
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicle_cars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  license_plate TEXT NOT NULL,
  vehicle_name TEXT NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'other',
  brand TEXT DEFAULT '',
  model TEXT DEFAULT '',
  year INTEGER DEFAULT 2569,
  color TEXT DEFAULT '',
  fuel_type TEXT DEFAULT 'diesel',
  mileage_current INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'retired')),
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  source_department_key TEXT DEFAULT '', -- เก็บรหัสแผนกเดิมเพื่อตรวจสอบย้อนหลัง (เช่น 'secretariat', 'admin')
  insurance_expire DATE,
  tax_expire DATE,
  responsible_officer TEXT DEFAULT '',
  image_url TEXT,
  notes TEXT DEFAULT '',
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL, -- เชื่อมกับครุภัณฑ์ทรัพย์สิน
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. VEHICLE_DRIVERS — พนักงานขับรถ
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicle_drivers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  employee_id TEXT DEFAULT '',
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  source_department_key TEXT DEFAULT '', -- เก็บรหัสแผนกเดิมเพื่อตรวจสอบย้อนหลัง (เช่น 'secretariat', 'admin')
  license_no TEXT DEFAULT '',
  license_type TEXT DEFAULT 'ท.2',
  license_expire DATE,
  phone TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. VEHICLE_TRIPS — บันทึกการขอใช้รถ (แบบ ๔)
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicle_trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_no TEXT NOT NULL DEFAULT '',
  vehicle_id UUID REFERENCES vehicle_cars(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES vehicle_drivers(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL DEFAULT '',
  user_department UUID REFERENCES departments(id) ON DELETE SET NULL, -- แผนกผู้ขอใช้
  source_department_key TEXT DEFAULT '', -- เก็บรหัสแผนกเดิมเพื่อตรวจสอบย้อนหลัง (เช่น 'secretariat', 'admin')
  user_position TEXT DEFAULT '',
  destination TEXT NOT NULL DEFAULT '',
  purpose TEXT DEFAULT '',
  depart_date DATE NOT NULL DEFAULT CURRENT_DATE,
  depart_time TEXT DEFAULT '',
  return_date DATE,
  return_time TEXT,
  mileage_out INTEGER DEFAULT 0,
  mileage_in INTEGER,
  distance_total INTEGER,
  recorder_name TEXT DEFAULT '',
  recorder_position TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'in_use', 'completed', 'cancelled')),
  approved_by TEXT, -- ชื่อผู้อนุมัติ/ปลัด/ผอ.
  approved_at TIMESTAMPTZ,
  passengers_count INTEGER DEFAULT 1,
  addressed_to TEXT DEFAULT 'นายกเทศมนตรีเมืองทับกวาง',
  notes TEXT DEFAULT '',
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- เชื่อมโยงบัญชีผู้ใช้งานระบบ (ถ้ามี)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. VEHICLE_MAINTENANCE_LOGS — บันทึกประวัติซ่อมบำรุงรถ (แบบ ๖)
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicle_maintenance_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicle_cars(id) ON DELETE SET NULL,
  mileage_at_repair INTEGER DEFAULT 0,
  repair_items TEXT NOT NULL DEFAULT '',
  cost DECIMAL(12,2) DEFAULT 0,
  repair_shop TEXT DEFAULT '',
  received_date DATE DEFAULT CURRENT_DATE,
  notes TEXT DEFAULT '',
  repair_id UUID REFERENCES repairs(id) ON DELETE SET NULL, -- ผูกประวัติการซ่อมทรัพย์สิน
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. VEHICLE_INCIDENT_REPORTS — บันทึกการอุบัติเหตุ (แบบ ๕)
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicle_incident_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicle_cars(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES vehicle_drivers(id) ON DELETE SET NULL,
  report_date DATE DEFAULT CURRENT_DATE,
  license_plate_ref TEXT DEFAULT '',
  addressed_to TEXT DEFAULT '',
  incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
  incident_time TEXT DEFAULT '',
  incident_location TEXT DEFAULT '',
  speed_kmh INTEGER,
  route_from TEXT DEFAULT '',
  route_to TEXT DEFAULT '',
  damage_description TEXT DEFAULT '',
  opponent_vehicle TEXT DEFAULT '',
  opponent_plate TEXT DEFAULT '',
  opponent_driver TEXT DEFAULT '',
  opponent_age INTEGER,
  opponent_license_no TEXT DEFAULT '',
  opponent_address TEXT DEFAULT '',
  vehicle_owner TEXT DEFAULT '',
  opponent_cause TEXT DEFAULT '',
  opponent_damage TEXT DEFAULT '',
  injured_persons JSONB DEFAULT '[]',
  investigator_name TEXT DEFAULT '',
  police_station TEXT DEFAULT '',
  witnesses JSONB DEFAULT '[]',
  case_result TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. VEHICLE_FUEL_LOGS — บันทึกน้ำมัน
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicle_fuel_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicle_cars(id) ON DELETE SET NULL,
  trip_id UUID REFERENCES vehicle_trips(id) ON DELETE SET NULL,
  fuel_date DATE DEFAULT CURRENT_DATE,
  fuel_amount DECIMAL(10,2) DEFAULT 0,
  fuel_price_per_liter DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(12,2) DEFAULT 0,
  mileage INTEGER DEFAULT 0,
  fuel_station TEXT DEFAULT '',
  receipt_no TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE vehicle_cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_fuel_logs ENABLE ROW LEVEL SECURITY;

-- 7.1 Policies: vehicle_cars (ดูได้ทุกคนที่ล็อกอิน, เขียน/แก้ไขโดย Admin เท่านั้น)
DROP POLICY IF EXISTS "Anyone logged in can read vehicle_cars" ON vehicle_cars;
DROP POLICY IF EXISTS "Admin can manage vehicle_cars" ON vehicle_cars;
CREATE POLICY "Anyone logged in can read vehicle_cars" ON vehicle_cars FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin can manage vehicle_cars" ON vehicle_cars FOR ALL USING (public.is_admin());

-- 7.2 Policies: vehicle_drivers (ดูได้ทุกคนที่ล็อกอิน, เขียน/แก้ไขโดย Admin เท่านั้น)
DROP POLICY IF EXISTS "Anyone logged in can read vehicle_drivers" ON vehicle_drivers;
DROP POLICY IF EXISTS "Admin can manage vehicle_drivers" ON vehicle_drivers;
CREATE POLICY "Anyone logged in can read vehicle_drivers" ON vehicle_drivers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin can manage vehicle_drivers" ON vehicle_drivers FOR ALL USING (public.is_admin());

-- 7.3 Policies: vehicle_trips (ดูของกองงานตัวเอง หรือเป็น Admin จึงจะจัดการได้ทั้งหมด)
DROP POLICY IF EXISTS "Users can read own department vehicle_trips" ON vehicle_trips;
DROP POLICY IF EXISTS "Users can insert vehicle_trips" ON vehicle_trips;
DROP POLICY IF EXISTS "Users can update own department pending vehicle_trips" ON vehicle_trips;
DROP POLICY IF EXISTS "Admin can manage all vehicle_trips" ON vehicle_trips;

CREATE POLICY "Users can read own department vehicle_trips" ON vehicle_trips FOR SELECT USING (
  user_department IN (SELECT department_id FROM profiles WHERE id = auth.uid())
  OR public.is_admin()
);
CREATE POLICY "Users can insert vehicle_trips" ON vehicle_trips FOR INSERT WITH CHECK (
  user_department IN (SELECT department_id FROM profiles WHERE id = auth.uid())
  OR public.is_admin()
);
CREATE POLICY "Users can update own department pending vehicle_trips" ON vehicle_trips FOR UPDATE USING (
  (user_department IN (SELECT department_id FROM profiles WHERE id = auth.uid()) AND status = 'pending')
  OR public.is_admin()
);
CREATE POLICY "Admin can manage all vehicle_trips" ON vehicle_trips FOR ALL USING (public.is_admin());

-- 7.4 Policies: vehicle_maintenance_logs (ดูได้ตามส่วนราชการของรถยนต์ หรือเป็น Admin)
DROP POLICY IF EXISTS "Users can read own department maintenance_logs" ON vehicle_maintenance_logs;
DROP POLICY IF EXISTS "Admin can manage all maintenance_logs" ON vehicle_maintenance_logs;
CREATE POLICY "Users can read own department maintenance_logs" ON vehicle_maintenance_logs FOR SELECT USING (
  vehicle_id IN (SELECT id FROM vehicle_cars WHERE department_id IN (SELECT department_id FROM profiles WHERE id = auth.uid()))
  OR public.is_admin()
);
CREATE POLICY "Admin can manage all maintenance_logs" ON vehicle_maintenance_logs FOR ALL USING (public.is_admin());

-- 7.5 Policies: vehicle_incident_reports (ดูได้ตามส่วนราชการของรถยนต์ หรือเป็น Admin)
DROP POLICY IF EXISTS "Users can read own department incident_reports" ON vehicle_incident_reports;
DROP POLICY IF EXISTS "Admin can manage all incident_reports" ON vehicle_incident_reports;
CREATE POLICY "Users can read own department incident_reports" ON vehicle_incident_reports FOR SELECT USING (
  vehicle_id IN (SELECT id FROM vehicle_cars WHERE department_id IN (SELECT department_id FROM profiles WHERE id = auth.uid()))
  OR public.is_admin()
);
CREATE POLICY "Admin can manage all incident_reports" ON vehicle_incident_reports FOR ALL USING (public.is_admin());

-- 7.6 Policies: vehicle_fuel_logs (ดูได้ตามส่วนราชการของรถยนต์ หรือเป็น Admin)
DROP POLICY IF EXISTS "Users can read own department fuel_logs" ON vehicle_fuel_logs;
DROP POLICY IF EXISTS "Admin can manage all fuel_logs" ON vehicle_fuel_logs;
CREATE POLICY "Users can read own department fuel_logs" ON vehicle_fuel_logs FOR SELECT USING (
  vehicle_id IN (SELECT id FROM vehicle_cars WHERE department_id IN (SELECT department_id FROM profiles WHERE id = auth.uid()))
  OR public.is_admin()
);
CREATE POLICY "Admin can manage all fuel_logs" ON vehicle_fuel_logs FOR ALL USING (public.is_admin());

-- ============================================================
-- 8. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_vehicle_cars_status ON vehicle_cars(status);
CREATE INDEX IF NOT EXISTS idx_vehicle_cars_department ON vehicle_cars(department_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_trips_vehicle ON vehicle_trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_trips_date ON vehicle_trips(depart_date);
CREATE INDEX IF NOT EXISTS idx_vehicle_trips_status ON vehicle_trips(status);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_vehicle ON vehicle_maintenance_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_fuel_vehicle ON vehicle_fuel_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_incidents_vehicle ON vehicle_incident_reports(vehicle_id);

-- ============================================================
-- 9. TRIGGERS & FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION update_vehicle_cars_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_vehicle_cars_updated_at ON vehicle_cars;
CREATE TRIGGER trg_vehicle_cars_updated_at
  BEFORE UPDATE ON vehicle_cars
  FOR EACH ROW EXECUTE FUNCTION update_vehicle_cars_updated_at();

-- ============================================================
-- 10. STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('vehicle-photos', 'vehicle-photos', true),
  ('vehicle-documents', 'vehicle-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage buckets
DROP POLICY IF EXISTS "Public read vehicle photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload vehicle photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete vehicle photos" ON storage.objects;
CREATE POLICY "Public read vehicle photos" ON storage.objects FOR SELECT USING (bucket_id = 'vehicle-photos');
CREATE POLICY "Authenticated upload vehicle photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'vehicle-photos' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated delete vehicle photos" ON storage.objects FOR DELETE USING (bucket_id = 'vehicle-photos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated read vehicle documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload vehicle documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete vehicle documents" ON storage.objects;
CREATE POLICY "Authenticated read vehicle documents" ON storage.objects FOR SELECT USING (bucket_id = 'vehicle-documents' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated upload vehicle documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'vehicle-documents' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated delete vehicle documents" ON storage.objects FOR DELETE USING (bucket_id = 'vehicle-documents' AND auth.role() = 'authenticated');
