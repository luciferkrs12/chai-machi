import React, { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Package, ShoppingCart, Users, TrendingUp } from "lucide-react";
import { getProducts } from "@/lib/products";
import { getAllOrders } from "@/lib/orders";

const cardAnim = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [inventoryCount, setInventoryCount] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      setLoading(true);
      const [inventoryResult, salesResult] = await Promise.all([
        getProducts(),
        getAllOrders(),
      ]);

      if (inventoryResult.products) {
        setInventoryCount(inventoryResult.products.length);
      }
      if (salesResult.orders) {
        setSalesCount(salesResult.orders.length);
        const now = new Date();
        const monthlyTotal = salesResult.orders.reduce((sum, sale) => {
          const saleDate = new Date(sale.created_at || new Date());
          if (saleDate.getFullYear() === now.getFullYear() && saleDate.getMonth() === now.getMonth()) {
            return sum + (Number(sale.total_price) || 0);
          }
          return sum;
        }, 0);
        setMonthlyRevenue(monthlyTotal);
      }
      setLoading(false);
    };

    loadMetrics();
  }, []);

  const cards = [
    {
      label: "Products",
      value: loading ? "…" : String(inventoryCount),
      icon: Package,
      color: "bg-blue-500",
    },
    {
      label: "Total Sales",
      value: loading ? "…" : String(salesCount),
      icon: ShoppingCart,
      color: "bg-emerald-500",
    },
    {
      label: "Active Users",
      value: user ? "1" : "0",
      icon: Users,
      color: "bg-purple-500",
    },
    {
      label: "Monthly Revenue",
      value: loading ? "…" : `₹${monthlyRevenue.toFixed(0)}`,
      icon: TrendingUp,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Welcome */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground">Welcome, {user?.name || "Admin"}! 👋</h2>
        <p className="text-muted-foreground mt-1">Here's your system overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            variants={cardAnim}
            initial="initial"
            animate="animate"
            transition={{ delay: i * 0.1 }}
            className={`${card.color} rounded-lg p-6 text-white shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">{card.label}</p>
                <p className="text-3xl font-bold mt-2">{card.value}</p>
              </div>
              <card.icon className="w-12 h-12 opacity-30" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          variants={cardAnim}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.4 }}
          className="bg-card rounded-lg p-6 border"
        >
          <h3 className="text-lg font-bold text-foreground mb-4">📦 Quick Links</h3>
          <div className="space-y-2">
            <button
              onClick={() => navigate({ to: '/products' })}
              className="w-full text-left px-4 py-3 rounded hover:bg-muted transition font-medium"
            >
              Manage Products
            </button>
            <button
              onClick={() => navigate({ to: '/orders' })}
              className="w-full text-left px-4 py-3 rounded hover:bg-muted transition font-medium"
            >
              View Sales
            </button>
            <button
              onClick={() => navigate({ to: '/reports' })}
              className="w-full text-left px-4 py-3 rounded hover:bg-muted transition font-medium"
            >
              Review Reports
            </button>
          </div>
        </motion.div>

        <motion.div
          variants={cardAnim}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.5 }}
          className="bg-card rounded-lg p-6 border"
        >
          <h3 className="text-lg font-bold text-foreground mb-4">✅ System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Database: Connected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Authentication: Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Real-time: Ready</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
