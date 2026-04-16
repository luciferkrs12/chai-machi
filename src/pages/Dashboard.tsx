import React from "react";
import { useNavigate } from "@tanstack/react-router";
import Layout from "@/components/Layout";
import { useData } from "@/contexts/DataContext";
import { motion } from "framer-motion";
import { IndianRupee, ShoppingCart, CreditCard, Clock, ReceiptText, BarChart3 } from "lucide-react";

const cardAnim = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const Dashboard: React.FC = () => {
  const { todaySales, todayOrders, paidAmount, pendingAmount } = useData();
  const navigate = useNavigate();

  const cards = [
    { label: "Today Sales", value: `₹${todaySales}`, icon: IndianRupee, color: "bg-primary" },
    { label: "Total Orders", value: todayOrders, icon: ShoppingCart, color: "bg-blue-500" },
    { label: "Paid Amount", value: `₹${paidAmount}`, icon: CreditCard, color: "bg-emerald-500" },
    { label: "Pending Amount", value: `₹${pendingAmount}`, icon: Clock, color: "bg-amber-500" },
  ];

  return (
    <Layout title="Dashboard">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            {...cardAnim}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -4 }}
            className="bg-card rounded-xl border p-5 flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-xl ${c.color} flex items-center justify-center`}>
              <c.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <p className="text-xl font-bold text-foreground">{c.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/tables")}
          className="bg-primary text-primary-foreground rounded-xl p-6 flex items-center gap-4"
        >
          <ReceiptText className="w-8 h-8" />
          <div className="text-left">
            <p className="font-bold text-lg">Start Billing</p>
            <p className="text-sm opacity-80">Select a table to begin</p>
          </div>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/reports")}
          className="bg-card border text-foreground rounded-xl p-6 flex items-center gap-4"
        >
          <BarChart3 className="w-8 h-8 text-primary" />
          <div className="text-left">
            <p className="font-bold text-lg">View Reports</p>
            <p className="text-sm text-muted-foreground">Sales analytics</p>
          </div>
        </motion.button>
      </div>
    </Layout>
  );
};

export default Dashboard;
