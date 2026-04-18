import React, { useState } from "react";
import { useSales } from "@/hooks/useAppData";
import { useInventory } from "@/hooks/useAppData";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, X, AlertCircle, Loader2, Download } from "lucide-react";

interface SaleItemForm {
  item_id: string;
  quantity: number;
  price: number;
}

export function SalesManager() {
  const { sales, loading, error, addSale, removeSale, refresh } = useSales();
  const { items: inventoryItems } = useInventory();
  const [showForm, setShowForm] = useState(false);
  const [saleItems, setSaleItems] = useState<SaleItemForm[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const handleAddItem = () => {
    if (inventoryItems.length === 0) return;
    setSaleItems([
      ...saleItems,
      {
        item_id: inventoryItems[0].id,
        quantity: 1,
        price: inventoryItems[0].price,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const handleCreateSale = async () => {
    if (saleItems.length === 0) {
      alert("Add at least one item");
      return;
    }

    setIsCreating(true);
    const result = await addSale(saleItems);
    setIsCreating(false);

    if (result) {
      setSaleItems([]);
      setShowForm(false);
    }
  };

  const handleDeleteSale = async (id: string) => {
    if (confirm("Delete this sale?")) {
      await removeSale(id);
    }
  };

  const totalAmount = saleItems.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0);

  const exportCSV = () => {
    const header = "Sale ID,Date,Items,Amount\n";
    const rows = sales
      .map((s) => {
        const itemCount = s.items?.length || 0;
        return `${s.id.slice(0, 8)},${new Date(s.date).toLocaleString()},${itemCount},${Number(s.total_amount).toFixed(2)}`;
      })
      .join("\n");

    const csv = header + rows;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-${new Date().getTime()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Sales</h1>
        <p className="text-gray-600">{sales.length} transactions | ₹{totalRevenue.toFixed(2)} total</p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"
        >
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </motion.div>
      )}

      {/* Controls */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Sale
        </button>
        <button
          onClick={exportCSV}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
        <button
          onClick={refresh}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {/* New Sale Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Create Sale</h2>
                <button onClick={() => setShowForm(false)} disabled={isCreating}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sale Items */}
              <div className="space-y-3 mb-4">
                {saleItems.map((saleItem, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 bg-gray-50 rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <select
                        value={saleItem.item_id}
                        onChange={(e) => {
                          const newItems = [...saleItems];
                          const selected = inventoryItems.find(
                            (i) => i.id === e.target.value
                          );
                          if (selected) {
                            newItems[idx] = {
                              ...newItems[idx],
                              item_id: e.target.value,
                              price: selected.price,
                            };
                            setSaleItems(newItems);
                          }
                        }}
                        disabled={isCreating}
                        className="flex-1 px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {inventoryItems.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.name} (₹{Number(i.price).toFixed(2)})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        disabled={isCreating}
                        className="ml-2 p-2 hover:bg-red-100 rounded text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-600">Qty</label>
                        <input
                          type="number"
                          value={saleItem.quantity}
                          onChange={(e) => {
                            const newItems = [...saleItems];
                            newItems[idx].quantity = Math.max(1, Number(e.target.value));
                            setSaleItems(newItems);
                          }}
                          disabled={isCreating}
                          className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Price</label>
                        <input
                          type="number"
                          value={saleItem.price}
                          onChange={(e) => {
                            const newItems = [...saleItems];
                            newItems[idx].price = Math.max(0, Number(e.target.value));
                            setSaleItems(newItems);
                          }}
                          disabled={isCreating}
                          step="0.01"
                          className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-gray-600">
                        Subtotal: ₹
                        {(saleItem.quantity * saleItem.price).toFixed(2)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Add Item Button */}
              <button
                onClick={handleAddItem}
                disabled={isCreating || inventoryItems.length === 0}
                className="w-full mb-4 py-2 border-2 border-dashed rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-medium"
              >
                + Add Item
              </button>

              {/* Total */}
              <div className="p-3 bg-blue-50 rounded-lg mb-4">
                <p className="text-xs text-gray-600 mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-blue-600">₹{totalAmount.toFixed(2)}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  disabled={isCreating}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSale}
                  disabled={isCreating || saleItems.length === 0}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isCreating ? "Creating..." : "Complete Sale"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sales Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : sales.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No sales recorded yet</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="text-left p-4 font-semibold">Sale ID</th>
                <th className="text-left p-4 font-semibold">Date</th>
                <th className="text-left p-4 font-semibold">Items</th>
                <th className="text-left p-4 font-semibold">Amount</th>
                <th className="text-left p-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale, idx) => (
                <motion.tr
                  key={sale.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="p-4 font-mono text-xs">#{sale.id.slice(0, 8)}</td>
                  <td className="p-4">{new Date(sale.date).toLocaleString()}</td>
                  <td className="p-4">{sale.items?.length || 0} items</td>
                  <td className="p-4 font-bold text-blue-600">
                    ₹{Number(sale.total_amount).toFixed(2)}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleDeleteSale(sale.id)}
                      className="p-2 hover:bg-red-100 rounded text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SalesManager;
