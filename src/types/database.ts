import { Vehicle, Driver, TripLog, MaintenanceLog, IncidentReport, FuelLog } from './vehicle_types';

export interface Database {
  public: {
    Tables: {
      departments: {
        Row: Department;
        Insert: Omit<Department, 'id' | 'created_at'>;
        Update: Partial<Omit<Department, 'id' | 'created_at'>>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, 'id' | 'created_at'>;
        Update: Partial<Omit<Category, 'id' | 'created_at'>>;
      };
      assets: {
        Row: Asset;
        Insert: Omit<Asset, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Asset, 'id' | 'created_at'>>;
      };
      repairs: {
        Row: Repair;
        Insert: Omit<Repair, 'id' | 'created_at'>;
        Update: Partial<Omit<Repair, 'id' | 'created_at'>>;
      };
      activity_logs: {
        Row: ActivityLog;
        Insert: Omit<ActivityLog, 'id' | 'created_at'>;
        Update: never;
      };
      vehicle_cars: {
        Row: Vehicle;
        Insert: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Vehicle, 'id' | 'created_at'>>;
      };
      vehicle_drivers: {
        Row: Driver;
        Insert: Omit<Driver, 'id' | 'created_at'>;
        Update: Partial<Omit<Driver, 'id' | 'created_at'>>;
      };
      vehicle_trips: {
        Row: TripLog;
        Insert: Omit<TripLog, 'id' | 'trip_no' | 'created_at'>;
        Update: Partial<Omit<TripLog, 'id' | 'created_at'>>;
      };
      vehicle_maintenance_logs: {
        Row: MaintenanceLog;
        Insert: Omit<MaintenanceLog, 'id' | 'created_at'>;
        Update: Partial<Omit<MaintenanceLog, 'id' | 'created_at'>>;
      };
      vehicle_incident_reports: {
        Row: IncidentReport;
        Insert: Omit<IncidentReport, 'id' | 'created_at'>;
        Update: Partial<Omit<IncidentReport, 'id' | 'created_at'>>;
      };
      vehicle_fuel_logs: {
        Row: FuelLog;
        Insert: Omit<FuelLog, 'id' | 'created_at'>;
        Update: Partial<Omit<FuelLog, 'id' | 'created_at'>>;
      };
    };
  };
}

export interface Department {
  id: string;
  name: string;
  short_name: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'department';
  department_id: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  code: string;
  name: string;
  description: string | null;
  department_id: string;
  created_at: string;
}

export interface Asset {
  id: string;
  code: string;
  name: string;
  asset_type: string | null;
  manufacturer: string | null;
  model: string | null;
  serial_no: string | null;
  engine_no: string | null;
  frame_no: string | null;
  plate_no: string | null;
  special_feature: string | null;
  acquisition_date: string | null;
  acquisition_method: string | null;
  category_id: string | null;
  location: string | null;
  quantity: number;
  unit: string | null;
  unit_price: number;
  total_value: number;
  warranty_months: number | null;
  warranty_end_date: string | null;
  warranty_company: string | null;
  depreciation_y1: string | null;
  depreciation_y2: string | null;
  depreciation_y3: string | null;
  depreciation_y4: string | null;
  depreciation_y5: string | null;
  disposal_value: number | null;
  profit_loss: number | null;
  status: string;
  borrower: string | null;
  borrow_date: string | null;
  return_date: string | null;
  dispose_date: string | null;
  photo_urls: string[] | null;
  remark: string | null;
  department_id: string;
  created_at: string;
  updated_at: string;
}

export interface Repair {
  id: string;
  asset_id: string;
  sequence: number;
  doc_no: string | null;
  doc_date: string | null;
  detail: string;
  amount: number;
  contractor: string | null;
  remark: string | null;
  department_id: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  detail: string | null;
  user_id: string | null;
  department_id: string | null;
  created_at: string;
}

// Extended types with joined data
export interface AssetWithCategory extends Asset {
  categories?: Category;
  repairs?: Repair[];
}

export interface ProfileWithDepartment extends Profile {
  departments?: Department;
}
