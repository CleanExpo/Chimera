import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Helper functions for common auth operations
export async function signIn(email: string, password: string) {
  const supabase = createClient();
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string) {
  const supabase = createClient();
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/api/auth/callback`,
    },
  });
}

export async function signOut() {
  const supabase = createClient();
  return await supabase.auth.signOut();
}

export async function resetPassword(email: string) {
  const supabase = createClient();
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
  });
}

export async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}
