import { supabase, InventoryItem } from "./supabase";

/**
 * Get all inventory items
 */
export async function getAllInventory(): Promise<{
  items: InventoryItem[] | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return { items: null, error: error.message };
    }

    return { items: (data || []) as InventoryItem[], error: null };
  } catch (error) {
    return { items: null, error: String(error) };
  }
}

/**
 * Get single inventory item by ID
 */
export async function getInventoryItem(id: string): Promise<{
  item: InventoryItem | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return { item: null, error: error.message };
    }

    return { item: data as InventoryItem, error: null };
  } catch (error) {
    return { item: null, error: String(error) };
  }
}

/**
 * Add new inventory item (Admin only)
 */
export async function addInventoryItem(item: Omit<InventoryItem, "id" | "created_at" | "updated_at">): Promise<{
  item: InventoryItem | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from("inventory")
      .insert({
        name: item.name,
        category: item.category,
        price: item.price,
        stock: item.stock,
      })
      .select()
      .single();

    if (error) {
      return { item: null, error: error.message };
    }

    return { item: data as InventoryItem, error: null };
  } catch (error) {
    return { item: null, error: String(error) };
  }
}

/**
 * Update inventory item (Admin only)
 */
export async function updateInventoryItem(
  id: string,
  updates: Partial<Omit<InventoryItem, "id" | "created_at" | "updated_at">>
): Promise<{
  item: InventoryItem | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from("inventory")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { item: null, error: error.message };
    }

    return { item: data as InventoryItem, error: null };
  } catch (error) {
    return { item: null, error: String(error) };
  }
}

/**
 * Delete inventory item (Admin only)
 */
export async function deleteInventoryItem(id: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const { error } = await supabase.from("inventory").delete().eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Reduce stock for an item
 */
export async function reduceStock(id: string, quantity: number): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    // Get current stock
    const { data: item, error: fetchError } = await supabase
      .from("inventory")
      .select("stock")
      .eq("id", id)
      .single();

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    const newStock = (item?.stock || 0) - quantity;

    if (newStock < 0) {
      return { success: false, error: "Insufficient stock" };
    }

    // Update stock
    const { error: updateError } = await supabase
      .from("inventory")
      .update({
        stock: newStock,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Search inventory by name or category
 */
export async function searchInventory(query: string): Promise<{
  items: InventoryItem[] | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .or(`name.ilike.%${query}%,category.ilike.%${query}%`)
      .order("created_at", { ascending: false });

    if (error) {
      return { items: null, error: error.message };
    }

    return { items: (data || []) as InventoryItem[], error: null };
  } catch (error) {
    return { items: null, error: String(error) };
  }
}
