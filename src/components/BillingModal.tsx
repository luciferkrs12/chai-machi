import React, { useState } from "react";
import { useData, Product } from "@/contexts/DataContext";
import PaymentModal from "@/components/PaymentModal";
import { motion } from "framer-motion";
import { X, Plus, Minus, Trash2, Search } from "lucide-react";

interface Props {
  tableId: string;
  onClose: () => void;
}

const BillingModal: React.FC<Props> = ({ tableId, onClose }) => {
  const { tables, products, getActiveOrderForTable, createOrder, assignCustomerToOrder, addCustomer, addItemToOrder, updateItemQuantity, removeItemFromOrder } = useData();
  const table = tables.find(t => t.id === tableId);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [showPayment, setShowPayment] = useState(false);

  if (!table) return null;

  const order = getActiveOrderForTable(tableId);

  const handleSaveNewCustomer = () => {
    const name = customerName.trim();
    const phone = customerPhone.trim();
    if (!name) return;
    const saved = addCustomer(name, phone);
    setCustomerName(saved.name);
    setCustomerPhone(saved.phone);
    if (order && !order.customer_name) {
      assignCustomerToOrder(order.id, saved.name);
    }
  };

  const handleAddProduct = (product: Product) => {
    const currentOrder = order ?? createOrder(tableId, table.name, customerName?.trim() || undefined);
    if (order && customerName.trim() && !order.customer_name) {
      assignCustomerToOrder(order.id, customerName.trim());
    }
    addItemToOrder(currentOrder.id, product);
  };

  const categories = ["All", ...Array.from(new Set(products.filter(p => p.active).map(p => p.category)))];
  const activeProducts = products.filter(p => p.active && p.name.toLowerCase().includes(search.toLowerCase()) && (category === "All" || p.category === category));

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card rounded-2xl border w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b">
            <div>
              <h2 className="font-bold text-lg text-foreground">{table.name} - Billing</h2>
              <p className="text-xs text-muted-foreground">
                {order ? `Order #${order.id.slice(0, 8)}` : "New Order"}
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition"><X className="w-5 h-5" /></button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Products */}
            <div className="w-1/2 border-r p-4 overflow-auto">
              <div className="space-y-4 mb-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">Customer details</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        placeholder="Customer name"
                        className="rounded-lg border px-3 py-2 bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                      />
                      <input
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        placeholder="Phone (optional)"
                        className="rounded-lg border px-3 py-2 bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleSaveNewCustomer}
                    disabled={!customerName.trim()}
                    className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                  >
                    Add customer
                  </button>
                </div>
              </div>
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="w-full pl-9 pr-4 py-2 rounded-lg border bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <select value={category} onChange={e => setCategory(e.target.value)} className="border rounded-lg px-3 py-2 bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-primary">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {activeProducts.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleAddProduct(p)}
                    className="p-3 rounded-lg border bg-background hover:border-primary hover:bg-accent transition text-left"
                  >
                    <p className="text-sm font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.category}</p>
                    <p className="text-sm font-bold text-primary mt-1">₹{p.price}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Order Items */}
            <div className="w-1/2 p-4 flex flex-col overflow-auto">
              <h3 className="font-bold text-foreground mb-3">Order Items</h3>
              {!order || order.items.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">No items yet</div>
              ) : (
                <div className="flex-1 space-y-2 overflow-auto">
                  {order.items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border bg-background">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">₹{item.price} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateItemQuantity(order!.id, item.id, item.quantity - 1)} className="w-7 h-7 rounded-md border flex items-center justify-center hover:bg-muted transition">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-bold w-6 text-center text-foreground">{item.quantity}</span>
                        <button onClick={() => updateItemQuantity(order!.id, item.id, item.quantity + 1)} className="w-7 h-7 rounded-md border flex items-center justify-center hover:bg-muted transition">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-sm font-bold text-foreground w-16 text-right">₹{item.total}</p>
                      <button onClick={() => removeItemFromOrder(order!.id, item.id)} className="p-1 rounded hover:bg-destructive/10 transition">
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* Total */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold text-foreground">Total</span>
                  <span className="text-2xl font-bold text-primary">₹{order?.total_amount ?? 0}</span>
                </div>
                <button
                  onClick={() => order && order.items.length > 0 && setShowPayment(true)}
                  disabled={!order || order.items.length === 0}
                  className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition disabled:opacity-50"
                >
                  Pay ₹{order?.total_amount ?? 0}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {showPayment && (
        <PaymentModal orderId={order.id} amount={order.total_amount} onClose={() => { setShowPayment(false); onClose(); }} />
      )}
    </>
  );
};

export default BillingModal;
