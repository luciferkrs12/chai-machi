import React, { useState, useEffect, useMemo } from "react";
import Layout from "@/components/Layout";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { getAllSales } from "@/lib/sales";
import { getAllInventory } from "@/lib/inventory";

const Reports: React.FC = () => {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");
      const [salesResult, inventoryResult] = await Promise.all([getAllSales(), getAllInventory()]);

      if (salesResult.error) {
        setError(salesResult.error);
      } else {
        setSales(salesResult.sales || []);
      }

      if (inventoryResult.error) {
        setError((prev) => prev || inventoryResult.error);
      } else {
        setProducts(inventoryResult.items || []);
      }

      setLoading(false);
    };

    loadData();
  }, []);

  const completedSales = useMemo(
    () => sales.filter((sale) => sale.total_amount >= 0),
    [sales]
  );

  const filteredSales = useMemo(() => {
    const [year, monthValue] = month.split("-").map(Number);
    return completedSales.filter((sale) => {
      const saleDate = new Date(sale.date);
      return saleDate.getFullYear() === year && saleDate.getMonth() + 1 === monthValue;
    });
  }, [completedSales, month]);

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  const totalOrders = filteredSales.length;
  const avgOrder = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;
  const itemsSold = filteredSales.reduce((sum, sale) => {
    return sum + (sale.items?.reduce((subSum: number, item: any) => subSum + (item?.quantity || 0), 0) || 0);
  }, 0);

  const chartData = useMemo(() => {
    const [year, monthValue] = month.split("-").map(Number);
    const days = new Date(year, monthValue, 0).getDate();
    const data = Array.from({ length: days }, (_, idx) => ({ day: idx + 1, sales: 0 }));

    filteredSales.forEach((sale) => {
      const saleDate = new Date(sale.date);
      const dayIndex = saleDate.getDate() - 1;
      if (dayIndex >= 0 && dayIndex < data.length) {
        data[dayIndex].sales += sale.total_amount || 0;
      }
    });

    return data;
  }, [filteredSales, month]);

  const productPerformance = useMemo(() => {
    const counts = filteredSales.reduce((acc, sale) => {
      (sale.items || []).forEach((item: any) => {
        const key = item.item_id || item.product_id || "unknown";
        acc[key] = (acc[key] || 0) + (item.quantity || 0);
      });
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([id, quantity]) => ({
        id,
        name: products.find((p) => p.id === id)?.name || "Unknown product",
        quantity,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [filteredSales, products]);

  if (loading) {
    return (
      <Layout title="Reports">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

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

      {error && (
        <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

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
