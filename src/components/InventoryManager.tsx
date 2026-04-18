import React, { useState } from "react";
import { useInventory } from "@/hooks/useAppData";
import { InventoryItem } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, AlertCircle, Loader2 } from "lucide-react";

interface AddEditFormProps {
  item?: InventoryItem;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

function AddEditForm({ item, onSave, onCancel, isLoading }: AddEditFormProps) {
  const [form, setForm] = useState({
    name: item?.name || "",
    category: item?.category || "",
    price: item?.price || "",
    stock: item?.stock || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name.trim() || !form.category.trim() || !form.price || !form.stock) {
      alert("Please fill all fields");
      return;
    }

    await onSave({
      name: form.name.trim(),
      category: form.category.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Product Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          disabled={isLoading}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          placeholder="e.g., Chai Tea"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <input
          type="text"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          disabled={isLoading}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          placeholder="e.g., Beverages"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Price</label>
          <input
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            disabled={isLoading}
            step="0.01"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Stock</label>
          <input
            type="number"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            disabled={isLoading}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {item ? "Update" : "Add"}
        </button>
      </div>
    </form>
  );
}

export function InventoryManager() {
  const { items, loading, error, addItem, updateItem, deleteItem, search, refresh } = useInventory();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = async (data: any) => {
    setIsSaving(true);
    const result = await addItem(data);
    setIsSaving(false);
    if (result) {
      setShowForm(false);
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editingId) return;
    setIsSaving(true);
    const result = await updateItem(editingId, data);
    setIsSaving(false);
    if (result) {
      setEditingId(null);
      setEditingItem(undefined);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this item?")) {
      await deleteItem(id);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    await search(query);
  };

  const lowStockItems = items.filter((i) => i.stock < 10);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Inventory</h1>
        <p className="text-gray-600">{items.length} products</p>
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

      {lowStockItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
        >
          <p className="font-semibold text-yellow-900 mb-2">Low Stock Alert</p>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map((item) => (
              <span key={item.id} className="text-xs bg-yellow-200 text-yellow-900 px-2 py-1 rounded">
                {item.name} ({item.stock})
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Controls */}
      <div className="mb-6 flex gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search products..."
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setEditingItem(undefined);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
        <button
          onClick={refresh}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {(showForm || editingId) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => {
              setShowForm(false);
              setEditingId(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">
                  {editingId ? "Edit Product" : "Add Product"}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <AddEditForm
                item={editingItem}
                onSave={editingId ? handleUpdate : handleAdd}
                onCancel={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                isLoading={isSaving}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Items Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border rounded-lg p-4 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-gray-500">{item.category}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                  item.stock < 10
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}>
                  {item.stock}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-lg font-bold text-blue-600">₹{Number(item.price).toFixed(2)}</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      item.stock < 10 ? "bg-red-500" : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min((item.stock / 100) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingItem(item);
                    setEditingId(item.id);
                  }}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-sm font-medium flex items-center justify-center gap-1"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 text-sm font-medium flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default InventoryManager;
