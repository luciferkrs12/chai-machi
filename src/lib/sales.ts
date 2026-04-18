import { supabase, Sale, SaleItem } from "./supabase";
import { reduceStock } from "./inventory";

export interface SaleWithItems extends Sale {
  items: (SaleItem & { product_name?: string })[];
}

/**
 * Get all sales with items
 */
export async function getAllSales(): Promise<{
  sales: SaleWithItems[] | null;
  error: string | null;
}> {
  try {
    const { data: salesData, error: salesError } = await supabase
      .from("sales")
      .select("*")
      .order("created_at", { ascending: false });

    if (salesError) {
      return { sales: null, error: salesError.message };
    }

    const salesArray = (salesData || []) as Sale[];
    const saleIds = salesArray.map((sale) => sale.id);

    const { data: itemsData, error: itemsError } = await supabase
      .from("sale_items")
      .select("*")
      .in("sale_id", saleIds);

    if (itemsError) {
      return { sales: null, error: itemsError.message };
    }

    const inventoryIds = Array.from(new Set((itemsData || []).map((item) => item.item_id)));
    const { data: productsData } = await supabase
      .from("inventory")
      .select("id, name")
      .in("id", inventoryIds);

    const productMap = new Map((productsData || []).map((product) => [product.id, product.name]));

    const salesWithItems = salesArray.map((sale) => {
      return {
        ...sale,
        items: (itemsData || [])
          .filter((item) => item.sale_id === sale.id)
          .map((item) => ({
            ...item,
            product_name: productMap.get(item.item_id) || "Unknown",
          })),
      } as SaleWithItems;
    });

    return { sales: salesWithItems, error: null };
  } catch (error) {
    return { sales: null, error: String(error) };
  }
}

/**
 * Get single sale with items
 */
export async function getSale(id: string): Promise<{
  sale: SaleWithItems | null;
  error: string | null;
}> {
  try {
    const { data: saleData, error: saleError } = await supabase
      .from("sales")
      .select("*")
      .eq("id", id)
      .single();

    if (saleError) {
      return { sale: null, error: saleError.message };
    }

    const { data: itemsData, error: itemsError } = await supabase
      .from("sale_items")
      .select("*")
      .eq("sale_id", id);

    if (itemsError) {
      return { sale: null, error: itemsError.message };
    }

    const inventoryIds = Array.from(new Set((itemsData || []).map((item) => item.item_id)));
    const { data: productsData } = await supabase
      .from("inventory")
      .select("id, name")
      .in("id", inventoryIds);

    const productMap = new Map((productsData || []).map((product) => [product.id, product.name]));

    return {
      sale: {
        ...saleData,
        items: (itemsData || []).map((item) => ({
          ...item,
          product_name: productMap.get(item.item_id) || "Unknown",
        })),
      } as SaleWithItems,
      error: null,
    };
  } catch (error) {
    return { sale: null, error: String(error) };
  }
}

/**
 * Create a new sale with items
 * This handles:
 * 1. Creating the sale record
 * 2. Creating sale items
 * 3. Reducing inventory stock
 */
export async function createSale(
  userId: string,
  items: Array<{ item_id: string; quantity: number; price: number }>
): Promise<{
  sale: Sale | null;
  error: string | null;
}> {
  try {
    // Calculate total amount
    const totalAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // 1. Create sale
    const { data: saleData, error: saleError } = await supabase
      .from("sales")
      .insert({
        user_id: userId,
        total_amount: totalAmount,
        date: new Date().toISOString(),
      })
      .select()
      .single();

    if (saleError || !saleData) {
      return { sale: null, error: saleError?.message || "Failed to create sale" };
    }

    // 2. Create sale items and reduce stock
    for (const item of items) {
      // Insert sale item
      const { error: itemError } = await supabase.from("sale_items").insert({
        sale_id: saleData.id,
        item_id: item.item_id,
        quantity: item.quantity,
        price: item.price,
      });

      if (itemError) {
        return { sale: null, error: itemError.message };
      }

      // Reduce inventory stock
      const { success, error: stockError } = await reduceStock(
        item.item_id,
        item.quantity
      );

      if (!success) {
        return { sale: null, error: stockError };
      }
    }

    return { sale: saleData as Sale, error: null };
  } catch (error) {
    return { sale: null, error: String(error) };
  }
}

/**
 * Get sales report for a date range
 */
export async function getSalesReport(startDate: string, endDate: string): Promise<{
  report: {
    total_sales: number;
    total_amount: number;
    items_sold: number;
  } | null;
  error: string | null;
}> {
  try {
    const { data: salesData, error: salesError } = await supabase
      .from("sales")
      .select("*")
      .gte("date", startDate)
      .lte("date", endDate);

    if (salesError) {
      return { report: null, error: salesError.message };
    }

    // Get sale items count
    const { data: itemsData, error: itemsError } = await supabase
      .from("sale_items")
      .select("quantity")
      .gte(
        "created_at",
        new Date(startDate).toISOString()
      )
      .lte(
        "created_at",
        new Date(endDate).toISOString()
      );

    if (itemsError) {
      return { report: null, error: itemsError.message };
    }

    const totalAmount = (salesData || []).reduce(
      (sum, sale) => sum + (sale.total_amount || 0),
      0
    );
    const itemsSold = (itemsData || []).reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );

    return {
      report: {
        total_sales: (salesData || []).length,
        total_amount: totalAmount,
        items_sold: itemsSold,
      },
      error: null,
    };
  } catch (error) {
    return { report: null, error: String(error) };
  }
}

/**
 * Delete a sale (Admin only)
 * This should NOT restore stock to maintain data integrity
 */
export async function deleteSale(id: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const { error } = await supabase.from("sales").delete().eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Subscribe to sales updates in real-time
 */
export function subscribeToSales(
  callback: (sales: SaleWithItems[]) => void
) {
  const subscription = supabase
    .from("sales")
    .on("*", async (payload) => {
      const { sales } = await getAllSales();
      if (sales) {
        callback(sales);
      }
    })
    .subscribe();

  return () => {
    supabase.removeSubscription(subscription);
  };
}
