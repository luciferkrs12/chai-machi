import { supabase } from "@/integrations/supabase/client";

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  customer_id: string;
  order_id: string | null;
  amount_paid: number;
  payment_method: string;
  reference_note: string | null;
  created_at: string;
}

export interface CustomerLedger extends Customer {
  totalOrders: number;
  totalPaid: number;
  pending: number;
}

// Customers
export async function fetchCustomers() {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("name");
  if (error) throw error;
  return data as Customer[];
}

export async function createCustomer(customer: { name: string; phone?: string; address?: string }) {
  const { data, error } = await supabase
    .from("customers")
    .insert(customer)
    .select()
    .single();
  if (error) throw error;
  return data as Customer;
}

export async function updateCustomer(id: string, updates: Partial<Customer>) {
  const { data, error } = await supabase
    .from("customers")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Customer;
}

export async function deleteCustomer(id: string) {
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw error;
}

// Customer ledger
export async function fetchCustomerLedger(): Promise<CustomerLedger[]> {
  const { data: customers, error: custErr } = await supabase
    .from("customers")
    .select("*")
    .order("name");
  if (custErr) throw custErr;

  const { data: orders, error: ordErr } = await supabase
    .from("orders")
    .select("customer_id, total_amount")
    .not("customer_id", "is", null);
  if (ordErr) throw ordErr;

  const { data: payments, error: payErr } = await supabase
    .from("payments")
    .select("customer_id, amount_paid");
  if (payErr) throw payErr;

  return (customers as Customer[]).map((c) => {
    const custOrders = orders.filter((o) => o.customer_id === c.id);
    const custPayments = payments.filter((p) => p.customer_id === c.id);
    const totalOrders = custOrders.reduce((s, o) => s + Number(o.total_amount), 0);
    const totalPaid = custPayments.reduce((s, p) => s + Number(p.amount_paid), 0);
    return { ...c, totalOrders, totalPaid, pending: totalOrders - totalPaid };
  });
}

export async function fetchCustomerOrders(customerId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchCustomerPayments(customerId: string) {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Payment[];
}

// Payments
export async function createPayment(payment: {
  customer_id: string;
  order_id?: string;
  amount_paid: number;
  payment_method: string;
  reference_note?: string;
}) {
  const { data, error } = await supabase
    .from("payments")
    .insert(payment)
    .select()
    .single();
  if (error) throw error;
  return data as Payment;
}

// Settings
export async function fetchSetting(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", key)
    .single();
  if (error) return null;
  return data.value;
}

export async function upsertSetting(key: string, value: string) {
  const { data: existing } = await supabase
    .from("settings")
    .select("id")
    .eq("key", key)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("settings")
      .update({ value })
      .eq("key", key);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("settings")
      .insert({ key, value });
    if (error) throw error;
  }
}
