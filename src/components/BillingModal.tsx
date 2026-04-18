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
  const { tables, products, customers, getActiveOrderForTable, createOrder, assignCustomerToOrder, addCustomer, addItemToOrder, updateItemQuantity, removeItemFromOrder } = useData();
  const isTakeaway = tableId === "takeaway";
  const table = isTakeaway ? { id: "takeaway", name: "Takeaway Order" } : tables.find(t => t.id === tableId);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCollege, setCustomerCollege] = useState("");
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  if (!table) return null;

  // For takeaway, if we're opening it without an active order, we just start fresh
  const order = getActiveOrderForTable(tableId);

  // Sync selected customer with the active order if present
  const selectedCustomerId = order?.customer_name ? customers.find(c => c.name.toLowerCase() === order.customer_name!.toLowerCase())?.id || "walk-in" : "walk-in";

  const handleSaveNewCustomer = () => {
    const name = customerName.trim();
    const phone = customerPhone.trim();
    const college = customerCollege.trim();
    if (!name) return;
    const saved = addCustomer(name, phone, college);
    
    // Automatically assign this newly created customer
    const currentOrder = order ?? createOrder(tableId, isTakeaway ? "Takeaway" : table.name, saved.name);
    if (order) assignCustomerToOrder(currentOrder.id, saved.name);
    
    setShowAddCustomer(false);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerCollege("");
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
     const val = e.target.value;
     if (val === "add_new") {
        setShowAddCustomer(true);
     } else if (val === "walk-in") {
        if (order) assignCustomerToOrder(order.id, "");
     } else {
        const c = customers.find(x => x.id === val);
        if (order && c) assignCustomerToOrder(order.id, c.name);
        else if (c) {
          // pre-assign logically by storing temporarily or forcing order creation
          createOrder(tableId, isTakeaway ? "Takeaway" : table.name, c.name);
        }
     }
  };

  const handleAddProduct = (product: Product) => {
    const currentOrder = order ?? createOrder(tableId, isTakeaway ? "Takeaway" : table.name);
    // Check stock limit
    if (product.stock !== -1) {
      const existingItem = currentOrder.items?.find(i => i.product_id === product.id);
      const currentQty = existingItem ? existingItem.quantity : 0;
      if (currentQty >= product.stock) {
         return; // Prevent exceeding stock
      }
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
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Products</h3>
                  <p className="text-sm text-muted-foreground">Add items to the current order</p>
                </div>
                <span className="text-sm text-muted-foreground">{activeProducts.length} items</span>
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
                {activeProducts.map(p => {
                  const outOfStock = p.stock === 0;
                  return (
                    <button
                      key={p.id}
                      onClick={() => !outOfStock && handleAddProduct(p)}
                      disabled={outOfStock}
                      className={`p-3 rounded-lg border transition text-left relative ${outOfStock ? "opacity-60 cursor-not-allowed bg-muted/50 border-destructive/20" : "bg-background hover:border-primary hover:bg-accent"}`}
                    >
                      <div className="flex items-start justify-between">
                        <p className={`text-sm font-medium ${outOfStock ? "text-muted-foreground line-through" : "text-foreground"}`}>{p.name}</p>
                        {outOfStock && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-destructive bg-destructive/10 whitespace-nowrap ml-2">Out of Stock</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">{p.category}</p>
                      <p className={`text-sm font-bold mt-1 ${outOfStock ? "text-muted-foreground line-through" : "text-primary"}`}>₹{p.price}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Order Items */}
            <div className="w-1/2 p-4 flex flex-col overflow-auto bg-muted/10">
              <div className="flex items-center justify-between mb-3">
                 <h3 className="font-bold text-foreground">Order Items</h3>
                 {isTakeaway && (
                   <div className="relative">
                      <select
                        value={selectedCustomerId}
                        onChange={handleCustomerChange}
                        className="border rounded-lg pl-3 pr-8 py-1.5 bg-background text-sm font-medium focus:ring-2 outline-none appearance-none"
                      >
                         <option value="walk-in">Walk-in (No Customer)</option>
                         {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                         ))}
                         <option disabled>──────────</option>
                         <option value="add_new">+ Add New Customer</option>
                      </select>
                   </div>
                 )}
              </div>

              {isTakeaway && showAddCustomer && (
                <div className="mb-4 bg-card border rounded-xl p-3 shadow-sm relative text-sm">
                   <button onClick={() => setShowAddCustomer(false)} className="absolute right-2 top-2 p-1 hover:bg-muted rounded"><X className="w-4 h-4" /></button>
                   <h4 className="font-bold mb-2">New Customer</h4>
                   <div className="space-y-2">
                       <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Name *" className="w-full border rounded px-2 py-1.5 focus:ring-2 outline-none" />
                       <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Phone" className="w-full border rounded px-2 py-1.5 focus:ring-2 outline-none" />
                       <input value={customerCollege} onChange={e => setCustomerCollege(e.target.value)} placeholder="College" className="w-full border rounded px-2 py-1.5 focus:ring-2 outline-none" />
                       <button onClick={handleSaveNewCustomer} disabled={!customerName.trim()} className="w-full bg-primary text-primary-foreground py-1.5 rounded font-bold hover:opacity-90 disabled:opacity-50 mt-1">Add Customer</button>
                   </div>
                </div>
              )}

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
                        <button 
                          onClick={() => {
                             const product = products.find(p => p.id === item.product_id);
                             if (product && product.stock !== -1 && item.quantity >= product.stock) return;
                             updateItemQuantity(order!.id, item.id, item.quantity + 1);
                          }} 
                          className="w-7 h-7 rounded-md border flex items-center justify-center hover:bg-muted transition"
                        >
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
