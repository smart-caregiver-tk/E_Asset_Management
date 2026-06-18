// database query helper service for E-Asset Management - Smart Vehicle Component
import { supabase } from './supabase';
import { Vehicle, Driver, TripLog, MaintenanceLog, IncidentReport, FuelLog } from '@/types/vehicle_types';
import { generateTripNo } from './vehicleUtils';

// ==================== VEHICLES ====================
export async function getVehicles(departmentId?: string | null): Promise<Vehicle[]> {
  let query = supabase.from('vehicle_cars').select('*').order('created_at', { ascending: false });
  if (departmentId) {
    query = query.eq('department_id', departmentId);
  }
  const { data, error } = await query;
  if (error) {
    console.error('getVehicles error:', error);
    return [];
  }
  return data || [];
}

export async function getVehicle(id: string): Promise<Vehicle | null> {
  const { data, error } = await supabase
    .from('vehicle_cars')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    console.error('getVehicle error:', error);
    return null;
  }
  return data;
}

export async function addVehicle(vehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>): Promise<Vehicle | null> {
  const sanitized = {
    ...vehicle,
    insurance_expire: vehicle.insurance_expire || null,
    tax_expire: vehicle.tax_expire || null,
    image_url: vehicle.image_url || null,
  };
  const { data, error } = await supabase
    .from('vehicle_cars')
    .insert([sanitized])
    .select()
    .single();
  if (error) {
    console.error('addVehicle error:', error);
    return null;
  }
  return data;
}

export async function updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle | null> {
  const sanitized = { ...updates };
  if ('insurance_expire' in sanitized) sanitized.insurance_expire = sanitized.insurance_expire || null;
  if ('tax_expire' in sanitized) sanitized.tax_expire = sanitized.tax_expire || null;
  if ('image_url' in sanitized) sanitized.image_url = sanitized.image_url || null;

  const { data, error } = await supabase
    .from('vehicle_cars')
    .update({ ...sanitized, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) {
    console.error('updateVehicle error:', error);
    return null;
  }
  return data;
}

export interface VehicleDependencies {
  trips: number;
  maintenance: number;
  incidents: number;
  fuel: number;
  total: number;
}

export async function checkVehicleDependencies(vehicleId: string): Promise<VehicleDependencies> {
  const [tripsRes, maintenanceRes, incidentsRes, fuelRes] = await Promise.all([
    supabase.from('vehicle_trips').select('id', { count: 'exact', head: true }).eq('vehicle_id', vehicleId),
    supabase.from('vehicle_maintenance_logs').select('id', { count: 'exact', head: true }).eq('vehicle_id', vehicleId),
    supabase.from('vehicle_incident_reports').select('id', { count: 'exact', head: true }).eq('vehicle_id', vehicleId),
    supabase.from('vehicle_fuel_logs').select('id', { count: 'exact', head: true }).eq('vehicle_id', vehicleId),
  ]);

  const trips = tripsRes.count ?? 0;
  const maintenance = maintenanceRes.count ?? 0;
  const incidents = incidentsRes.count ?? 0;
  const fuel = fuelRes.count ?? 0;

  return {
    trips,
    maintenance,
    incidents,
    fuel,
    total: trips + maintenance + incidents + fuel,
  };
}

export async function deleteVehicle(id: string): Promise<boolean> {
  const { error } = await supabase.from('vehicle_cars').delete().eq('id', id);
  if (error) {
    console.error('deleteVehicle error:', error);
    return false;
  }
  return true;
}

// ==================== DRIVERS ====================
export async function getDrivers(departmentId?: string | null): Promise<Driver[]> {
  let query = supabase.from('vehicle_drivers').select('*').order('created_at', { ascending: false });
  if (departmentId) {
    query = query.eq('department_id', departmentId);
  }
  const { data, error } = await query;
  if (error) {
    console.error('getDrivers error:', error);
    return [];
  }
  return data || [];
}

export async function addDriver(driver: Omit<Driver, 'id' | 'created_at'>): Promise<Driver | null> {
  const sanitized = {
    ...driver,
    license_expire: driver.license_expire || null,
  };
  const { data, error } = await supabase
    .from('vehicle_drivers')
    .insert([sanitized])
    .select()
    .single();
  if (error) {
    console.error('addDriver error:', error);
    return null;
  }
  return data;
}

export async function updateDriver(id: string, updates: Partial<Driver>): Promise<Driver | null> {
  const sanitized = { ...updates };
  if ('license_expire' in sanitized) sanitized.license_expire = sanitized.license_expire || null;

  const { data, error } = await supabase
    .from('vehicle_drivers')
    .update(sanitized)
    .eq('id', id)
    .select()
    .single();
  if (error) {
    console.error('updateDriver error:', error);
    return null;
  }
  return data;
}

export interface DriverDependencies {
  trips: number;
  maintenance: number;
  incidents: number;
  fuel: number;
  total: number;
}

export async function checkDriverDependencies(driverId: string): Promise<DriverDependencies> {
  const [tripsRes, maintenanceRes, incidentsRes, fuelRes] = await Promise.all([
    supabase.from('vehicle_trips').select('id', { count: 'exact', head: true }).eq('driver_id', driverId),
    supabase.from('vehicle_maintenance_logs').select('id', { count: 'exact', head: true }).eq('driver_id', driverId),
    supabase.from('vehicle_incident_reports').select('id', { count: 'exact', head: true }).eq('driver_id', driverId),
    supabase.from('vehicle_fuel_logs').select('id', { count: 'exact', head: true }).eq('driver_id', driverId),
  ]);

  const trips = tripsRes.count ?? 0;
  const maintenance = maintenanceRes.count ?? 0;
  const incidents = incidentsRes.count ?? 0;
  const fuel = fuelRes.count ?? 0;

  return {
    trips,
    maintenance,
    incidents,
    fuel,
    total: trips + maintenance + incidents + fuel,
  };
}

export async function deleteDriver(id: string): Promise<boolean> {
  const { error } = await supabase.from('vehicle_drivers').delete().eq('id', id);
  if (error) {
    console.error('deleteDriver error:', error);
    return false;
  }
  return true;
}

// ==================== TRIP LOGS ====================
export async function getTripLogs(departmentId?: string | null): Promise<TripLog[]> {
  let query = supabase
    .from('vehicle_trips')
    .select('*, vehicle_cars(*), vehicle_drivers(*)')
    .order('created_at', { ascending: false });
  if (departmentId) {
    query = query.eq('user_department', departmentId);
  }
  const { data, error } = await query;
  if (error) {
    console.error('getTripLogs error:', error);
    return [];
  }
  return (data || []) as unknown as TripLog[];
}

export async function getTripLogsByVehicle(vehicleId: string): Promise<TripLog[]> {
  const { data, error } = await supabase
    .from('vehicle_trips')
    .select('*, vehicle_cars(*), vehicle_drivers(*)')
    .eq('vehicle_id', vehicleId)
    .order('depart_date', { ascending: true });
  if (error) {
    console.error('getTripLogsByVehicle error:', error);
    return [];
  }
  return (data || []) as unknown as TripLog[];
}

export async function addTripLog(trip: Omit<TripLog, 'id' | 'trip_no' | 'created_at'>): Promise<TripLog | null> {
  const sanitized = {
    ...trip,
    return_date: trip.return_date || null,
    return_time: trip.return_time || null,
    mileage_in: trip.mileage_in || null,
    distance_total: trip.distance_total || null,
    approved_at: trip.approved_at || null,
    passengers_count: trip.passengers_count !== undefined ? trip.passengers_count : 1,
    addressed_to: trip.addressed_to || 'นายกเทศมนตรีเมืองทับกวาง',
  };
  const { data, error } = await supabase
    .from('vehicle_trips')
    .insert([{ ...sanitized, trip_no: generateTripNo() }])
    .select()
    .single();
  if (error) {
    console.error('addTripLog error:', error);
    return null;
  }
  return data;
}

export async function updateTripLog(id: string, updates: Partial<TripLog>): Promise<TripLog | null> {
  const sanitized = { ...updates };
  if ('return_date' in sanitized) sanitized.return_date = sanitized.return_date || null;
  if ('return_time' in sanitized) sanitized.return_time = sanitized.return_time || null;
  if ('mileage_in' in sanitized) sanitized.mileage_in = sanitized.mileage_in || null;
  if ('distance_total' in sanitized) sanitized.distance_total = sanitized.distance_total || null;
  if ('approved_at' in sanitized) sanitized.approved_at = sanitized.approved_at || null;
  if ('passengers_count' in sanitized) sanitized.passengers_count = sanitized.passengers_count !== undefined ? sanitized.passengers_count : 1;
  if ('addressed_to' in sanitized) sanitized.addressed_to = sanitized.addressed_to || 'นายกเทศมนตรีเมืองทับกวาง';

  const { data, error } = await supabase
    .from('vehicle_trips')
    .update(sanitized)
    .eq('id', id)
    .select()
    .single();
  if (error) {
    console.error('updateTripLog error:', error);
    return null;
  }
  return data;
}

export async function deleteTripLog(id: string): Promise<boolean> {
  const { error } = await supabase.from('vehicle_trips').delete().eq('id', id);
  if (error) {
    console.error('deleteTripLog error:', error);
    return false;
  }
  return true;
}

// ==================== MAINTENANCE LOGS ====================
export async function getMaintenanceLogs(departmentId?: string | null): Promise<MaintenanceLog[]> {
  // We first fetch vehicle_cars for this department to filter maintenance logs
  // Or if it is admin, we fetch all.
  let query = supabase
    .from('vehicle_maintenance_logs')
    .select('*, vehicle_cars(*)');

  if (departmentId) {
    // We join vehicle_cars and filter on department_id
    // Wait, in Supabase RLS, the user can only read their department maintenance logs anyway.
    // We can also fetch the logs and filter by joining vehicle_cars.department_id, or do it on the query
    // Wait, since vehicle_maintenance_logs does not have a department_id column directly (or does it?),
    // Let's check: Yes! `vehicle_maintenance_logs` table has a primary key `id`, `vehicle_id`.
    // So to filter by department, we can use inner join syntax:
    // `vehicle_cars!inner(*)` which forces an inner join on vehicle_cars and allows filtering!
    query = query.filter('vehicle_cars.department_id', 'eq', departmentId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) {
    console.error('getMaintenanceLogs error:', error);
    return [];
  }
  return (data || []) as unknown as MaintenanceLog[];
}

export async function addMaintenanceLog(log: Omit<MaintenanceLog, 'id' | 'created_at'>): Promise<MaintenanceLog | null> {
  const sanitized = {
    ...log,
    received_date: log.received_date || null,
  };
  const { data, error } = await supabase
    .from('vehicle_maintenance_logs')
    .insert([sanitized])
    .select()
    .single();
  if (error) {
    console.error('addMaintenanceLog error:', error);
    return null;
  }
  return data;
}

export async function updateMaintenanceLog(id: string, updates: Partial<MaintenanceLog>): Promise<MaintenanceLog | null> {
  const sanitized = { ...updates };
  if ('received_date' in sanitized) sanitized.received_date = sanitized.received_date || null;

  const { data, error } = await supabase
    .from('vehicle_maintenance_logs')
    .update(sanitized)
    .eq('id', id)
    .select()
    .single();
  if (error) {
    console.error('updateMaintenanceLog error:', error);
    return null;
  }
  return data;
}

export async function deleteMaintenanceLog(id: string): Promise<boolean> {
  const { error } = await supabase.from('vehicle_maintenance_logs').delete().eq('id', id);
  if (error) {
    console.error('deleteMaintenanceLog error:', error);
    return false;
  }
  return true;
}

// ==================== INCIDENT REPORTS ====================
export async function getIncidentReports(departmentId?: string | null): Promise<IncidentReport[]> {
  let query = supabase
    .from('vehicle_incident_reports')
    .select('*, vehicle_cars(*), vehicle_drivers(*)');

  if (departmentId) {
    query = query.filter('vehicle_cars.department_id', 'eq', departmentId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) {
    console.error('getIncidentReports error:', error);
    return [];
  }
  return (data || []) as unknown as IncidentReport[];
}

export async function addIncidentReport(report: Omit<IncidentReport, 'id' | 'created_at'>): Promise<IncidentReport | null> {
  const sanitized = {
    ...report,
    report_date: report.report_date || null,
    incident_date: report.incident_date || null,
    speed_kmh: report.speed_kmh || null,
    opponent_age: report.opponent_age || null,
  };
  const { data, error } = await supabase
    .from('vehicle_incident_reports')
    .insert([sanitized])
    .select()
    .single();
  if (error) {
    console.error('addIncidentReport error:', error);
    return null;
  }
  return data;
}

export async function deleteIncidentReport(id: string): Promise<boolean> {
  const { error } = await supabase.from('vehicle_incident_reports').delete().eq('id', id);
  if (error) {
    console.error('deleteIncidentReport error:', error);
    return false;
  }
  return true;
}

// ==================== FUEL LOGS ====================
export async function getFuelLogs(departmentId?: string | null): Promise<FuelLog[]> {
  let query = supabase
    .from('vehicle_fuel_logs')
    .select('*, vehicle_cars(*)');

  if (departmentId) {
    query = query.filter('vehicle_cars.department_id', 'eq', departmentId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) {
    console.error('getFuelLogs error:', error);
    return [];
  }
  return (data || []) as unknown as FuelLog[];
}

export async function addFuelLog(log: Omit<FuelLog, 'id' | 'created_at'>): Promise<FuelLog | null> {
  const { data, error } = await supabase
    .from('vehicle_fuel_logs')
    .insert([log])
    .select()
    .single();
  if (error) {
    console.error('addFuelLog error:', error);
    return null;
  }
  return data;
}

export async function deleteFuelLog(id: string): Promise<boolean> {
  const { error } = await supabase.from('vehicle_fuel_logs').delete().eq('id', id);
  if (error) {
    console.error('deleteFuelLog error:', error);
    return false;
  }
  return true;
}
