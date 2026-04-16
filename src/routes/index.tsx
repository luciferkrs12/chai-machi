import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchTodayStats } from "@/lib/queries";
import { Card, CardContent } from "@/components/ui/card";
import { IndianRupee, ShoppingCart, CheckCircle, Clock, UtensilsCrossed, BarChart3, TrendingUp, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Dashboard — Chai Machi" },
      { name: "description", content: "Bakery billing dashboard with today's sales overview" },
    ],
  }),
});

function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["todayStats"],
    queryFn: fetchTodayStats,
    refetchInterval: 30000,
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const statCards = [
    {
      title: "Today's Sales",
      value: stats ? `₹${stats.totalSales.toLocaleString("en-IN")}` : "—",
      icon: IndianRupee,
      gradient: "from-blue-500 to-indigo-600",
      lightBg: "bg-blue-50",
      textColor: "text-blue-600",
      delay: 0.1
    },
    {
      title: "Total Orders",
      value: stats?.totalOrders?.toString() ?? "—",
      icon: ShoppingCart,
      gradient: "from-violet-500 to-purple-600",
      lightBg: "bg-violet-50",
      textColor: "text-violet-600",
      delay: 0.2
    },
    {
      title: "Paid Amount",
      value: stats ? `₹${stats.paidAmount.toLocaleString("en-IN")}` : "—",
      icon: CheckCircle,
      gradient: "from-emerald-500 to-teal-600",
      lightBg: "bg-emerald-50",
      textColor: "text-emerald-600",
      delay: 0.3
    },
    {
      title: "Pending Amount",
      value: stats ? `₹${stats.pendingAmount.toLocaleString("en-IN")}` : "—",
      icon: Clock,
      gradient: "from-amber-500 to-orange-600",
      lightBg: "bg-amber-50",
      textColor: "text-amber-600",
      delay: 0.4
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-medium mb-3">
            <Sparkles className="w-4 h-4" />
            <span>Store Status: Open</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            {getGreeting()}, Admin
          </h1>
          <p className="mt-2 text-slate-500 max-w-2xl text-base">
            Here's what's happening at Chai Machi today. Have a great shift!
          </p>
        </motion.div>
        
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }} 
           animate={{ opacity: 1, scale: 1 }} 
           transition={{ delay: 0.2 }}
        >
          <Link 
            to="/tables"
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
          >
            <UtensilsCrossed className="w-4 h-4" />
            New Order
          </Link>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
        {statCards.map((card) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: card.delay, duration: 0.4 }}
          >
            <div className="group relative bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-xl hover:border-slate-300 transition-all duration-300 ease-out z-10 overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              
              <div className="flex justify-between items-start mb-4">
                <p className="font-medium text-slate-500 text-sm">
                  {card.title}
                </p>
                <div className={`p-2.5 rounded-xl ${card.lightBg} group-hover:scale-110 transition-transform duration-300 ease-out`}>
                  <card.icon className={`w-5 h-5 ${card.textColor}`} />
                </div>
              </div>
              
              <div>
                {isLoading ? (
                  <div className="h-9 w-28 rounded bg-slate-100 animate-pulse" />
                ) : (
                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                    {card.value}
                  </h3>
                )}
                <p className="text-xs text-slate-400 mt-2 font-medium flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Live updates
                </p>
              </div>
              
              {/* Decorative background blur */}
              <div className={`absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-br ${card.gradient} blur-3xl opacity-0 group-hover:opacity-[0.08] transition-opacity duration-500 rounded-full pointer-events-none`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-10">
        <h2 className="text-lg font-bold text-slate-800 mb-4 px-1">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 lg:gap-6">
          <Link to="/tables" className="group block">
            <motion.div 
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-md shadow-indigo-200 group-hover:shadow-xl group-hover:shadow-indigo-300 transition-all duration-300 relative overflow-hidden h-full"
            >
              <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 group-hover:opacity-30 transition-all duration-500">
                <UtensilsCrossed className="w-24 h-24 -mr-6 -mt-6" />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
                  <UtensilsCrossed className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Start Billing</h3>
                <p className="text-indigo-100 text-sm max-w-[200px]">Select a table or create a quick order for walk-ins</p>
              </div>
            </motion.div>
          </Link>

          <Link to="/reports" className="group block">
            <motion.div 
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 h-full flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-1">View Reports</h3>
                <p className="text-slate-500 text-sm">Analyze sales, items sold, and daily closure reports</p>
              </div>
            </motion.div>
          </Link>

          <Link to="/orders" className="group block">
            <motion.div 
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:teal-100 transition-all duration-300 h-full flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-teal-100 transition-colors">
                  <TrendingUp className="w-6 h-6 text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-1">Manage Orders</h3>
                <p className="text-slate-500 text-sm">View past orders, print duplicate receipts, and handle refunds</p>
              </div>
            </motion.div>
          </Link>
        </div>
      </div>
    </div>
  );
}
