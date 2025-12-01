"use client";

import { useEffect, useState, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createClient, signIn as signInHelper, signOut as signOutHelper } from "@/lib/supabase/client";

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    const { error } = await signInHelper(email, password);

    if (!error) {
      router.push("/dashboard");
      router.refresh();
    }

    setLoading(false);
    return { error };
  }, [router]);

  const signOut = useCallback(async () => {
    setLoading(true);
    await signOutHelper();
    router.push("/login");
    router.refresh();
    setLoading(false);
  }, [router]);

  return { user, loading, signIn, signOut };
}
