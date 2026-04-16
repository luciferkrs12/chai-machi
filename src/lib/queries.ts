import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];

export type { Product, Order, OrderItem };

// Products
export async function fetchProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("category")
    .order("name");
  if (error) throw error;
  return data;
}

export async function fetchActiveProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("category")
    .order("name");
  if (error) throw error;
  return data;
}

export async function createProduct(product: ProductInsert) {
  const { data, error } = await supabase.from("products").insert(product).select().single();
  if (error) throw error;
  return data;
}

export async function updateProduct(id: string, updates: Partial<Product>) {
  const { data, error } = await supabase.from("products").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

// Orders
export async function fetchOrders(filters?: {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  tableName?: string;
}) {
  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("payment_status", filters.status);
  }
  if (filters?.dateFrom) {
    query = query.gte("created_at", filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte("created_at", filters.dateTo + "T23:59:59");
  }
  if (filters?.search) {
    query = query.or(`table_name.ilike.%${filters.search}%,id.ilike.%${filters.search}%`);
  }
  if (filters?.tableName) {
    query = query.eq("table_name", filters.tableName);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchOrderWithItems(orderId: string) {
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();
  if (orderError) throw orderError;

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);
  if (itemsError) throw itemsError;

  return { ...order, items };
}

export async function createOrder(
  tableName: string,
  items: Array<{ product_id: string; product_name: string; quantity: number; price: number }>,
  customerId?: string,
  paymentMethod?: string
) {
  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const insertData: any = { table_name: tableName, total_amount: totalAmount, payment_status: "Pending" };
  if (customerId) insertData.customer_id = customerId;
  if (paymentMethod) insertData.payment_method = paymentMethod;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert(insertData)
    .select()
    .single();
  if (orderError) throw orderError;

  const orderItems = items.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    product_name: item.product_name,
    quantity: item.quantity,
    price: item.price,
    subtotal: item.price * item.quantity,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
  if (itemsError) throw itemsError;

  return order;
}

export async function updatePaymentStatus(orderId: string, status: string) {
  const { data, error } = await supabase
    .from("orders")
    .update({ payment_status: status })
    .eq("id", orderId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Dashboard stats
export async function fetchTodayStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .gte("created_at", todayISO);
  if (error) throw error;

  const totalSales = orders.reduce((sum, o) => sum + o.total_amount, 0);
  const paidAmount = orders.filter((o) => o.payment_status === "Paid").reduce((sum, o) => sum + o.total_amount, 0);
  const pendingAmount = orders.filter((o) => o.payment_status === "Pending").reduce((sum, o) => sum + o.total_amount, 0);

  return {
    totalSales,
    totalOrders: orders.length,
    paidAmount,
    pendingAmount,
  };
}

// Reports
export async function fetchMonthlyReport(year: number, month: number) {
  const startDate = new Date(year, month, 1).toISOString();
  const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .gte("created_at", startDate)
    .lte("created_at", endDate)
    .order("created_at");
  if (error) throw error;

  // Get order items for top selling products
  const orderIds = orders.map((o) => o.id);
  let items: OrderItem[] = [];
  if (orderIds.length > 0) {
    const { data, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .in("order_id", orderIds);
    if (itemsError) throw itemsError;
    items = data;
  }

  // Top selling products
  const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  items.forEach((item) => {
    const existing = productMap.get(item.product_name) || { name: item.product_name, quantity: 0, revenue: 0 };
    existing.quantity += item.quantity;
    existing.revenue += item.subtotal;
    productMap.set(item.product_name, existing);
  });
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Daily breakdown
  const dailyMap = new Map<string, { date: string; sales: number; orders: number }>();
  orders.forEach((o) => {
    const date = o.created_at.split("T")[0];
    const existing = dailyMap.get(date) || { date, sales: 0, orders: 0 };
    existing.sales += o.total_amount;
    existing.orders += 1;
    dailyMap.set(date, existing);
  });

  return {
    orders,
    totalSales: orders.reduce((s, o) => s + o.total_amount, 0),
    totalOrders: orders.length,
    paidAmount: orders.filter((o) => o.payment_status === "Paid").reduce((s, o) => s + o.total_amount, 0),
    pendingAmount: orders.filter((o) => o.payment_status === "Pending").reduce((s, o) => s + o.total_amount, 0),
    topProducts,
    dailyBreakdown: Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
  };
}

// Pending orders for a table
export async function fetchPendingOrderForTable(tableName: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("table_name", tableName)
    .eq("payment_status", "Pending")
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  return data?.[0] || null;
}

// Export to CSV
export function exportToCSV(orders: Order[], filename: string) {
  const headers = ["Order ID", "Table", "Total Amount (₹)", "Payment Method", "Payment Status", "Date"];
  const rows = orders.map((o) => [
    o.id,
    o.table_name,
    o.total_amount.toString(),
    o.payment_method || "—",
    o.payment_status,
    new Date(o.created_at).toLocaleString("en-IN"),
  ]);

  const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
