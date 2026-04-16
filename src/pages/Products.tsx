import React, { useState } from "react";
import Layout from "@/components/Layout";
import { useData, Product } from "@/contexts/DataContext";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, ToggleLeft, ToggleRight } from "lucide-react";

const ProductsPage: React.FC = () => {
  const { products, addProduct, editProduct, deleteProduct } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", price: "", category: "", customCategory: "" });

  const openAdd = () => { setForm({ name: "", price: "", category: "", customCategory: "" }); setEditId(null); setShowModal(true); };
  const openEdit = (p: Product) => { setForm({ name: p.name, price: String(p.price), category: p.category, customCategory: "" }); setEditId(p.id); setShowModal(true); };

  const handleSave = () => {
    const category = form.category === "Other" ? form.customCategory.trim() : form.category.trim();
    if (!form.name.trim() || !form.price || !category) return;
    if (editId) {
      editProduct(editId, { name: form.name.trim(), price: Number(form.price), category });
    } else {
      addProduct({ name: form.name.trim(), price: Number(form.price), category, active: true });
    }
    setShowModal(false);
  };

  const categories = [...new Set(products.map(p => p.category))];

  return (
    <Layout title="Products">
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted-foreground text-sm">{products.length} products</p>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {categories.map(cat => (
        <div key={cat} className="mb-6">
          <h3 className="font-bold text-foreground mb-3">{cat}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.filter(p => p.category === cat).map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`bg-card rounded-xl border p-4 ${!p.active ? "opacity-50" : ""}`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-foreground">{p.name}</h4>
                  <p className="font-bold text-primary">₹{p.price}</p>
                </div>
                <div className="flex items-center justify-between">
                  <button onClick={() => editProduct(p.id, { active: !p.active })} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition">
                    {p.active ? <ToggleRight className="w-5 h-5 text-success" /> : <ToggleLeft className="w-5 h-5" />}
                    {p.active ? "Active" : "Inactive"}
                  </button>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-muted transition"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    <button onClick={() => deleteProduct(p.id)} className="p-1.5 rounded hover:bg-destructive/10 transition"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card rounded-xl border p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground">{editId ? "Edit" : "Add"} Product</h3>
                <button onClick={() => setShowModal(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <div className="space-y-3">
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Product Name" className="w-full px-4 py-2.5 rounded-lg border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary" />
                <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="Price" type="number" className="w-full px-4 py-2.5 rounded-lg border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary" />
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Select category</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  <option value="Other">Other</option>
                </select>
                {form.category === "Other" && (
                  <input value={form.customCategory} onChange={e => setForm({ ...form, customCategory: e.target.value })} placeholder="Custom category" className="w-full px-4 py-2.5 rounded-lg border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary" />
                )}
              </div>
              <button onClick={handleSave} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm mt-4">Save</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default ProductsPage;
