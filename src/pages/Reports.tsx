import React, { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { useData } from "@/contexts/DataContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const Reports: React.FC = () => {
  const { orders } = useData();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const completed = useMemo(() => orders.filter(o => o.status === "Completed"), [orders]);

  const monthOrders = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    return completed.filter(o => {
      const d = new Date(o.completed_at || o.created_at);
      return d.getFullYear() === y && d.getMonth() + 1 === m;
    });
  }, [completed, month]);

  const totalSales = monthOrders.reduce((s, o) => s + o.total_amount, 0);
  const totalOrders = monthOrders.length;
  const avgOrder = totalOrders ? Math.round(totalSales / totalOrders) : 0;

  const chartData = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const days = new Date(y, m, 0).getDate();
    const data = Array.from({ length: days }, (_, i) => ({ day: i + 1, sales: 0 }));
    monthOrders.forEach(o => {
      const d = new Date(o.completed_at || o.created_at).getDate();
      data[d - 1].sales += o.total_amount;
    });
    return data;
  }, [monthOrders, month]);

  return (
    <Layout title="Reports">
      <div className="flex items-center gap-4 mb-6">
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="px-4 py-2 rounded-lg border bg-card text-foreground text-sm outline-none focus:ring-2 focus:ring-primary" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {[
          { label: "Total Sales", value: `₹${totalSales}` },
          { label: "Total Orders", value: totalOrders },
          { label: "Avg Order", value: `₹${avgOrder}` },
        ].map(c => (
          <div key={c.label} className="bg-card rounded-xl border p-5">
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className="text-2xl font-bold text-foreground">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border p-5">
        <h3 className="font-bold text-foreground mb-4">Daily Sales</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
            <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Layout>
  );
};

export default Reports;
