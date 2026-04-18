import { supabase, Order, Product } from "./supabase";

export interface DailyReportRow {
  product_id: string;
  name: string;
  sold_quantity: number;
  remaining_stock: number;
  revenue: number;
}

export async function getAllOrders(): Promise<{ orders: Order[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return { orders: null, error: error.message };
    }

    return { orders: (data || []) as Order[], error: null };
  } catch (error) {
    return { orders: null, error: String(error) };
  }
}

export async function createOrder(
  productId: string,
  quantity: number
): Promise<{ order: Order | null; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc("place_order", {
      p_product_id: productId,
      p_quantity: quantity,
      p_customer_id: null,
      p_order_type: 'dine_in'
    });

    if (error) {
      return { order: null, error: error.message };
    }

    return { order: (data as Order) || null, error: null };
  } catch (error) {
    return { order: null, error: String(error) };
  }
}

export async function getDailyReport(
  date: string
): Promise<{
  total_products_sold: number;
  total_revenue: number;
  rows: DailyReportRow[];
  error: string | null;
}> {
  try {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const { data: ordersData, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .gte("created_at", dayStart.toISOString())
      .lt("created_at", dayEnd.toISOString());

    if (orderError) {
      return { total_products_sold: 0, total_revenue: 0, rows: [], error: orderError.message };
    }

    const orders = (ordersData || []) as Order[];
    if (orders.length === 0) {
      return { total_products_sold: 0, total_revenue: 0, rows: [], error: null };
    }

    const productIds = Array.from(new Set(orders.map((order) => order.product_id)));
    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select("*")
      .in("id", productIds);

    if (productsError) {
      return { total_products_sold: 0, total_revenue: 0, rows: [], error: productsError.message };
    }

    const products = (productsData || []) as Product[];
    const productMap = new Map(products.map((product) => [product.id, product]));

    const summary = orders.reduce(
      (acc, order) => {
        const product = productMap.get(order.product_id);
        const key = order.product_id;
        const row = acc[key] || {
          product_id: key,
          name: product?.name || "Unknown",
          sold_quantity: 0,
          remaining_stock: product?.stock ?? 0,
          revenue: 0,
        };
        row.sold_quantity += order.quantity;
        row.revenue += Number(order.total_price || 0);
        acc[key] = row;
        return acc;
      },
      {} as Record<string, DailyReportRow>
    );

    const rows = Object.values(summary).sort((a, b) => b.sold_quantity - a.sold_quantity);
    const totalProductsSold = rows.reduce((sum, row) => sum + row.sold_quantity, 0);
    const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);

    return { total_products_sold: totalProductsSold, total_revenue: totalRevenue, rows, error: null };
  } catch (error) {
    return { total_products_sold: 0, total_revenue: 0, rows: [], error: String(error) };
  }
}

export async function getMonthlyReport(
  year: number,
  month: number
): Promise<{
  total_sales: number;
  total_revenue: number;
  rows: DailyReportRow[];
  error: string | null;
}> {
  try {
    const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const monthEnd = new Date(year, month, 1, 0, 0, 0, 0);

    const { data: ordersData, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .gte("created_at", monthStart.toISOString())
      .lt("created_at", monthEnd.toISOString());

    if (orderError) {
      return { total_sales: 0, total_revenue: 0, rows: [], error: orderError.message };
    }

    const orders = (ordersData || []) as Order[];
    if (orders.length === 0) {
      return { total_sales: 0, total_revenue: 0, rows: [], error: null };
    }

    const productIds = Array.from(new Set(orders.map((order) => order.product_id)));
    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select("*")
      .in("id", productIds);

    if (productsError) {
      return { total_sales: 0, total_revenue: 0, rows: [], error: productsError.message };
    }

    const products = (productsData || []) as Product[];
    const productMap = new Map(products.map((product) => [product.id, product]));

    const summary = orders.reduce(
      (acc, order) => {
        const product = productMap.get(order.product_id);
        const key = order.product_id;
        const row = acc[key] || {
          product_id: key,
          name: product?.name || "Unknown",
          sold_quantity: 0,
          remaining_stock: product?.stock ?? 0,
          revenue: 0,
        };
        row.sold_quantity += order.quantity;
        row.revenue += Number(order.total_price || 0);
        acc[key] = row;
        return acc;
      },
      {} as Record<string, DailyReportRow>
    );

    const rows = Object.values(summary).sort((a, b) => b.sold_quantity - a.sold_quantity);
    const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);

    return { total_sales: orders.length, total_revenue: totalRevenue, rows, error: null };
  } catch (error) {
    return { total_sales: 0, total_revenue: 0, rows: [], error: String(error) };
  }
}

export function subscribeOrders(callback: (orders: Order[]) => void) {
  const channel = supabase
    .channel("orders-updates")
    .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, async () => {
      const { orders, error } = await getAllOrders();
      if (!error && orders) {
        callback(orders);
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
