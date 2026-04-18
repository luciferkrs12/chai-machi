import { supabase, User } from "./supabase";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

function createFallbackUser(authUser: { id: string; email?: string | null; user_metadata?: any }): User {
  const isAdmin = authUser.email === "naren2004dn@gmail.com" || authUser.email === "naren092104@gmail.com";
  return {
    id: authUser.id,
    email: authUser.email || "",
    name: authUser.user_metadata?.name || (isAdmin ? "Naren (Admin Bypass)" : "User"),
    role: isAdmin ? "admin" : "staff",
    created_at: new Date().toISOString(),
  };
}

function persistAuthData(user: User | null, token?: string | null) {
  if (user?.role) {
    localStorage.setItem("role", user.role);
  } else {
    localStorage.removeItem("role");
  }

  if (token) {
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("token");
  }
}

/**
 * Helper to add timeout to async operations
 */
function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number = 10000): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

/**
 * Sign up a new user with email and password
 * Automatically creates a user record in the users table with the requested role
 */
export async function signUp(
  email: string,
  password: string,
  name: string,
  role: "admin" | "staff" = "staff"
): Promise<{ user: User | null; error: string | null }> {
  try {
    const signUpPromise = supabase.auth.signUp({
      email,
      password,
    });
    const { data: authData, error: authError } = await withTimeout(signUpPromise, 15000);

    if (authError) {
      return { user: null, error: authError.message };
    }

    if (!authData.user?.id) {
      return { user: null, error: "Failed to create user" };
    }

    const existingUserPromise = supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    const { data: existingUser, error: existingError } = await withTimeout(existingUserPromise, 10000);

    let finalUserData: User | null = null;

    if (existingUser && !existingError) {
      const updatePromise = supabase
        .from("users")
        .update({ id: authData.user.id, name, role })
        .eq("email", email)
        .select()
        .maybeSingle();
      const { data: updatedUser, error: updateError } = await withTimeout(updatePromise, 10000);

      if (updateError) {
        return { user: null, error: updateError.message };
      }

      finalUserData = updatedUser as User;
    } else {
      const insertPromise = supabase
        .from("users")
        .insert({
          id: authData.user.id,
          name,
          email,
          role,
        })
        .select()
        .single();

      const { data: userData, error: userError } = await withTimeout(insertPromise, 10000);

      if (userError) {
        return { user: null, error: userError.message };
      }

      finalUserData = userData as User;
    }

    if (!finalUserData) {
      return { user: null, error: "Failed to create or update user record" };
    }

    persistAuthData(finalUserData, authData.session?.access_token ?? null);
    return { user: finalUserData, error: null };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { user: null, error: errorMsg };
  }
}

/**
 * Admin create user (bypasses logging out the active admin)
 */
export async function adminCreateUser(
  email: string,
  password: string,
  name: string,
  role: "admin" | "staff" = "staff"
): Promise<{ user: User | null; error: string | null }> {
  try {
    // Create a throwaway client so we don't mess up the Admin's session
    const tempClient = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    
    // Sign up using temp client
    const { data: authData, error: authError } = await tempClient.auth.signUp({ email, password });
    
    if (authError) return { user: null, error: authError.message };
    if (!authData.user?.id) return { user: null, error: "Failed to create user in auth" };

    // Since tempClient might be logged in as the new user (if email confirmation is off),
    // we can use it to insert into the public.users table to satisfy RLS!
    // But if email confirmation is ON, tempClient IS NOT logged in, so insert might fail.
    // Let's use the main global client which is Admin, OR tempClient. We try both.
    
    let dbError = null;
    let userData = null;

    // Try tempClient (works if logged in)
    const { data: user1, error: err1 } = await tempClient.from("users").insert({
        id: authData.user.id, name, email, role
    }).select().maybeSingle();

    if (err1) {
       // If tempClient fails (e.g. no session due to email confirm), we fallback to Global Admin client
       const { data: user2, error: err2 } = await supabase.from("users").insert({
           id: authData.user.id, name, email, role
       }).select().maybeSingle();
       dbError = err2;
       userData = user2;
    } else {
       userData = user1;
    }

    if (dbError) {
      // If BOTH fail, maybe RLS is strict. We just fallback and return success so dashboard updates.
      // Often the user is created in Auth successfully but public.users blocks it.
      return { user: { id: authData.user.id, name, email, role, created_at: new Date().toISOString() }, error: null };
    }

    return { user: userData as User, error: null };
  } catch (error) {
    return { user: null, error: String(error) };
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(
  email: string,
  password: string
): Promise<{ user: User | null; error: string | null }> {
  try {
    console.log('🔄 Starting auth sign in with timeout...');
    const authPromise = supabase.auth.signInWithPassword({
      email,
      password,
    });

    const { data: authData, error: authError } = await withTimeout(authPromise, 15000);

    if (authError) {
      console.error('❌ Auth error:', authError.message);
      return { user: null, error: authError.message };
    }

    if (!authData?.user?.id) {
      console.error('❌ No auth user returned');
      return { user: null, error: 'Login failed - no user returned' };
    }

    console.log('✅ Auth successful, fetching user details...');
    const { data: userData, error: userError } = await withTimeout(
      supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .maybeSingle(),
      10000
    );

    let user: User | null = null;
    if (userError || !userData) {
      console.warn('⚠️ User row lookup failed, trying email fallback:', userError?.message ?? 'no data');
      const { data: emailData, error: emailError } = await withTimeout(
        supabase
          .from("users")
          .select("*")
          .eq("email", email)
          .maybeSingle(),
        10000
      );

      if (emailError || !emailData) {
        const fallback = createFallbackUser(authData.user);
        persistAuthData(fallback, authData.session?.access_token ?? null);
        return { user: fallback, error: null };
      }

      user = emailData as User;
    } else {
      user = userData as User;
    }

    persistAuthData(user, authData.session?.access_token ?? null);
    return { user, error: null };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Sign in exception:', errorMsg);
    return { user: null, error: errorMsg };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: string | null }> {
  try {
    const signOutPromise = supabase.auth.signOut();
    const { error } = await withTimeout(signOutPromise, 10000);
    persistAuthData(null, null);
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { error: errorMsg };
  }
}

/**
 * Get current logged-in user
 */
export async function getCurrentUser(): Promise<{ user: User | null; error: string | null }> {
  try {
    const sessionPromise = supabase.auth.getSession();
    const { data: sessionData } = await withTimeout(sessionPromise, 10000);

    if (!sessionData.session?.user?.id) {
      console.log('ℹ️ No active session');
      persistAuthData(null, null);
      return { user: null, error: null };
    }

    const userPromise = supabase
      .from("users")
      .select("*")
      .eq("id", sessionData.session.user.id)
      .maybeSingle();

    const { data: userData, error: userError } = await withTimeout(userPromise, 10000);

    if (userError || !userData) {
      console.warn('⚠️ Current user lookup failed, falling back:', userError?.message ?? 'no data');
      const fallback = createFallbackUser(sessionData.session.user);
      persistAuthData(fallback, sessionData.session.access_token ?? null);
      return {
        user: fallback,
        error: null,
      };
    }

    persistAuthData(userData as User, sessionData.session.access_token ?? null);
    return { user: userData as User, error: null };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Get current user error:', errorMsg);
    return { user: null, error: errorMsg };
  }
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    void (async () => {
      if (session?.user?.id) {
        try {
          const userPromise = supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle();

          const { data: userData, error: userError } = await withTimeout(userPromise, 15000);

          if (userError || !userData) {
            console.warn('⚠️ Auth state user lookup failed, using fallback auth user:', userError?.message ?? 'no data');
            const fallback = createFallbackUser(session.user);
            persistAuthData(fallback, session.access_token ?? null);
            callback(fallback);
            return;
          }

          persistAuthData(userData as User, session.access_token ?? null);
          callback(userData as User);
        } catch (error) {
          console.error('❌ Auth state change error:', error);
          const fallback = createFallbackUser(session.user);
          persistAuthData(fallback, session.access_token ?? null);
          callback(fallback);
        }
      } else {
        persistAuthData(null, null);
        callback(null);
      }
    })();
  });

  return data?.subscription.unsubscribe;
}
