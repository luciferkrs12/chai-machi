import React, { useState } from "react";
import Layout from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { motion } from "framer-motion";
import { Search, Trash2, Download, ShoppingBag } from "lucide-react";

const OrdersPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { orders, deleteOrder } = useData();
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Only show completed orders (past sales)
  const completedOrders = orders
    .filter((o) => o.status === "Completed")
    .sort(
      (a, b) =>
        new Date(b.completed_at ?? b.created_at).getTime() -
        new Date(a.completed_at ?? a.created_at).getTime()
    );

  const dateFilteredOrders = completedOrders.filter((o) => {
    const orderDate = new Date(o.completed_at ?? o.created_at);
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59`) : null;
    if (start && orderDate < start) return false;
    if (end && orderDate > end) return false;
    return true;
  });

  const filteredOrders = dateFilteredOrders.filter(
    (o) =>
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      (o.customer_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      o.table_name.toLowerCase().includes(search.toLowerCase()) ||
      o.total_amount.toString().includes(search)
  );

  const totalRevenue = filteredOrders.reduce((s, o) => s + o.total_amount, 0);
  const totalItemsSold = filteredOrders.reduce(
    (s, o) => s + o.items.reduce((is, i) => is + i.quantity, 0),
    0
  );

  const exportExcel = () => {
    const header = "Order ID,Date,Table,Customer,Items,Amount,Payment\n";
    const rows = filteredOrders
      .map((o) => {
        const items = o.items.map((i) => `${i.quantity}x ${i.product_name}`).join(" | ");
        return `${o.id.slice(0, 8)},${new Date(o.completed_at ?? o.created_at).toLocaleString()},${o.table_name},${o.customer_name ?? "Walk-in"},"${items}",${o.total_amount},${o.payment_method ?? ""}`;
      })
      .join("\n");
    const blob = new Blob([header + rows], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-${Date.now()}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ProtectedRoute>
      <Layout title="Sales & Orders">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-muted-foreground text-sm">{filteredOrders.length} orders</p>
            <p className="text-sm text-foreground font-semibold">
              Total Revenue: ₹{totalRevenue.toLocaleString()}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="text-sm text-muted-foreground">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={() => { setStartDate(""); setEndDate(""); }}
              className="rounded-lg border px-3 py-2 text-sm text-foreground hover:bg-muted transition"
            >
              Clear
            </button>
            <button
              onClick={exportExcel}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-card border text-foreground text-sm font-semibold hover:bg-muted transition"
            >
              <Download className="w-4 h-4" /> Export Excel
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Orders", value: filteredOrders.length },
            { label: "Items Sold", value: totalItemsSold },
            { label: "Revenue", value: `₹${totalRevenue.toLocaleString()}` },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-xl border p-4"
            >
              <p className="text-muted-foreground text-xs font-medium mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID, customer, table or amount..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border bg-card text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Orders Table */}
        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-semibold text-muted-foreground">Order ID</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">Date</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">Table</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">Customer</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">Items</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">Amount</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">Payment</th>
                  {isAdmin && <th className="text-left p-4 font-semibold text-muted-foreground">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, i) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b last:border-0 hover:bg-muted/30 transition"
                  >
                    <td className="p-4 font-mono text-xs text-foreground">#{order.id.slice(0, 8)}</td>
                    <td className="p-4 text-foreground">
                      {new Date(order.completed_at ?? order.created_at).toLocaleString("en-IN", {
                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="p-4 text-foreground">{order.table_name}</td>
                    <td className="p-4 text-foreground">{order.customer_name || <span className="text-muted-foreground">Walk-in</span>}</td>
                    <td className="p-4 text-foreground">
                      <div className="space-y-0.5">
                        {order.items.map((item) => (
                          <p key={item.id} className="text-xs text-muted-foreground">
                            {item.quantity}× {item.product_name}
                          </p>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-foreground">₹{order.total_amount}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        order.payment_method === "Credit"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-success/10 text-success"
                      }`}>
                        {order.payment_method ?? "—"}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="p-4">
                        <button
                          onClick={() => deleteOrder(order.id)}
                          className="p-1.5 rounded hover:bg-destructive/10 transition"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </td>
                    )}
                  </motion.tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 7} className="p-12 text-center text-muted-foreground">
                      <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      {search ? "No matching orders found" : "No completed orders yet"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default OrdersPage;
