import { supabase, Customer } from "./supabase";

export async function getCustomers(): Promise<{
  customers: Customer[];
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return { customers: [], error: error.message };
    }

    return { customers: data || [], error: null };
  } catch (err) {
    return { customers: [], error: String(err) };
  }
}

export async function getCustomer(id: string): Promise<{
  customer: Customer | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return { customer: null, error: error.message };
    }

    return { customer: data, error: null };
  } catch (err) {
    return { customer: null, error: String(err) };
  }
}

export async function addCustomer(customer: Omit<Customer, "id" | "created_at">): Promise<{
  customer: Customer | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from("customers")
      .insert(customer)
      .select()
      .single();

    if (error) {
      return { customer: null, error: error.message };
    }

    return { customer: data, error: null };
  } catch (err) {
    return { customer: null, error: String(err) };
  }
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<{
  customer: Customer | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from("customers")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { customer: null, error: error.message };
    }

    return { customer: data, error: null };
  } catch (err) {
    return { customer: null, error: String(err) };
  }
}

export async function deleteCustomer(id: string): Promise<{
  error: string | null;
}> {
  try {
    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", id);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    return { error: String(err) };
  }
}