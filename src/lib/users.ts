import { supabase, User } from "./supabase";

export async function getAllUsers(): Promise<{ users: User[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, role, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      return { users: [], error: error.message };
    }

    return { users: (data || []) as User[], error: null };
  } catch (err) {
    return { users: [], error: String(err) };
  }
}

export async function createUserRecord(
  name: string,
  email: string,
  role: "admin" | "staff"
): Promise<{ user: User | null; error: string | null }> {
  try {
    const existing = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (existing.error && existing.error.code !== "PGRST116") {
      return { user: null, error: existing.error.message };
    }

    if (existing.data) {
      const { data, error } = await supabase
        .from("users")
        .update({ name, role })
        .eq("email", email)
        .select()
        .single();

      if (error) {
        return { user: null, error: error.message };
      }

      return { user: data as User, error: null };
    }

    const { data, error } = await supabase
      .from("users")
      .insert({
        id: crypto.randomUUID(),
        name,
        email,
        role,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating user record:", error);
      return { user: null, error: error.message };
    }

    return { user: data as User, error: null };
  } catch (err) {
    return { user: null, error: String(err) };
  }
}

export async function updateUserRole(
  id: string,
  role: "admin" | "staff"
): Promise<{ user: User | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from("users")
      .update({ role })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating user role:", error);
      return { user: null, error: error.message };
    }

    return { user: data as User, error: null };
  } catch (err) {
    return { user: null, error: String(err) };
  }
}

export async function deleteUser(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) {
      console.error("Error deleting user record:", error);
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
