import { supabase, Sale, SaleItem } from "./supabase";
import { reduceStock } from "./crud-inventory";

export interface SaleWithItems extends Sale {
  items?: (SaleItem & { product_name?: string })[];
}

export async function getSales(): Promise<{
  sales: SaleWithItems[];
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      return { sales: [], error: error.message };
    }

    // Fetch items for each sale
    const salesWithItems = await Promise.all(
      (data || []).map(async (sale) => {
        const { data: itemsData } = await supabase
          .from("sale_items")
          .select("*")
          .eq("sale_id", sale.id);

        return {
          ...sale,
          items: itemsData || [],
        } as SaleWithItems;
      })
    );

    return { sales: salesWithItems, error: null };
  } catch (err) {
    return { sales: [], error: String(err) };
  }
}

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

    const { data: itemsData } = await supabase
      .from("sale_items")
      .select("*")
      .eq("sale_id", id);

    return {
      sale: {
        ...saleData,
        items: itemsData || [],
      } as SaleWithItems,
      error: null,
    };
  } catch (err) {
    return { sale: null, error: String(err) };
  }
}

export async function createSale(
  items: Array<{ item_id: string; quantity: number; price: number }>,
  userId?: string
): Promise<{
  sale: Sale | null;
  error: string | null;
}> {
  try {
    if (items.length === 0) {
      return { sale: null, error: "At least one item required" };
    }

    // Calculate total
    const totalAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Create sale record
    const { data: saleData, error: saleError } = await supabase
      .from("sales")
      .insert({
        date: new Date().toISOString(),
        total_amount: totalAmount,
        user_id: userId,
      })
      .select()
      .single();

    if (saleError || !saleData) {
      return { sale: null, error: saleError?.message || "Failed to create sale" };
    }

    // Create sale items and reduce stock
    for (const item of items) {
      // Insert sale item
      const { error: itemError } = await supabase
        .from("sale_items")
        .insert({
          sale_id: saleData.id,
          item_id: item.item_id,
          quantity: item.quantity,
          price: item.price,
        });

      if (itemError) {
        return { sale: null, error: itemError.message };
      }

      // Reduce stock
      const { success, error: stockError } = await reduceStock(
        item.item_id,
        item.quantity
      );

      if (!success) {
        return { sale: null, error: stockError };
      }
    }

    return { sale: saleData as Sale, error: null };
  } catch (err) {
    return { sale: null, error: String(err) };
  }
}

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
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function getSalesReport(
  startDate: string,
  endDate: string
): Promise<{
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

    const { data: itemsData, error: itemsError } = await supabase
      .from("sale_items")
      .select("quantity");

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
  } catch (err) {
    return { report: null, error: String(err) };
  }
}

// Subscribe to sales changes
export function subscribeToSales(
  callback: (sales: SaleWithItems[]) => void
): (() => void) | null {
  try {
    const subscription = supabase
      .from("sales")
      .on("*", () => {
        getSales().then(({ sales }) => {
          callback(sales);
        });
      })
      .subscribe();

    return () => {
      supabase.removeSubscription(subscription);
    };
  } catch (err) {
    console.warn("Real-time subscription not available:", err);
    return null;
  }
}
