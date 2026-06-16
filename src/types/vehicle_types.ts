// TypeScript Types for E-Asset Management - Smart Vehicle Component

export interface Vehicle {
  id: string;
  license_plate: string;
  vehicle_name: string;
  vehicle_type: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  fuel_type: string;
  mileage_current: number;
  status: 'available' | 'in_use' | 'maintenance' | 'retired';
  department_id: string | null;
  source_department_key: string;
  insurance_expire: string | null;
  tax_expire: string | null;
  responsible_officer: string;
  image_url: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: string;
  name: string;
  employee_id: string;
  department_id: string | null;
  source_department_key: string;
  license_no: string;
  license_type: string;
  license_expire: string | null;
  phone: string;
  status: 'active' | 'inactive';
  notes: string;
  created_at: string;
}

export interface TripLog {
  id: string;
  trip_no: string;
  vehicle_id: string;
  driver_id: string;
  user_name: string;
  user_department: string | null; // UUID from public.departments
  source_department_key: string;  // Legacy key
  user_position: string;
  destination: string;
  purpose: string;
  depart_date: string;
  depart_time: string;
  return_date: string | null;
  return_time: string | null;
  mileage_out: number;
  mileage_in: number | null;
  distance_total: number | null;
  recorder_name: string;
  recorder_position: string;
  status: 'pending' | 'approved' | 'in_use' | 'completed' | 'cancelled';
  approved_by: string | null;
  approved_at: string | null;
  passengers_count: number;
  addressed_to: string;
  notes: string;
  created_at: string;
  // Joined fields
  vehicle_cars?: Vehicle;
  vehicle_drivers?: Driver;
}

export interface MaintenanceLog {
  id: string;
  vehicle_id: string;
  mileage_at_repair: number;
  repair_items: string;
  cost: number;
  repair_shop: string;
  received_date: string | null;
  notes: string;
  created_at: string;
  vehicle_cars?: Vehicle;
}

export interface InjuredPerson {
  name: string;
  age: number | null;
  address: string;
}

export interface Witness {
  name: string;
  age: number | null;
  address: string;
}

export interface IncidentReport {
  id: string;
  vehicle_id: string;
  driver_id: string;
  report_date: string | null;
  license_plate_ref: string;
  addressed_to: string;
  incident_date: string | null;
  incident_time: string;
  incident_location: string;
  speed_kmh: number | null;
  route_from: string;
  route_to: string;
  damage_description: string;
  // opponent info
  opponent_vehicle: string;
  opponent_plate: string;
  opponent_driver: string;
  opponent_age: number | null;
  opponent_license_no: string;
  opponent_address: string;
  vehicle_owner: string;
  opponent_cause: string;
  opponent_damage: string;
  // arrays stored as JSON in DB
  injured_persons: InjuredPerson[];
  witnesses: Witness[];
  investigator_name: string;
  police_station: string;
  case_result: string;
  notes: string;
  created_at: string;
  vehicle_cars?: Vehicle;
  vehicle_drivers?: Driver;
}

export interface FuelLog {
  id: string;
  vehicle_id: string;
  trip_id: string | null;
  fuel_date: string;
  fuel_amount: number;
  fuel_price_per_liter: number;
  total_cost: number;
  mileage: number;
  fuel_station: string;
  receipt_no: string;
  notes: string;
  created_at: string;
  vehicle_cars?: Vehicle;
}

export interface DashboardStats {
  totalVehicles: number;
  availableVehicles: number;
  inUseVehicles: number;
  maintenanceVehicles: number;
  todayTrips: number;
  monthlyTrips: number;
  monthlyFuelCost: number;
  monthlyMaintenanceCost: number;
}
