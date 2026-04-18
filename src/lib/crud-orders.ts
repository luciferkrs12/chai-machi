import { supabase, Order, Product } from "./supabase";

export interface OrderWithProduct extends Order {
  product?: Product;
  customer_name?: string;
}

export async function getOrders(): Promise<{
  orders: OrderWithProduct[];
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        products:product_id (
          id,
          name,
          price
        ),
        customers:customer_id (
          id,
          name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return { orders: [], error: error.message };
    }

    const ordersWithDetails = (data || []).map((order: any) => ({
      ...order,
      product: order.products,
      customer_name: order.customers?.name,
    }));

    return { orders: ordersWithDetails, error: null };
  } catch (err) {
    return { orders: [], error: String(err) };
  }
}

export async function getOrder(id: string): Promise<{
  order: OrderWithProduct | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        products:product_id (
          id,
          name,
          price
        ),
        customers:customer_id (
          id,
          name
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      return { order: null, error: error.message };
    }

    return {
      order: {
        ...data,
        product: data.products,
        customer_name: data.customers?.name,
      },
      error: null
    };
  } catch (err) {
    return { order: null, error: String(err) };
  }
}

export async function placeOrder(
  productId: string,
  quantity: number,
  customerId?: string,
  orderType: 'dine_in' | 'takeaway' = 'dine_in'
): Promise<{
  order: Order | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase.rpc("place_order", {
      product_id: productId,
      quantity,
      customer_id: customerId || null,
      order_type: orderType,
    });

    if (error) {
      return { order: null, error: error.message };
    }

    return { order: data, error: null };
  } catch (err) {
    return { order: null, error: String(err) };
  }
}

export async function updateOrderStatus(id: string, status: 'pending' | 'completed' | 'cancelled'): Promise<{
  order: Order | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { order: null, error: error.message };
    }

    return { order: data, error: null };
  } catch (err) {
    return { order: null, error: String(err) };
  }
}

export async function deleteOrder(id: string): Promise<{
  error: string | null;
}> {
  try {
    const { error } = await supabase
      .from("orders")
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