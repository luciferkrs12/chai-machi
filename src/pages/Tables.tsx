import React, { useState } from "react";
import Layout from "@/components/Layout";
import { useData } from "@/contexts/DataContext";
import BillingModal from "@/components/BillingModal";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X } from "lucide-react";

const Tables: React.FC = () => {
  const { tables, orders, addTable, editTable, deleteTable } = useData();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [billingTableId, setBillingTableId] = useState<string | null>(null);

  const handleAdd = () => {
    if (newName.trim()) { addTable(newName.trim()); setNewName(""); setShowAdd(false); }
  };

  const handleEdit = () => {
    if (editId && editName.trim()) { editTable(editId, editName.trim()); setEditId(null); setEditName(""); }
  };

  const getActiveOrder = (tableId: string) =>
    orders.find(o => o.table_id === tableId && o.status === "Active" && o.total_amount > 0);

  return (
    <Layout title="Tables">
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted-foreground text-sm">{tables.length} tables</p>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition">
          <Plus className="w-4 h-4" /> Add Table
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {tables.map((t, i) => {
          const active = getActiveOrder(t.id);
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="bg-card rounded-xl border p-5 cursor-pointer relative group"
              onClick={() => setBillingTableId(t.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-foreground">{t.name}</h3>
                  {active?.customer_name && <p className="text-xs text-muted-foreground">Customer: {active.customer_name}</p>}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={e => { e.stopPropagation(); setEditId(t.id); setEditName(t.name); }}
                    className="p-1.5 rounded-lg hover:bg-muted transition"
                  >
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); deleteTable(t.id); }}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              </div>
              {active ? (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-destructive/10 text-destructive">Occupied</span>
                  <span className="text-sm font-bold text-foreground">₹{active.total_amount}</span>
                </div>
              ) : (
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-success/10 text-success">Available</span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card rounded-xl border p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground">Add Table</h3>
                <button onClick={() => setShowAdd(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Table Name" className="w-full px-4 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none mb-4" onKeyDown={e => e.key === "Enter" && handleAdd()} />
              <button onClick={handleAdd} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm">Add</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditId(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card rounded-xl border p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground">Edit Table</h3>
                <button onClick={() => setEditId(null)}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary outline-none mb-4" onKeyDown={e => e.key === "Enter" && handleEdit()} />
              <button onClick={handleEdit} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm">Save</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Billing */}
      {billingTableId && (
        <BillingModal tableId={billingTableId} onClose={() => setBillingTableId(null)} />
      )}
    </Layout>
  );
};

export default Tables;
