// Legacy hooks — inventory and sales DB tables removed.
// Stubs kept so nothing else breaks if they are imported somewhere.

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  created_at?: string;
  updated_at?: string;
}

export interface SaleWithItems {
  id: string;
  date: string;
  total_amount: number;
  items: Array<{ item_id: string; quantity: number; price: number }>;
  created_at?: string;
}

// ==================== STUB INVENTORY HOOK ====================

export function useInventory() {
  return {
    items: [] as InventoryItem[],
    loading: false,
    error: null as string | null,
    addItem: async () => null,
    updateItem: async () => null,
    deleteItem: async () => false,
    search: async () => {},
    refresh: async () => {},
  };
}

// ==================== STUB SALES HOOK ====================

export function useSales() {
  return {
    sales: [] as SaleWithItems[],
    loading: false,
    error: null as string | null,
    addSale: async () => null,
    removeSale: async () => false,
    refresh: async () => {},
  };
}

// ==================== COMBINED HOOK ====================

export function useAppData() {
  const inventory = useInventory();
  const sales = useSales();
  return {
    inventory,
    sales,
    isInitialized: true,
    isLoading: false,
  };
}
