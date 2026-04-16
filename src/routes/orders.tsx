import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchOrders, updatePaymentStatus, exportToCSV } from "@/lib/queries";
import type { Order } from "@/lib/queries";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search, IndianRupee, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { PaymentDialog } from "@/components/PaymentDialog";
import { motion } from "framer-motion";

export const Route = createFileRoute("/orders")({
  component: OrdersPage,
  head: () => ({
    meta: [
      { title: "Orders — Chai Machi" },
      { name: "description", content: "View and manage all bakery orders" },
    ],
  }),
});

function OrdersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);

  const getDateRange = () => {
    const now = new Date();
    if (dateFilter === "today") {
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      return { dateFrom: today.toISOString().split("T")[0], dateTo: today.toISOString().split("T")[0] };
    }
    if (dateFilter === "yesterday") {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return { dateFrom: yesterday.toISOString().split("T")[0], dateTo: yesterday.toISOString().split("T")[0] };
    }
    if (dateFilter === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return { dateFrom: weekAgo.toISOString().split("T")[0], dateTo: now.toISOString().split("T")[0] };
    }
    return {};
  };

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", search, statusFilter, dateFilter],
    queryFn: () => fetchOrders({ search, status: statusFilter, ...getDateRange() }),
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Title & Actions */}
      <motion.div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Order History</h1>
          <p className="mt-2 text-sm text-gray-500">Track and manage all customer purchases and outstanding payments.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => exportToCSV(orders, `orders-${new Date().toISOString().split("T")[0]}.csv`)}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 hover:text-indigo-600 text-gray-700 font-semibold rounded-xl shadow-sm transition-all"
        >
          <Download className="h-5 w-5" />
          Export CSV
        </motion.button>
      </motion.div>

      {/* Filters Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Search Orders</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Order ID, Table..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-full rounded-xl border-gray-200 focus-visible:ring-indigo-500 bg-gray-50/50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Payment Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full rounded-xl border-gray-200 focus:ring-indigo-500 bg-gray-50/50">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="rounded-lg hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer">All Status</SelectItem>
                  <SelectItem value="Pending" className="rounded-lg hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer">Pending</SelectItem>
                  <SelectItem value="Paid" className="rounded-lg hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Date Range</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full rounded-xl border-gray-200 focus:ring-indigo-500 bg-gray-50/50">
                  <SelectValue placeholder="All Dates" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="rounded-lg cursor-pointer">All Time</SelectItem>
                  <SelectItem value="today" className="rounded-lg cursor-pointer">Today</SelectItem>
                  <SelectItem value="yesterday" className="rounded-lg cursor-pointer">Yesterday</SelectItem>
                  <SelectItem value="week" className="rounded-lg cursor-pointer">Last 7 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Orders Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden flex flex-col">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-max text-left">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Order ID</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Table Source</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">Net Amount</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Method</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Date & Time</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center text-gray-400 gap-3">
                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm font-medium">Fetching orders...</p>
                      </div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16">
                      <div className="flex flex-col items-center justify-center text-gray-400 gap-3">
                        <FileText className="w-12 h-12 text-gray-300" />
                        <p className="text-base font-medium text-gray-500">No orders found</p>
                        <p className="text-sm">Try adjusting your filters or date range.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  orders.map((order, index) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(index * 0.05, 0.5) }}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors last:border-0"
                    >
                      <td className="px-6 py-4 text-sm font-mono text-gray-500">{order.id.slice(0, 8).toUpperCase()}...</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{order.table_name}</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                        <span className="bg-gray-100 text-gray-800 px-2.5 py-1 rounded-md border border-gray-200/50">
                          ₹{order.total_amount.toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold tracking-wide border border-gray-200/50">
                          {order.payment_method || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-bold tracking-wide transition-all border ${
                            order.payment_status === "Paid"
                              ? "bg-green-50 text-green-700 border-green-200/50"
                              : "bg-amber-50 text-amber-700 border-amber-200/50"
                          }`}
                        >
                          {order.payment_status === "Paid" ? "✓ PAID" : "⏳ PENDING"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-500">
                        {format(new Date(order.created_at), "dd MMM yy, HH:mm")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {order.payment_status === "Pending" ? (
                          <button
                            onClick={() => setPaymentOrder(order)}
                            className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-200 transition-all hover:scale-[1.02]"
                          >
                            Collect Pay
                          </button>
                        ) : (
                          <span className="inline-flex items-center px-4 py-2 text-xs font-bold text-gray-400 bg-gray-50 rounded-xl border border-gray-100 cursor-default">
                            Settled
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {paymentOrder && (
        <PaymentDialog
          open={!!paymentOrder}
          onOpenChange={(o) => !o && setPaymentOrder(null)}
          orderId={paymentOrder.id}
          orderAmount={paymentOrder.total_amount}
          customerId={paymentOrder.customer_id}
          tableName={paymentOrder.table_name}
        />
      )}
    </div>
  );
}
