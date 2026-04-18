import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env.local file."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Type definitions for database
export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "staff";
  created_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category?: string;
  total_sold: number;
  daily_added_stock: number;
  created_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  created_at?: string;
}

export interface Order {
  id: string;
  customer_id?: string;
  product_id: string;
  quantity: number;
  total_price: number;
  order_type: 'dine_in' | 'takeaway';
  status: 'pending' | 'completed' | 'cancelled';
  created_at?: string;
}

export interface Sale {
  id: string;
  user_id?: string;
  date: string;
  total_amount: number;
  created_at?: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  item_id: string;
  quantity: number;
  price: number;
  created_at?: string;
}

// Connection check function
export async function checkConnection(): Promise<{
  connected: boolean;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .limit(1);

    if (error) {
      return { connected: false, error: error.message };
    }

    return { connected: true, error: null };
  } catch (err) {
    return { connected: false, error: String(err) };
  }
}
