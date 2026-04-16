import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  active: boolean;
}

export interface TableItem {
  id: string;
  name: string;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  id: string;
  table_id: string;
  table_name: string;
  customer_name?: string;
  status: "Active" | "Completed";
  items: OrderItem[];
  total_amount: number;
  payment_method?: "Cash" | "UPI";
  created_at: string;
  completed_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  visits: number;
  total_spent: number;
}

interface DataContextType {
  tables: TableItem[];
  orders: Order[];
  products: Product[];
  customers: Customer[];
  addTable: (name: string) => void;
  editTable: (id: string, name: string) => void;
  deleteTable: (id: string) => void;
  getActiveOrderForTable: (tableId: string) => Order | undefined;
  createOrder: (tableId: string, tableName: string, customerName?: string) => Order;
  assignCustomerToOrder: (orderId: string, customerName: string) => void;
  addCustomer: (name: string, phone?: string) => Customer;
  addItemToOrder: (orderId: string, product: Product, quantity?: number) => void;
  updateItemQuantity: (orderId: string, itemId: string, quantity: number) => void;
  removeItemFromOrder: (orderId: string, itemId: string) => void;
  completeOrder: (orderId: string, method: "Cash" | "UPI") => void;
  deleteOrder: (orderId: string) => void;
  addProduct: (p: Omit<Product, "id">) => void;
  editProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  todaySales: number;
  todayOrders: number;
  paidAmount: number;
  pendingAmount: number;
}

const DataContext = createContext<DataContextType | null>(null);

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be inside DataProvider");
  return ctx;
};

function load<T>(key: string, def: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : def;
  } catch { return def; }
}

const defaultProducts: Product[] = [
  { id: "p1", name: "Tea", price: 20, category: "Beverages", active: true },
  { id: "p2", name: "Coffee", price: 30, category: "Beverages", active: true },
  { id: "p3", name: "Cake", price: 80, category: "Cakes", active: true },
  { id: "p4", name: "Puff", price: 25, category: "Snacks", active: true },
  { id: "p5", name: "Sandwich", price: 60, category: "Snacks", active: true },
  { id: "p6", name: "Samosa", price: 15, category: "Snacks", active: true },
  { id: "p7", name: "Bread", price: 40, category: "Bakery", active: true },
  { id: "p8", name: "Cookies", price: 50, category: "Bakery", active: true },
  { id: "p9", name: "Juice", price: 35, category: "Beverages", active: true },
  { id: "p10", name: "Pastry", price: 45, category: "Cakes", active: true },
];

const defaultTables: TableItem[] = [
  { id: "t1", name: "Table 1" },
  { id: "t2", name: "Table 2" },
  { id: "t3", name: "Table 3" },
  { id: "t4", name: "Table 4" },
  { id: "t5", name: "Table 5" },
  { id: "t6", name: "Table 6" },
];

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tables, setTables] = useState<TableItem[]>(() => load("pos_tables", defaultTables));
  const [orders, setOrders] = useState<Order[]>(() => load("pos_orders", []));
  const [products, setProducts] = useState<Product[]>(() => load("pos_products", defaultProducts));
  const [customers, setCustomers] = useState<Customer[]>(() => load("pos_customers", []));

  useEffect(() => { localStorage.setItem("pos_tables", JSON.stringify(tables)); }, [tables]);
  useEffect(() => { localStorage.setItem("pos_orders", JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem("pos_products", JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem("pos_customers", JSON.stringify(customers)); }, [customers]);

  const uid = () => crypto.randomUUID();

  const addTable = (name: string) => setTables(t => [...t, { id: uid(), name }]);
  const editTable = (id: string, name: string) => setTables(t => t.map(x => x.id === id ? { ...x, name } : x));
  const deleteTable = (id: string) => setTables(t => t.filter(x => x.id !== id));

  const getActiveOrderForTable = useCallback((tableId: string) =>
    orders.find(o => o.table_id === tableId && o.status === "Active"), [orders]);

  const createOrder = (tableId: string, tableName: string, customerName?: string): Order => {
    const existing = orders.find(o => o.table_id === tableId && o.status === "Active");
    if (existing) return existing;
    const order: Order = {
      id: uid(), table_id: tableId, table_name: tableName,
      customer_name: customerName,
      status: "Active", items: [], total_amount: 0,
      created_at: new Date().toISOString(),
    };
    setOrders(o => [...o, order]);
    return order;
  };

  const assignCustomerToOrder = (orderId: string, customerName: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, customer_name: customerName } : o));
  };

  const addCustomer = (name: string, phone = "") => {
    const normalized = name.trim();
    const existing = customers.find(c => c.name.trim().toLowerCase() === normalized.toLowerCase());
    if (existing) {
      if (phone.trim() && existing.phone !== phone.trim()) {
        setCustomers(prev => prev.map(c => c.id === existing.id ? { ...c, phone: phone.trim() } : c));
      }
      return existing;
    }
    const customer = { id: uid(), name: normalized, phone: phone.trim(), visits: 0, total_spent: 0 };
    setCustomers(prev => [...prev, customer]);
    return customer;
  };

  const addItemToOrder = (orderId: string, product: Product, quantity = 1) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const existing = o.items.find(i => i.product_id === product.id);
      let items: OrderItem[];
      if (existing) {
        items = o.items.map(i => i.product_id === product.id
          ? { ...i, quantity: i.quantity + quantity, total: (i.quantity + quantity) * i.price }
          : i);
      } else {
        items = [...o.items, {
          id: uid(), product_id: product.id, product_name: product.name,
          quantity, price: product.price, total: product.price * quantity,
        }];
      }
      return { ...o, items, total_amount: items.reduce((s, i) => s + i.total, 0) };
    }));
  };

  const updateItemQuantity = (orderId: string, itemId: string, quantity: number) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const items = quantity <= 0
        ? o.items.filter(i => i.id !== itemId)
        : o.items.map(i => i.id === itemId ? { ...i, quantity, total: quantity * i.price } : i);
      return { ...o, items, total_amount: items.reduce((s, i) => s + i.total, 0) };
    }));
  };

  const removeItemFromOrder = (orderId: string, itemId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const items = o.items.filter(i => i.id !== itemId);
      return { ...o, items, total_amount: items.reduce((s, i) => s + i.total, 0) };
    }));
  };

  const completeOrder = (orderId: string, method: "Cash" | "UPI") => {
    setOrders(prev => {
      const updatedOrders = prev.map(o =>
        o.id === orderId ? { ...o, status: "Completed" as const, payment_method: method, completed_at: new Date().toISOString() } : o
      );

      const order = updatedOrders.find(o => o.id === orderId);
      if (!order || !order.customer_name) return updatedOrders;

      const customerName = order.customer_name.trim();
      setCustomers(prevCustomers => {
        const index = prevCustomers.findIndex(c => c.name.trim().toLowerCase() === customerName.toLowerCase());
        if (index >= 0) {
          const updated = [...prevCustomers];
          updated[index] = {
            ...updated[index],
            visits: updated[index].visits + 1,
            total_spent: updated[index].total_spent + order.total_amount,
          };
          return updated;
        }
        return [...prevCustomers, {
          id: uid(),
          name: customerName,
          phone: "",
          visits: 1,
          total_spent: order.total_amount,
        }];
      });

      return updatedOrders;
    });
  };

  const deleteOrder = (orderId: string) => setOrders(prev => prev.filter(o => o.id !== orderId));

  const addProduct = (p: Omit<Product, "id">) => setProducts(prev => [...prev, { ...p, id: uid() }]);
  const editProduct = (id: string, p: Partial<Product>) => setProducts(prev => prev.map(x => x.id === id ? { ...x, ...p } : x));
  const deleteProduct = (id: string) => setProducts(prev => prev.filter(x => x.id !== id));

  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === today);
  const todaySales = todayOrders.filter(o => o.status === "Completed").reduce((s, o) => s + o.total_amount, 0);
  const paidAmount = todaySales;
  const pendingAmount = todayOrders.filter(o => o.status === "Active").reduce((s, o) => s + o.total_amount, 0);

  return (
    <DataContext.Provider value={{
      tables, orders, products, customers,
      addTable, editTable, deleteTable,
      getActiveOrderForTable, createOrder,
      addItemToOrder, updateItemQuantity, removeItemFromOrder,
      completeOrder, deleteOrder,
      addProduct, editProduct, deleteProduct, addCustomer, assignCustomerToOrder,
      todaySales, todayOrders: todayOrders.length, paidAmount, pendingAmount,
    }}>
      {children}
    </DataContext.Provider>
  );
};
