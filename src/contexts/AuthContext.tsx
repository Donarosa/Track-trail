'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import type { User } from '@/types/database';

interface AuthContextType {
  session: Session | null;
  authUser: SupabaseUser | null;
  profile: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  authUser: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('[Auth] Error fetching profile:', error.message);
    }
    setProfile(data);
  };

  const refreshProfile = async () => {
    if (authUser) {
      await fetchProfile(authUser.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (!mounted) return;

        if (error || !user) {
          setLoading(false);
          return;
        }

        setAuthUser(user);

        await fetchProfile(user.id);
      } catch {
        // Silent catch — auth init failed
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    // Listen for future auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        setSession(session);
        setAuthUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setAuthUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session, authUser, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
