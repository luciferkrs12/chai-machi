import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchActiveProducts, createOrder, fetchPendingOrderForTable, updatePaymentStatus, fetchOrderWithItems } from "@/lib/queries";
import { fetchCustomers } from "@/lib/customer-queries";
import type { Product } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Minus, Trash2, ArrowLeft, IndianRupee, Store, Coffee, Receipt, ChefHat } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { PaymentDialog } from "@/components/PaymentDialog";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/billing/$tableName")({
  component: BillingPage,
  head: () => ({
    meta: [{ title: "Billing — Bakery Billing" }],
  }),
});

interface CartItem {
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
}

function BillingPage() {
  const { tableName } = Route.useParams();
  const decodedTable = decodeURIComponent(tableName);
  const queryClient = useQueryClient();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("walk-in");
  const [showPayment, setShowPayment] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ["activeProducts"],
    queryFn: fetchActiveProducts,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers,
  });

  const { data: pendingOrder } = useQuery({
    queryKey: ["pendingOrder", decodedTable],
    queryFn: () => fetchPendingOrderForTable(decodedTable),
  });

  const { data: pendingOrderDetails } = useQuery({
    queryKey: ["orderDetails", pendingOrder?.id],
    queryFn: () => (pendingOrder ? fetchOrderWithItems(pendingOrder.id) : null),
    enabled: !!pendingOrder,
  });

  const categories = useMemo(() => {
    return ["All", ...new Set(products.map((p) => p.category))];
  }, [products]);

  const filteredProducts = selectedCategory === "All"
    ? products
    : products.filter((p) => p.category === selectedCategory);

  const createOrderMutation = useMutation({
    mutationFn: () =>
      createOrder(
        decodedTable,
        cart,
        selectedCustomer !== "walk-in" ? selectedCustomer : undefined
      ),
    onSuccess: () => {
      toast.success("Order pushed to kitchen!");
      setCart([]);
      queryClient.invalidateQueries({ queryKey: ["pendingOrder"] });
      queryClient.invalidateQueries({ queryKey: ["pendingOrders"] });
      queryClient.invalidateQueries({ queryKey: ["todayStats"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["customerLedger"] });
    },
    onError: (error) => toast.error("Failed: " + error.message),
  });

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product_id: product.id, product_name: product.name, price: product.price, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => item.product_id === productId ? { ...item, quantity: item.quantity + delta } : item)
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-200/60"
      >
        <Link to="/tables">
          <Button variant="ghost" size="icon" className="hover:bg-gray-100 rounded-xl"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Store className="h-6 w-6 text-indigo-600" /> {decodedTable}
          </h1>
          <p className="text-sm text-gray-500 font-medium">Create or manage active order</p>
        </div>
      </motion.div>

      {/* Pending order */}
      <AnimatePresence>
      {pendingOrder && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }} 
          animate={{ opacity: 1, height: 'auto' }} 
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200/60 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ChefHat className="h-5 w-5 text-red-500" />
                <p className="font-bold text-red-800 text-lg">Active Order Pending</p>
              </div>
              <p className="text-sm text-red-700/80 font-medium">
                Bill Total: <span className="font-bold text-red-700">₹{pendingOrder.total_amount.toLocaleString("en-IN")}</span> • {pendingOrderDetails?.items?.length ?? 0} items
              </p>
              <div className="mt-2 text-xs text-red-600/80 font-mono">
                {pendingOrderDetails?.items?.slice(0, 3).map((item) => (
                  <span key={item.id} className="mr-3 bg-red-100/50 px-2 py-1 rounded">
                    {item.quantity}x {item.product_name}
                  </span>
                ))}
                {(pendingOrderDetails?.items?.length || 0) > 3 && <span>...</span>}
              </div>
            </div>
            <Button onClick={() => setShowPayment(true)} className="bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-md py-6 px-6 font-bold shadow-green-600/20 hover:scale-[1.02] transition-all shrink-0">
              <IndianRupee className="mr-2 h-5 w-5" /> Settle Bill
            </Button>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Products */}
        <div className="lg:col-span-8 space-y-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2 sticky top-4 bg-[#f8fafc]/80 backdrop-blur-md p-2 rounded-2xl z-10 border border-gray-200/50">
            {categories.map((cat) => (
              <Button 
                key={cat} 
                variant={selectedCategory === cat ? "default" : "outline"} 
                className={`rounded-xl transition-all ${selectedCategory === cat ? 'bg-indigo-600 shadow-md shadow-indigo-600/20 font-bold' : 'bg-white hover:bg-indigo-50 border-gray-200'}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </motion.div>
          
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
            {filteredProducts.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(idx * 0.05, 0.4) }}
              >
                <div 
                  className="bg-white border border-gray-200/60 rounded-2xl cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 hover:border-indigo-300 relative overflow-hidden group h-full flex flex-col"
                  onClick={() => addToCart(product)}
                >
                  <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity"><Coffee className="w-12 h-12" /></div>
                  <div className="p-4 flex flex-col items-center text-center gap-2 flex-grow justify-center relative z-10">
                    <p className="font-semibold text-gray-800 text-sm leading-tight">{product.name}</p>
                    <p className="text-xl font-black text-indigo-600">₹{product.price}</p>
                  </div>
                  <div className="bg-gray-50 border-t border-gray-100 p-2 text-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{product.category}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div className="lg:col-span-4 lg:sticky lg:top-4 relative z-20">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden flex flex-col h-[calc(100vh-8rem)] min-h-[400px]">
            <div className="bg-indigo-600 p-5 text-white flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl"><Receipt className="h-6 w-6" /></div>
              <div>
                <h2 className="text-lg font-bold">Current Order</h2>
                <p className="text-indigo-200 text-xs font-medium uppercase tracking-wider">{decodedTable}</p>
              </div>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto flex flex-col">
              {/* Customer selection */}
              <div className="mb-6">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Billed To</p>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger className="w-full rounded-xl border-gray-200 bg-gray-50 focus:ring-indigo-500 font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="walk-in" className="rounded-lg cursor-pointer font-medium text-gray-700">Walk-in Customer</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="rounded-lg cursor-pointer">
                        <span className="font-medium">{c.name}</span> <span className="text-gray-400 text-xs ml-1">{c.phone && `(${c.phone})`}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 opacity-60">
                    <Coffee className="h-16 w-16" />
                    <p className="text-sm font-medium">Tap items to add to order</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {cart.map((item) => (
                      <motion.div 
                        key={item.product_id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-center justify-between gap-3 bg-gray-50/80 border border-gray-100 p-3 rounded-2xl"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate leading-tight">{item.product_name}</p>
                          <p className="text-xs font-semibold text-indigo-600 mt-0.5">₹{item.price} <span className="text-gray-400 font-normal">ea</span></p>
                        </div>
                        <div className="flex items-center bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                          <button className="px-2.5 py-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors" onClick={() => updateQuantity(item.product_id, -1)}><Minus className="h-3.5 w-3.5" /></button>
                          <span className="w-6 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                          <button className="px-2.5 py-1.5 text-gray-500 hover:bg-green-50 hover:text-green-600 transition-colors" onClick={() => updateQuantity(item.product_id, 1)}><Plus className="h-3.5 w-3.5" /></button>
                        </div>
                        <p className="text-sm font-black text-gray-900 w-14 text-right">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-5 border-t border-gray-200/60">
              <div className="flex justify-between items-end mb-4">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Grand Total</span>
                <span className="text-3xl font-black text-indigo-600">₹{cartTotal.toLocaleString("en-IN")}</span>
              </div>
              <Button 
                className="w-full rounded-2xl h-14 text-lg font-bold shadow-lg shadow-indigo-600/20 hover:scale-[1.02] transition-all bg-indigo-600 hover:bg-indigo-700" 
                disabled={cart.length === 0 || createOrderMutation.isPending} 
                onClick={() => createOrderMutation.mutate()}
              >
                {createOrderMutation.isPending ? "Sending to Kitchen..." : "Confirm KOT Bill"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment dialog for pending order */}
      {pendingOrder && (
        <PaymentDialog
          open={showPayment}
          onOpenChange={setShowPayment}
          orderId={pendingOrder.id}
          orderAmount={pendingOrder.total_amount}
          customerId={pendingOrder.customer_id}
          tableName={decodedTable}
        />
      )}
    </div>
  );
}
