import { supabase, Product } from "./supabase";

export interface StockLog {
  id: string;
  product_id: string;
  added_quantity: number;
  created_at?: string;
}

export async function getProducts(): Promise<{
  products: Product[] | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return { products: null, error: error.message };
    }

    return { products: (data || []) as Product[], error: null };
  } catch (error) {
    return { products: null, error: String(error) };
  }
}

export async function getProductById(id: string): Promise<{
  product: Product | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return { product: null, error: error.message };
    }

    return { product: data as Product, error: null };
  } catch (error) {
    return { product: null, error: String(error) };
  }
}

export async function addProduct(
  payload: Omit<Product, "id" | "created_at" | "total_sold" | "daily_added_stock" | "stock"> & { stock?: number }
): Promise<{ product: Product | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from("products")
      .insert({
        name: payload.name,
        price: payload.price,
        category: payload.category || "Other",
        stock: payload.stock ?? 0,
        total_sold: 0,
        daily_added_stock: 0,
      })
      .select()
      .single();

    if (error) {
      return { product: null, error: error.message };
    }
    return { product: data as Product, error: null };
  } catch (error) {
    return { product: null, error: String(error) };
  }
}

export async function updateProduct(
  id: string,
  updates: Partial<Omit<Product, "id" | "created_at" | "total_sold" | "daily_added_stock" | "stock">> & { stock?: number }
): Promise<{ product: Product | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from("products")
      .update({
        ...updates,
      })
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      return { product: null, error: error.message };
    }

    return { product: data as Product, error: null };
  } catch (error) {
    return { product: null, error: String(error) };
  }
}

export async function addStock(
  productId: string,
  addedQuantity: number
): Promise<{ product: Product | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .rpc("add_stock", {
        p_product_id: productId,
        p_added_quantity: addedQuantity,
      })
      .maybeSingle();

    if (error) {
      return { product: null, error: error.message };
    }

    return { product: data as Product, error: null };
  } catch (error) {
    return { product: null, error: String(error) };
  }
}

export async function deleteProduct(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export function subscribeProducts(callback: (products: Product[]) => void) {
  const channel = supabase
    .channel("products-updates")
    .on("postgres_changes", { event: "*", schema: "public", table: "products" }, async () => {
      const { products, error } = await getProducts();
      if (!error && products) {
        callback(products);
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
