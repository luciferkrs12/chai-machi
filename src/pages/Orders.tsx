import React, { useState } from "react";
import Layout from "@/components/Layout";
import { useData } from "@/contexts/DataContext";
import PaymentModal from "@/components/PaymentModal";
import { motion } from "framer-motion";
import { Search, Trash2, CreditCard, Download } from "lucide-react";

const OrdersPage: React.FC = () => {
  const { orders, deleteOrder } = useData();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"All" | "Active" | "Completed">("All");
  const [payOrderId, setPayOrderId] = useState<string | null>(null);

  const filtered = orders
    .filter(o => filter === "All" || o.status === filter)
    .filter(o => o.table_name.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search) || (o.customer_name || "Walk-in").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const payOrder = orders.find(o => o.id === payOrderId);

  const exportCSV = () => {
    const header = "Order ID,Table,Customer,Amount,Payment,Status,Date\n";
    const rows = filtered.map(o =>
      `${o.id.slice(0, 8)},${o.table_name},${o.customer_name || "Walk-in"},${o.total_amount},${o.payment_method || "-"},${o.status},${new Date(o.created_at).toLocaleDateString()}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "orders.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout title="Orders">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..." className="w-full pl-9 pr-4 py-2 rounded-lg border bg-card text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="flex gap-2">
          {(["All", "Active", "Completed"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filter === f ? "bg-primary text-primary-foreground" : "bg-card border text-foreground hover:bg-muted"}`}>
              {f}
            </button>
          ))}
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border text-foreground text-xs font-semibold hover:bg-muted transition">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-semibold text-muted-foreground">Order ID</th>
                <th className="text-left p-4 font-semibold text-muted-foreground">Table</th>
                <th className="text-left p-4 font-semibold text-muted-foreground">Customer</th>
                <th className="text-left p-4 font-semibold text-muted-foreground">Amount</th>
                <th className="text-left p-4 font-semibold text-muted-foreground">Payment</th>
                <th className="text-left p-4 font-semibold text-muted-foreground">Status</th>
                <th className="text-left p-4 font-semibold text-muted-foreground">Date</th>
                <th className="text-left p-4 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o, i) => (
                <motion.tr key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b last:border-0 hover:bg-muted/30 transition">
                  <td className="p-4 font-mono text-xs text-foreground">#{o.id.slice(0, 8)}</td>
                  <td className="p-4 text-foreground">{o.table_name}</td>
                  <td className="p-4 text-foreground">{o.customer_name || "Walk-in"}</td>
                  <td className="p-4 font-bold text-foreground">₹{o.total_amount}</td>
                  <td className="p-4 text-foreground">{o.payment_method || "-"}</td>
                  <td className="p-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${o.status === "Active" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      {o.status === "Active" && (
                        <button onClick={() => setPayOrderId(o.id)} className="p-1.5 rounded hover:bg-primary/10 transition">
                          <CreditCard className="w-4 h-4 text-primary" />
                        </button>
                      )}
                      <button onClick={() => deleteOrder(o.id)} className="p-1.5 rounded hover:bg-destructive/10 transition">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No orders found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {payOrder && (
        <PaymentModal orderId={payOrder.id} amount={payOrder.total_amount} onClose={() => setPayOrderId(null)} />
      )}
    </Layout>
  );
};

export default OrdersPage;
