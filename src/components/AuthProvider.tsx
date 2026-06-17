'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { ProfileWithDepartment, Department } from '@/types/database';
import { useToast } from './Toast';

interface AuthContextType {
  user: any;
  profile: ProfileWithDepartment | null;
  departments: Department[];
  loading: boolean;
  selectedDeptId: string | null; // For admin to switch view
  setSelectedDeptId: (id: string | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<ProfileWithDepartment | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();

  useEffect(() => {
    // Fetch departments
    async function loadDepartments() {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      if (!error && data) {
        setDepartments(data);
      }
    }
    loadDepartments();
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Get current session on first load
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (session) {
        setUser(session.user);
        const { data: prof, error } = await supabase
          .from('profiles')
          .select('*, departments(*)')
          .eq('id', session.user.id)
          .single();

        if (!isMounted) return;

        if (!error && prof) {
          const profileWithDept = prof as ProfileWithDepartment;
          setProfile(profileWithDept);
          if (profileWithDept.role === 'department') {
            setSelectedDeptId(profileWithDept.department_id);
          } else {
            setSelectedDeptId(null);
          }
        }
      } else {
        // ไม่มี session จริงๆ → redirect ไป login
        setUser(null);
        setProfile(null);
        router.replace('/login');
      }
      if (isMounted) setLoading(false);
    }

    getSession();

    // Listen for auth state changes (login/logout/token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // ไม่ต้อง loading ทุก event — เฉพาะกรณีที่ session หายจริงๆ
      if (event === 'TOKEN_REFRESHED') return; // token refresh ปกติ ไม่ต้องทำอะไร

      if (session) {
        setUser(session.user);
        const { data: prof } = await supabase
          .from('profiles')
          .select('*, departments(*)')
          .eq('id', session.user.id)
          .single();

        if (prof) {
          const profileWithDept = prof as ProfileWithDepartment;
          setProfile(profileWithDept);
          if (profileWithDept.role === 'department') {
            setSelectedDeptId(profileWithDept.department_id);
          }
        }
        if (pathname === '/login') {
          router.replace('/dashboard');
        }
      } else if (event === 'SIGNED_OUT') {
        // Logout จริงๆ เท่านั้นที่ redirect
        setUser(null);
        setProfile(null);
        setSelectedDeptId(null);
        router.replace('/login');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← รันครั้งเดียวตอน mount เท่านั้น ไม่ re-run เมื่อ pathname เปลี่ยน


  const logout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      showToast('เกิดข้อผิดพลาดในการออกจากระบบ: ' + error.message, 'error');
    } else {
      showToast('ออกจากระบบสำเร็จ');
      router.replace('/login');
    }
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, profile, departments, loading, selectedDeptId, setSelectedDeptId, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
