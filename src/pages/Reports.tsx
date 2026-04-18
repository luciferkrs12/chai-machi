import React, { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useData } from "@/contexts/DataContext";

const Reports: React.FC = () => {
  const { orders, products } = useData();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const completedOrders = useMemo(
    () => orders.filter((o) => o.status === "Completed"),
    [orders]
  );

  const filteredSales = useMemo(() => {
    const [year, monthValue] = month.split("-").map(Number);
    return completedOrders.filter((o) => {
      const d = new Date(o.completed_at ?? o.created_at);
      return d.getFullYear() === year && d.getMonth() + 1 === monthValue;
    });
  }, [completedOrders, month]);

  const totalRevenue = filteredSales.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const totalOrders = filteredSales.length;
  const avgOrder = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;
  const itemsSold = filteredSales.reduce((sum, o) => {
    return sum + o.items.reduce((s: number, i: any) => s + (i?.quantity || 0), 0);
  }, 0);

  const chartData = useMemo(() => {
    const [year, monthValue] = month.split("-").map(Number);
    const days = new Date(year, monthValue, 0).getDate();
    const data = Array.from({ length: days }, (_, idx) => ({ day: idx + 1, sales: 0 }));
    filteredSales.forEach((o) => {
      const d = new Date(o.completed_at ?? o.created_at);
      const dayIndex = d.getDate() - 1;
      if (dayIndex >= 0 && dayIndex < data.length) data[dayIndex].sales += o.total_amount || 0;
    });
    return data;
  }, [filteredSales, month]);

  const productPerformance = useMemo(() => {
    const counts = filteredSales.reduce((acc, o) => {
      (o.items || []).forEach((item: any) => {
        const key = item.product_id || item.item_id || item.product_name || "unknown";
        acc[key] = (acc[key] || 0) + (item.quantity || 0);
      });
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts)
      .map(([id, quantity]) => ({
        id,
        name: products.find((p) => p.id === id)?.name || id,
        quantity,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [filteredSales, products]);

  return (
    <Layout title="Reports">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-xl font-semibold text-foreground">Sales & Product Analytics</h1>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-lg border bg-card px-4 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
        />
      </div>



      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {[
          { label: "Revenue", value: `₹${totalRevenue.toFixed(2)}` },
          { label: "Orders", value: totalOrders },
          { label: "Items Sold", value: itemsSold },
        ].map((metric) => (
          <div key={metric.label} className="rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{metric.label}</p>
            <p className="text-2xl font-bold text-foreground">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[2fr,1fr] mb-8">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-lg font-semibold text-foreground mb-4">Daily Sales</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-lg font-semibold text-foreground mb-4">Top Products</h3>
          <div className="space-y-3">
            {productPerformance.length === 0 ? (
              <p className="text-sm text-muted-foreground">No product sales found this month.</p>
            ) : (
              productPerformance.map((product) => (
                <div key={product.id} className="rounded-2xl border bg-background p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">Sold units</p>
                    </div>
                    <span className="text-sm font-bold text-foreground">{product.quantity}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
