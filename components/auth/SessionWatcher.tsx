'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Listens to Supabase auth state changes in the browser.
 * When the refresh token is invalid/expired, Supabase emits SIGNED_OUT
 * instead of throwing — this catches that and redirects to login cleanly,
 * preventing the AuthApiError from surfacing in the console.
 */
export function SessionWatcher() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/auth/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return null;
}
