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
  const { tables, products, customers, getActiveOrderForTable, createOrder, assignCustomerToOrder, addCustomer, addItemToOrder, updateItemQuantity, removeItemFromOrder, completeOrder } = useData();
  const isTakeaway = tableId === "takeaway";
  const table = isTakeaway ? { id: "takeaway", name: "Takeaway Order" } : tables.find(t => t.id === tableId);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCollege, setCustomerCollege] = useState("");
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [activeTab, setActiveTab] = useState<"products" | "items">("products");

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

  const validateStockForOrder = () => {
    if (!order) return true;
    for (const item of order.items) {
      const product = products.find(p => p.id === item.product_id);
      if (product && product.stock !== -1 && item.quantity > product.stock) {
        alert(`Not enough stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
        return false;
      }
    }
    return true;
  };

  const categories = ["All", ...Array.from(new Set(products.filter(p => p.active).map(p => p.category)))];
  const activeProducts = products.filter(p => p.active && p.stock > 0 && p.name.toLowerCase().includes(search.toLowerCase()) && (category === "All" || p.category === category));

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card rounded-2xl border w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b">
            <div>
              <h2 className="font-bold text-base sm:text-lg text-foreground">{table.name} - Billing</h2>
              <p className="text-xs text-muted-foreground">
                {order ? `Order #${order.id.slice(0, 8)}` : "New Order"}
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition flex-shrink-0"><X className="w-5 h-5" /></button>
          </div>

          {/* Mobile Tabs */}
          <div className="lg:hidden flex border-b bg-muted/30">
            <button
              onClick={() => setActiveTab("products")}
              className={`flex-1 py-3 px-4 font-semibold text-sm transition ${
                activeTab === "products"
                  ? "bg-background border-b-2 border-primary text-primary"
                  : "text-muted-foreground"
              }`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab("items")}
              className={`flex-1 py-3 px-4 font-semibold text-sm transition ${
                activeTab === "items"
                  ? "bg-background border-b-2 border-primary text-primary"
                  : "text-muted-foreground"
              }`}
            >
              Order Items
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Products */}
            <div className={`w-full lg:w-1/2 lg:border-r p-3 sm:p-4 flex flex-col overflow-hidden ${
              activeTab === "products" || "hidden lg:flex"
            }`}>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground">Products</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Add items to the current order</p>
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground">{activeProducts.length} items</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mb-3 sm:mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="w-full pl-9 pr-4 py-2.5 sm:py-2 rounded-lg border bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <select value={category} onChange={e => setCategory(e.target.value)} className="border rounded-lg px-3 py-2.5 sm:py-2 bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-primary">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex-1 overflow-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2">
                {activeProducts.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleAddProduct(p)}
                    className="p-3 rounded-lg border transition text-left relative bg-background hover:border-primary hover:bg-accent active:scale-95"
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-xs sm:text-sm font-medium text-foreground">{p.name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{p.category}</p>
                    <p className="text-sm font-bold mt-1 text-primary">₹{p.price}</p>
                  </button>
                ))}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className={`w-full lg:w-1/2 p-3 sm:p-4 flex flex-col overflow-hidden bg-muted/10 ${
              activeTab === "items" || "hidden lg:flex"
            }`}>
              <div className="flex items-center justify-between mb-3 gap-2 flex-shrink-0">
                 <h3 className="font-bold text-base sm:text-lg text-foreground">Order Items</h3>
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
                <div className="mb-3 bg-card border rounded-xl p-4 shadow-sm relative text-sm flex-shrink-0">
                   <button onClick={() => setShowAddCustomer(false)} className="absolute right-2 top-2 p-1 hover:bg-muted rounded flex-shrink-0"><X className="w-4 h-4" /></button>
                   <h4 className="font-bold mb-3">New Customer</h4>
                   <div className="space-y-3">
                       <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Name *" className="w-full border rounded px-3 py-2.5 focus:ring-2 outline-none text-sm" />
                       <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Phone" className="w-full border rounded px-3 py-2.5 focus:ring-2 outline-none text-sm" />
                       <input value={customerCollege} onChange={e => setCustomerCollege(e.target.value)} placeholder="College" className="w-full border rounded px-3 py-2.5 focus:ring-2 outline-none text-sm" />
                       <button onClick={handleSaveNewCustomer} disabled={!customerName.trim()} className="w-full bg-primary text-primary-foreground py-3 rounded font-bold hover:opacity-90 disabled:opacity-50 mt-2">Add Customer</button>
                   </div>
                </div>
              )}

              {!order || order.items.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">No items yet</div>
              ) : (
                <div className="flex-1 overflow-auto min-h-0">
                  <div className="space-y-2">
                    {order.items.map(item => (
                    <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg border bg-background">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">₹{item.price} each</p>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button onClick={() => updateItemQuantity(order!.id, item.id, item.quantity - 1)} className="h-9 w-9 rounded-md border flex items-center justify-center hover:bg-muted transition active:scale-95">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-bold w-8 text-center text-foreground">{item.quantity}</span>
                        <button 
                          onClick={() => {
                             const product = products.find(p => p.id === item.product_id);
                             if (product && product.stock !== -1 && item.quantity >= product.stock) return;
                             updateItemQuantity(order!.id, item.id, item.quantity + 1);
                          }} 
                          className="h-9 w-9 rounded-md border flex items-center justify-center hover:bg-muted transition active:scale-95"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                        <p className="text-sm font-bold text-foreground">₹{item.total}</p>
                        <button onClick={() => removeItemFromOrder(order!.id, item.id)} className="p-2 rounded hover:bg-destructive/10 transition active:scale-95 flex-shrink-0">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Total */}
              <div className="mt-3 pt-3 border-t flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base sm:text-lg font-bold text-foreground">Total</span>
                  <span className="text-xl sm:text-2xl font-bold text-primary">₹{order?.total_amount ?? 0}</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => {
                      if (!order || order.items.length === 0) return;
                      if (!validateStockForOrder()) return;
                      setShowPayment(true);
                    }}
                    disabled={!order || order.items.length === 0}
                    className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition disabled:opacity-50 active:scale-95"
                  >
                    Pay ₹{order?.total_amount ?? 0}
                  </button>
                  <button
                    onClick={() => {
                      if (!order || order.items.length === 0) return;
                      if (!validateStockForOrder()) return;
                      if (!order.customer_name) {
                        alert("Please select a customer before using Pay Later.");
                        return;
                      }
                      completeOrder(order.id, "Credit");
                      onClose();
                    }}
                    disabled={!order || order.items.length === 0}
                    title="Customer will pay later"
                    className="flex-1 sm:flex-none px-4 py-3 rounded-lg border-2 border-destructive text-destructive font-bold text-sm hover:bg-destructive/10 transition disabled:opacity-50 active:scale-95"
                  >
                    Pay Later
                  </button>
                </div>
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
