import React from "react";
import Layout from "@/components/Layout";
import { useData } from "@/contexts/DataContext";
import { Users } from "lucide-react";

const Customers: React.FC = () => {
  const { orders, customers } = useData();

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const todayString = new Date().toDateString();

  const customerStats = orders.reduce((acc, order) => {
    const name = order.customer_name?.trim() || "Walk-in";
    if (!acc[name]) acc[name] = { visits: 0, spent: 0 };
    acc[name].visits += 1;
    if (order.status === "Completed") acc[name].spent += order.total_amount;
    return acc;
  }, {} as Record<string, { visits: number; spent: number }>);

  const uniqueCustomers = Object.keys(customerStats).length;
  const customerRows = Object.entries(customerStats).sort(([, a], [, b]) => b.spent - a.spent);

  const monthlyPayment = orders
    .filter(o => {
      const d = new Date(o.created_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && o.status === "Completed";
    })
    .reduce((sum, o) => sum + o.total_amount, 0);

  const dailyOrders = orders.filter(o => new Date(o.created_at).toDateString() === todayString);

  const tableStats = orders.reduce((acc, o) => {
    if (!acc[o.table_name]) acc[o.table_name] = { visits: 0, spent: 0 };
    acc[o.table_name].visits++;
    if (o.status === "Completed") acc[o.table_name].spent += o.total_amount;
    return acc;
  }, {} as Record<string, { visits: number; spent: number }>);

  const recentOrders = [...orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <Layout title="Customers">
      {orders.length === 0 && customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Users className="w-16 h-16 mb-4" />
          <p className="text-lg font-medium">No customer activity yet</p>
          <p className="text-sm">Start taking orders to build customer history</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="rounded-3xl border bg-card p-6 shadow-sm">
              <p className="text-sm text-muted-foreground">Monthly Payment</p>
              <p className="mt-3 text-3xl font-bold text-foreground">₹{monthlyPayment}</p>
            </div>
            <div className="rounded-3xl border bg-card p-6 shadow-sm">
              <p className="text-sm text-muted-foreground">Today's Orders</p>
              <p className="mt-3 text-3xl font-bold text-foreground">{dailyOrders.length}</p>
            </div>
            <div className="rounded-3xl border bg-card p-6 shadow-sm">
              <p className="text-sm text-muted-foreground">Unique Customers</p>
              <p className="mt-3 text-3xl font-bold text-foreground">{uniqueCustomers}</p>
            </div>
          </div>

          <div className="bg-card rounded-xl border overflow-hidden mb-6">
            <div className="border-b p-4 bg-muted/50">
              <h3 className="font-bold text-foreground">Customer performance</h3>
              <p className="text-sm text-muted-foreground">Visits and spend per customer</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-semibold text-muted-foreground">Customer</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">Visits</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {customerRows.map(([name, stats]) => (
                  <tr key={name} className="border-b last:border-0 hover:bg-muted/30 transition">
                    <td className="p-4 font-medium text-foreground">{name}</td>
                    <td className="p-4 text-foreground">{stats.visits}</td>
                    <td className="p-4 font-bold text-foreground">₹{stats.spent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {customers.length > 0 && (
            <div className="bg-card rounded-xl border overflow-hidden mb-6">
              <div className="border-b p-4 bg-muted/50">
                <h3 className="font-bold text-foreground">Saved customers</h3>
                <p className="text-sm text-muted-foreground">Contacts saved in the system</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-semibold text-muted-foreground">Name</th>
                    <th className="text-left p-4 font-semibold text-muted-foreground">Phone</th>
                    <th className="text-left p-4 font-semibold text-muted-foreground">Visits</th>
                    <th className="text-left p-4 font-semibold text-muted-foreground">Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(customer => {
                    const customerOrders = orders.filter(o => o.customer_name?.trim() === customer.name.trim());
                    const visits = customerOrders.length;
                    const spent = customerOrders.filter(o => o.status === "Completed").reduce((sum, o) => sum + o.total_amount, 0);
                    return (
                      <tr key={customer.id} className="border-b last:border-0 hover:bg-muted/30 transition">
                        <td className="p-4 font-medium text-foreground">{customer.name}</td>
                        <td className="p-4 text-foreground">{customer.phone || "-"}</td>
                        <td className="p-4 text-foreground">{visits}</td>
                        <td className="p-4 font-bold text-foreground">₹{spent}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="bg-card rounded-xl border overflow-hidden">
            <div className="border-b p-4 bg-muted/50">
              <h3 className="font-bold text-foreground">Order history</h3>
              <p className="text-sm text-muted-foreground">Date-wise purchase details for all tables</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-semibold text-muted-foreground">Date</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">Table</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">Amount</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">Payment</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(o => (
                  <tr key={o.id} className="border-b last:border-0 hover:bg-muted/30 transition">
                    <td className="p-4 text-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="p-4 font-medium text-foreground">{o.table_name}</td>
                    <td className="p-4 font-bold text-foreground">₹{o.total_amount}</td>
                    <td className="p-4 text-muted-foreground">{o.payment_method || "-"}</td>
                    <td className="p-4"><span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${o.status === "Active" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Layout>
  );
};

export default Customers;
