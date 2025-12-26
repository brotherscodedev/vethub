import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserRole = 'super_admin' | 'admin' | 'veterinarian' | 'receptionist' | 'tutor';

export interface UserProfile {
  id: string;
  full_name: string | null;
  cpf: string | null;
  professional_register: string | null;
  avatar_url: string | null;
  is_super_admin: boolean;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  clinics: Array<{ clinic_id: string; clinic_name: string; role: UserRole }>;
  currentClinicId: string | null;
  loading: boolean;
  isAuthenticating: boolean;
  signUp: (email: string, password: string, clinicData: any, profileData: any) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setCurrentClinic: (clinicId: string) => void;
}

// CORREÇÃO: Exportação essencial para os testes
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [clinics, setClinics] = useState<Array<{ clinic_id: string; clinic_name: string; role: UserRole }>>([]);
  const [currentClinicId, setCurrentClinicId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          setProfile(profileData);

          const { data: clinicUsersData } = await supabase
            .from('clinic_users')
            .select('clinic_id, role')
            .eq('user_id', session.user.id)
            .eq('is_active', true);

          if (clinicUsersData && clinicUsersData.length > 0) {
            const { data: clinicsData } = await supabase
              .from('clinics')
              .select('id, name')
              .in('id', clinicUsersData.map((cu) => cu.clinic_id));

            const enrichedClinics = clinicUsersData.map((cu) => ({
              clinic_id: cu.clinic_id,
              clinic_name: clinicsData?.find((c) => c.id === cu.clinic_id)?.name || 'Unknown',
              role: cu.role,
            }));

            setClinics(enrichedClinics);
            if (enrichedClinics.length > 0) {
              setCurrentClinicId(enrichedClinics[0].clinic_id);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        setProfile(null);
        setClinics([]);
        setCurrentClinicId(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, clinicData: any, profileData: any) => {
    setIsAuthenticating(true);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/signup`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email, password, clinicData, profileData }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar conta');
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsAuthenticating(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signOut = async () => {
    setIsAuthenticating(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setClinics([]);
      setCurrentClinicId(null);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    clinics,
    currentClinicId,
    loading,
    isAuthenticating,
    signUp,
    signIn,
    signOut,
    setCurrentClinic: setCurrentClinicId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}