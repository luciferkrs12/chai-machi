import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchMonthlyReport, exportToCSV } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, IndianRupee, ShoppingCart, CheckCircle, Clock, TrendingUp, BarChart as BarChartIcon } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
  head: () => ({
    meta: [
      { title: "Reports — Bakery Billing" },
      { name: "description", content: "Sales reports and analytics" },
    ],
  }),
});

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function ReportsPage() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth().toString());

  const { data: report, isLoading } = useQuery({
    queryKey: ["monthlyReport", selectedYear, selectedMonth],
    queryFn: () => fetchMonthlyReport(parseInt(selectedYear), parseInt(selectedMonth)),
  });

  const years = Array.from({ length: 5 }, (_, i) => (now.getFullYear() - i).toString());

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div 
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Analytics & Reports</h1>
          <p className="mt-2 text-sm text-gray-500">Track your bakery's daily and monthly performance metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white rounded-xl shadow-sm border border-gray-200/60 p-1">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[120px] border-0 focus:ring-0 shadow-none font-semibold text-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {MONTHS.map((month, i) => (
                  <SelectItem key={i} value={i.toString()} className="rounded-lg cursor-pointer">{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="w-[1px] bg-gray-200 my-2 mx-1"></div>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[90px] border-0 focus:ring-0 shadow-none font-semibold text-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {years.map((year) => (
                  <SelectItem key={year} value={year} className="rounded-lg cursor-pointer">{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {report && (
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/20 hover:scale-[1.02] transition-all"
              onClick={() => exportToCSV(report.orders, `report-${selectedYear}-${parseInt(selectedMonth) + 1}.csv`)}
            >
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          )}
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-semibold text-gray-500">Compiling Report Analytics...</p>
        </div>
      ) : report ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="space-y-6">
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity"><IndianRupee className="w-24 h-24" /></div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest relative z-10">Total Revenue</p>
              <p className="text-3xl font-black mt-2 text-indigo-600 relative z-10">₹{report.totalSales.toLocaleString("en-IN")}</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity"><ShoppingCart className="w-24 h-24" /></div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest relative z-10">Total Orders</p>
              <p className="text-3xl font-black mt-2 text-blue-600 relative z-10">{report.totalOrders}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-green-600"><CheckCircle className="w-24 h-24" /></div>
              <p className="text-sm font-bold text-green-800/80 uppercase tracking-widest relative z-10">Amount Collected</p>
              <p className="text-3xl font-black mt-2 text-green-600 relative z-10">₹{report.paidAmount.toLocaleString("en-IN")}</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 border border-red-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-red-600"><Clock className="w-24 h-24" /></div>
              <p className="text-sm font-bold text-red-800/80 uppercase tracking-widest relative z-10">Pending Payment</p>
              <p className="text-3xl font-black mt-2 text-red-600 relative z-10">₹{report.pendingAmount.toLocaleString("en-IN")}</p>
            </div>
          </div>

          {/* Daily chart */}
          {report.dailyBreakdown.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-gray-200/60 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600"><TrendingUp className="h-5 w-5" /></div>
                <h3 className="text-lg font-bold text-gray-900">Revenue Over Time</h3>
              </div>
              <div className="w-full h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.dailyBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="date" tickFormatter={(v) => format(new Date(v), "dd")} axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                    <Tooltip
                      cursor={{fill: '#F3F4F6'}}
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'}}
                      formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`, "Daily Revenue"]}
                      labelFormatter={(label) => format(new Date(label), "dd MMM yyyy")}
                    />
                    <Bar dataKey="sales" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={maxBarSize(report.dailyBreakdown.length)} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Top selling products */}
            {report.topProducts.length > 0 && (
              <div className="lg:col-span-1 bg-white rounded-3xl border border-gray-200/60 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-gray-100 flex items-center gap-2">
                  <div className="bg-amber-100 p-2 rounded-xl text-amber-600"><BarChartIcon className="h-5 w-5" /></div>
                  <h3 className="text-lg font-bold text-gray-900">Top Sellers</h3>
                </div>
                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Item</th>
                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-center">Qty</th>
                        <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">Rev</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm">
                      {report.topProducts.map((product, i) => (
                        <tr key={product.name} className="hover:bg-gray-50/50">
                          <td className="p-4 font-bold text-gray-800">
                            <span className="text-gray-400 mr-2 text-xs">#{i+1}</span>
                            {product.name}
                          </td>
                          <td className="p-4 text-center font-semibold text-gray-600">{product.quantity}</td>
                          <td className="p-4 font-bold text-indigo-600 text-right">₹{product.revenue.toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* All orders table */}
            <div className={`${report.topProducts.length > 0 ? "lg:col-span-2" : "col-span-full"} bg-white rounded-3xl border border-gray-200/60 shadow-sm overflow-hidden flex flex-col`}>
              <div className="p-5 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Full Month Ledger</h3>
              </div>
              <div className="flex-1 overflow-x-auto max-h-[500px]">
                <table className="w-full min-w-max text-left">
                  <thead className="bg-gray-50 sticky top-0 shadow-sm">
                    <tr>
                      <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase">Order ID</th>
                      <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase">Table</th>
                      <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Net Amount</th>
                      <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-5 py-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {report.orders.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-12 text-gray-400">No orders logged this month</td></tr>
                    ) : (
                      report.orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50/50">
                          <td className="px-5 py-4 font-mono font-medium text-gray-500">{order.id.slice(0, 8)}...</td>
                          <td className="px-5 py-4 font-bold text-gray-800">{order.table_name}</td>
                          <td className="px-5 py-4 font-black text-gray-900 text-right">₹{order.total_amount.toLocaleString("en-IN")}</td>
                          <td className="px-5 py-4">
                            <span className={`px-2.5 py-1 text-[11px] font-black uppercase tracking-wider rounded-md ${order.payment_status === "Paid" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                              {order.payment_status}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-medium text-gray-500">
                            {format(new Date(order.created_at), "dd MMM, HH:mm")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}

// Helper to scale bar width
function maxBarSize(dataLength: number) {
  if (dataLength < 7) return 60;
  if (dataLength < 15) return 40;
  return 20;
}
