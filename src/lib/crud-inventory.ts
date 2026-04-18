import { supabase, InventoryItem } from "./supabase";

export async function getInventory(): Promise<{
  items: InventoryItem[];
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching inventory:", error);
      return { items: [], error: error.message };
    }

    return { items: (data || []) as InventoryItem[], error: null };
  } catch (err) {
    return { items: [], error: String(err) };
  }
}

export async function getInventoryItem(
  id: string
): Promise<{ item: InventoryItem | null; error: string | null }> {
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
  } catch (err) {
    return { item: null, error: String(err) };
  }
}

export async function addInventoryItem(
  item: Omit<InventoryItem, "id" | "created_at" | "updated_at">
): Promise<{ item: InventoryItem | null; error: string | null }> {
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
      console.error("Error adding item:", error);
      return { item: null, error: error.message };
    }

    return { item: data as InventoryItem, error: null };
  } catch (err) {
    return { item: null, error: String(err) };
  }
}

export async function updateInventoryItem(
  id: string,
  updates: Partial<Omit<InventoryItem, "id" | "created_at">>
): Promise<{ item: InventoryItem | null; error: string | null }> {
  try {
    const updateData: any = { ...updates };

    // Update timestamp
    if (Object.keys(updates).length > 0) {
      updateData.updated_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("inventory")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating item:", error);
      return { item: null, error: error.message };
    }

    return { item: data as InventoryItem, error: null };
  } catch (err) {
    return { item: null, error: String(err) };
  }
}

export async function deleteInventoryItem(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.from("inventory").delete().eq("id", id);

    if (error) {
      console.error("Error deleting item:", error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function reduceStock(
  id: string,
  quantity: number
): Promise<{ success: boolean; error: string | null }> {
  try {
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
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function searchInventory(query: string): Promise<{
  items: InventoryItem[];
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .or(`name.ilike.%${query}%,category.ilike.%${query}%`)
      .order("created_at", { ascending: false });

    if (error) {
      return { items: [], error: error.message };
    }

    return { items: (data || []) as InventoryItem[], error: null };
  } catch (err) {
    return { items: [], error: String(err) };
  }
}

// Subscribe to inventory changes for real-time updates
export function subscribeToInventory(
  callback: (items: InventoryItem[]) => void
): (() => void) | null {
  try {
    const subscription = supabase
      .from("inventory")
      .on("*", () => {
        // When any change happens, refetch
        getInventory().then(({ items }) => {
          callback(items);
        });
      })
      .subscribe();

    // Return unsubscribe function
    return () => {
      supabase.removeSubscription(subscription);
    };
  } catch (err) {
    console.warn("Real-time subscription not available:", err);
    return null;
  }
}
