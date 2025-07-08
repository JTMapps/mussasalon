import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function useSessionUser() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const sessionUser = sessionData?.session?.user;

      if (!sessionUser || sessionError) {
        setUser(null);
        setRole('');
        setLoading(false);
        return;
      }

      setUser(sessionUser);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', sessionUser.id)
        .single();

      if (!profileError && profile) {
        setRole(profile.role);
      }

      setLoading(false);
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
        setRole('');
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return { user, role, loading };
}
