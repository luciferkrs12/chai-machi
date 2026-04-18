import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Trash2,
  Plus,
  X,
  Download,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { getAllSales, createSale, deleteSale } from "@/lib/sales";
import { getAllInventory } from "@/lib/inventory";
import { SaleWithItems, Sale } from "@/lib/sales";
import { InventoryItem } from "@/lib/supabase";

const OrdersPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [sales, setSales] = useState<SaleWithItems[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [isSavingSale, setIsSavingSale] = useState(false);
  const [saleItems, setSaleItems] = useState<
    Array<{
      item_id: string;
      quantity: number;
      price: number;
    }>
  >([]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError("");

    const { sales: salesData, error: salesError } = await getAllSales();
    const { items: invData, error: invError } = await getAllInventory();

    if (salesError) setError(salesError);
    if (invError) setError(invError);

    if (salesData) setSales(salesData);
    if (invData) setInventoryItems(invData);

    setIsLoading(false);
  };

  const handleAddItem = () => {
    if (inventoryItems.length === 0) return;

    const firstItem = inventoryItems[0];
    setSaleItems([
      ...saleItems,
      {
        item_id: firstItem.id,
        quantity: 1,
        price: Number(firstItem.price),
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const handleSaveNewSale = async () => {
    if (!user || saleItems.length === 0) {
      setError("Please add at least one item");
      return;
    }

    setIsSavingSale(true);
    setError("");

    const { sale, error: saleError } = await createSale(user.id, saleItems);

    if (saleError) {
      setError(saleError);
      setIsSavingSale(false);
      return;
    }

    // Reload sales data
    await loadData();
    setSaleItems([]);
    setShowNewSaleModal(false);
    setIsSavingSale(false);
  };

  const handleDeleteSale = async (saleId: string) => {
    if (!window.confirm("Are you sure you want to delete this sale?")) {
      return;
    }

    setError("");
    const { success, error: delError } = await deleteSale(saleId);

    if (delError) {
      setError(delError);
      return;
    }

    if (success) {
      setSales(sales.filter((s) => s.id !== saleId));
    }
  };

  const filteredSales = sales.filter(
    (s) =>
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.total_amount.toString().includes(search)
  );

  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total_amount, 0);
  const totalSales = filteredSales.length;
  const totalItemsSold = filteredSales.reduce(
    (sum, s) => sum + (s.items?.reduce((isum, i) => isum + i.quantity, 0) || 0),
    0
  );

  const exportCSV = () => {
    const header = "Sale ID,Date,Items,Amount\n";
    const rows = filteredSales
      .map((s) => {
        const itemNames = s.items?.map((i) => `${i.quantity}x`).join(", ") || "";
        return `${s.id.slice(0, 8)},${new Date(s.date).toLocaleString()},${itemNames},${Number(s.total_amount).toFixed(2)}`;
      })
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-${new Date().getTime()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Layout title="Sales">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <ProtectedRoute>
      <Layout title="Sales & Orders">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-muted-foreground text-sm">{totalSales} sales</p>
            <p className="text-sm text-foreground font-semibold">
              Total Revenue: ₹{totalRevenue.toFixed(2)}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {user && (
              <button
                onClick={() => {
                  setSaleItems([]);
                  setShowNewSaleModal(true);
                  setError("");
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition"
              >
                <Plus className="w-4 h-4" /> New Sale
              </button>
            )}
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-card border text-foreground text-sm font-semibold hover:bg-muted transition"
            >
              <Download className="w-4 h-4" /> CSV
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border p-4"
          >
            <p className="text-muted-foreground text-xs font-medium mb-1">
              Total Sales
            </p>
            <p className="text-2xl font-bold text-foreground">{totalSales}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-card rounded-xl border p-4"
          >
            <p className="text-muted-foreground text-xs font-medium mb-1">
              Items Sold
            </p>
            <p className="text-2xl font-bold text-foreground">{totalItemsSold}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl border p-4"
          >
            <p className="text-muted-foreground text-xs font-medium mb-1">
              Revenue
            </p>
            <p className="text-2xl font-bold text-foreground">
              ₹{totalRevenue.toFixed(0)}
            </p>
          </motion.div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by sale ID or amount..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border bg-card text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-semibold text-muted-foreground">
                    Sale ID
                  </th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">
                    Date
                  </th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">
                    Items
                  </th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">
                    Amount
                  </th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale, i) => (
                  <motion.tr
                    key={sale.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b last:border-0 hover:bg-muted/30 transition"
                  >
                    <td className="p-4 font-mono text-xs text-foreground">
                      #{sale.id.slice(0, 8)}
                    </td>
                    <td className="p-4 text-foreground">
                      {new Date(sale.date).toLocaleString()}
                    </td>
                    <td className="p-4 text-foreground">
                      {sale.items?.length || 0} item(s)
                    </td>
                    <td className="p-4 font-bold text-foreground">
                      ₹{Number(sale.total_amount).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteSale(sale.id)}
                            className="p-1.5 rounded hover:bg-destructive/10 transition"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {filteredSales.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      {search ? "No sales found" : "No sales recorded yet"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* New Sale Modal */}
        <AnimatePresence>
          {showNewSaleModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowNewSaleModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-card rounded-xl border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-foreground text-lg">New Sale</h3>
                  <button onClick={() => setShowNewSaleModal(false)} disabled={isSavingSale}>
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded text-xs flex items-center gap-2">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {/* Items */}
                <div className="space-y-3 mb-4">
                  {saleItems.map((saleItem, idx) => {
                    const item = inventoryItems.find((i) => i.id === saleItem.item_id);
                    return (
                      <div
                        key={idx}
                        className="p-3 bg-muted rounded-lg space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <select
                            value={saleItem.item_id}
                            onChange={(e) => {
                              const newItems = [...saleItems];
                              const selectedItem = inventoryItems.find(
                                (i) => i.id === e.target.value
                              );
                              if (selectedItem) {
                                newItems[idx] = {
                                  ...newItems[idx],
                                  item_id: e.target.value,
                                  price: Number(selectedItem.price),
                                };
                                setSaleItems(newItems);
                              }
                            }}
                            disabled={isSavingSale}
                            className="flex-1 px-3 py-2 rounded bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                          >
                            {inventoryItems.map((i) => (
                              <option key={i.id} value={i.id}>
                                {i.name} (₹{Number(i.price).toFixed(2)})
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleRemoveItem(idx)}
                            disabled={isSavingSale}
                            className="ml-2 p-1.5 rounded hover:bg-destructive/10 transition disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground">
                              Qty
                            </label>
                            <input
                              type="number"
                              value={saleItem.quantity}
                              onChange={(e) => {
                                const newItems = [...saleItems];
                                newItems[idx] = {
                                  ...newItems[idx],
                                  quantity: Math.max(1, Number(e.target.value)),
                                };
                                setSaleItems(newItems);
                              }}
                              disabled={isSavingSale}
                              className="w-full px-3 py-2 rounded bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">
                              Price (₹)
                            </label>
                            <input
                              type="number"
                              value={saleItem.price}
                              onChange={(e) => {
                                const newItems = [...saleItems];
                                newItems[idx] = {
                                  ...newItems[idx],
                                  price: Math.max(0, Number(e.target.value)),
                                };
                                setSaleItems(newItems);
                              }}
                              disabled={isSavingSale}
                              step="0.01"
                              className="w-full px-3 py-2 rounded bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                            />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            Subtotal: ₹
                            {(saleItem.quantity * saleItem.price).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Item Button */}
                <button
                  onClick={handleAddItem}
                  disabled={isSavingSale || inventoryItems.length === 0}
                  className="w-full mb-4 py-2 rounded-lg border-2 border-dashed text-foreground text-sm font-medium hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Add Item
                </button>

                {/* Total */}
                <div className="p-3 bg-muted rounded-lg mb-4">
                  <p className="text-muted-foreground text-xs mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-foreground">
                    ₹
                    {saleItems
                      .reduce((sum, si) => sum + si.quantity * si.price, 0)
                      .toFixed(2)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowNewSaleModal(false)}
                    disabled={isSavingSale}
                    className="flex-1 py-2 rounded-lg border text-foreground hover:bg-muted transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNewSale}
                    disabled={isSavingSale || saleItems.length === 0}
                    className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSavingSale && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isSavingSale ? "Processing..." : "Complete Sale"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Layout>
    </ProtectedRoute>
  );
};

export default OrdersPage;
