import React, { useState } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import InvoiceModal from "@/components/InvoiceModal";
import { Users, Search, FileText, PlusCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Banknote, Smartphone, CheckCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface SettleOrder {
  id: string;
  amount: number;
}

const Customers: React.FC = () => {
  const { user } = useAuth();
  const { customers, orders, addCustomer, payCredit } = useData();

  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerCollege, setNewCustomerCollege] = useState("");

  // Settle payment modal state
  const [settlingOrder, setSettlingOrder] = useState<SettleOrder | null>(null);
  const [settleMethod, setSettleMethod] = useState<"Cash" | "UPI" | null>(null);
  const [settleDone, setSettleDone] = useState(false);
  const [invoiceOrderId, setInvoiceOrderId] = useState<string | null>(null);
  const [invoiceMonth, setInvoiceMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const customerList = customers.map(c => {
    const cOrders = orders.filter(
      o => o.customer_name?.toLowerCase() === c.name.toLowerCase() && o.status === "Completed"
    );
    const totalOrdersAmount = cOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const paid = cOrders.filter(o => o.payment_method !== "Credit").reduce((sum, o) => sum + o.total_amount, 0);
    const pending = cOrders.filter(o => o.payment_method === "Credit").reduce((sum, o) => sum + o.total_amount, 0);
    return { ...c, totalOrdersAmount, paid, pending };
  });

  const totalPendingAmount = customerList.reduce((sum, c) => sum + c.pending, 0);
  const totalCollectedAmount = customerList.reduce((sum, c) => sum + c.paid, 0);

  const filteredCustomers = customerList.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(searchTerm)) ||
    (c.college && c.college.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddCustomerSubmit = () => {
    if (!newCustomerName.trim()) return;
    addCustomer(newCustomerName, newCustomerPhone, newCustomerCollege);
    setNewCustomerName("");
    setNewCustomerPhone("");
    setNewCustomerCollege("");
    setShowAddModal(false);
  };

  const handleSettleClick = (orderId: string, amount: number) => {
    setSettlingOrder({ id: orderId, amount });
    setSettleMethod(null);
    setSettleDone(false);
  };

  const handleConfirmSettle = () => {
    if (!settlingOrder || !settleMethod) return;
    payCredit(settlingOrder.id, settleMethod);
    setSettleDone(true);
  };

  const handleSettleClose = () => {
    setSettlingOrder(null);
    setSettleMethod(null);
    setSettleDone(false);
  };

  const selectedCustDetails = selectedCustomer
    ? customerList.find(c => c.name === selectedCustomer)
    : null;

  const selectedCustOrders = selectedCustDetails
    ? orders
        .filter(o => o.customer_name?.trim() === selectedCustDetails.name.trim() && o.status === "Completed")
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    : [];

  const invoiceOrder = invoiceOrderId ? orders.find(o => o.id === invoiceOrderId) : null;

  const selectedCustMonthlyOrders = selectedCustOrders.filter((o) => {
    const d = new Date(o.completed_at ?? o.created_at);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === invoiceMonth;
  });

  const downloadCustomerInvoice = () => {
    if (!selectedCustDetails) return;
    const invoiceRows = selectedCustMonthlyOrders.map((o) => {
      const items = o.items.map((i) => `${i.quantity}x ${i.product_name}`).join(" | ");
      return {
        orderId: o.id.slice(0, 8),
        date: new Date(o.completed_at ?? o.created_at).toLocaleDateString("en-IN"),
        payment: o.payment_method ?? "Walk-in",
        amount: o.total_amount,
        items,
      };
    });
    const total = selectedCustMonthlyOrders.reduce((sum, o) => sum + o.total_amount, 0);

    const content = `
      <html>
        <head>
          <title>Invoice - ${selectedCustDetails.name} - ${invoiceMonth}</title>
          <style>
            body { font-family: Inter, system-ui, sans-serif; margin: 0; padding: 32px; color: #111827; background: #fff; }
            .header { margin-bottom: 24px; }
            .topline { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
            h1 { font-size: 24px; margin: 0 0 8px; }
            .meta p { margin: 4px 0; color: #6b7280; }
            table { width: 100%; border-collapse: collapse; margin-top: 24px; }
            th, td { padding: 12px 10px; border: 1px solid #e5e7eb; }
            th { background: #f9fafb; text-align: left; color: #374151; }
            .total-row td { font-weight: 700; }
            .items { color: #374151; }
            .footer { margin-top: 32px; color: #6b7280; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="topline">
              <div>
                <h1>Monthly Invoice</h1>
                <div class="meta">
                  <p><strong>Customer:</strong> ${selectedCustDetails.name}</p>
                  <p><strong>Month:</strong> ${invoiceMonth}</p>
                  <p><strong>Phone:</strong> ${selectedCustDetails.phone || "—"}</p>
                </div>
              </div>
              <div>
                <p><strong>Total Orders:</strong> ${invoiceRows.length}</p>
                <p><strong>Total Amount:</strong> ₹${total}</p>
              </div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Payment</th>
                <th>Amount</th>
                <th>Items</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceRows
                .map(
                  (row) => `
                    <tr>
                      <td>${row.orderId}</td>
                      <td>${row.date}</td>
                      <td>${row.payment}</td>
                      <td>₹${row.amount}</td>
                      <td>${row.items}</td>
                    </tr>
                  `
                )
                .join("")}
              <tr class="total-row">
                <td colspan="3">Total</td>
                <td>₹${total}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
          <div class="footer">
            <p>This invoice is generated for the selected monthly sales summary.</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const upiUrl = settlingOrder
    ? "upi://pay?pa=srivinayagabakes@upi&pn=Sri Vinayaga Bakes&am=" + settlingOrder.amount + "&cu=INR"
    : "";

  return (
    <Layout title="Customers" description="Credit ledger & payment tracking">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground font-semibold">Total Customers</p>
          <p className="mt-3 text-3xl font-bold text-foreground">{customers.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground font-semibold">Total Pending</p>
          <p className="mt-3 text-3xl font-bold text-destructive">₹{totalPendingAmount}</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground font-semibold">Total Collected</p>
          <p className="mt-3 text-3xl font-bold text-success">₹{totalCollectedAmount}</p>
        </div>
      </div>

      {/* Search + Add */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search customer..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg bg-card text-sm focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold text-sm hover:opacity-90 flex-shrink-0"
        >
          + Add Customer
        </button>
      </div>

      {/* Customers Table */}
      <div className="bg-card rounded-xl border overflow-hidden mb-6">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left font-semibold text-muted-foreground py-3 px-6">Customer</th>
              <th className="text-left font-semibold text-muted-foreground py-3 px-4">Phone</th>
              <th className="text-right font-semibold text-muted-foreground py-3 px-4">Total Orders</th>
              <th className="text-right font-semibold text-muted-foreground py-3 px-4 text-success">Paid</th>
              <th className="text-right font-semibold text-muted-foreground py-3 px-4 text-destructive">Pending</th>
              <th className="text-center font-semibold text-muted-foreground py-3 px-4">Status</th>
              <th className="text-center font-semibold text-muted-foreground py-3 px-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  No customers found
                </td>
              </tr>
            ) : filteredCustomers.map(customer => (
              <tr key={customer.id} className="border-b last:border-0 hover:bg-muted/20 transition">
                <td className="py-4 px-6">
                  <p className="font-semibold text-foreground">{customer.name}</p>
                  {customer.college && <p className="text-xs text-muted-foreground">{customer.college}</p>}
                </td>
                <td className="py-4 px-4 text-muted-foreground">{customer.phone || "—"}</td>
                <td className="py-4 px-4 text-right font-semibold">₹{customer.totalOrdersAmount}</td>
                <td className="py-4 px-4 text-right font-bold text-success">₹{customer.paid}</td>
                <td className="py-4 px-4 text-right font-bold text-destructive">₹{customer.pending}</td>
                <td className="py-4 px-4 text-center">
                  {customer.pending > 0 ? (
                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-destructive/10 text-destructive">Has Dues</span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-success/10 text-success">Cleared</span>
                  )}
                </td>
                <td className="py-4 px-4 text-center">
                  <button
                    onClick={() => setSelectedCustomer(customer.name)}
                    className="flex items-center gap-2 px-3 py-1.5 border rounded-lg hover:bg-muted/50 transition font-medium text-xs mx-auto"
                  >
                    View Ledger
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Customer Ledger Drawer */}
      <AnimatePresence>
        {selectedCustDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex justify-end"
            onClick={() => setSelectedCustomer(null)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-card w-full max-w-xl h-full overflow-y-auto shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-card z-10">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{selectedCustDetails.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedCustDetails.phone || "No phone"}
                    {selectedCustDetails.college ? " · " + selectedCustDetails.college : ""}
                  </p>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-muted rounded-lg transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 border rounded-xl text-center">
                    <p className="text-xs text-muted-foreground font-semibold">Total Purchases</p>
                    <p className="text-2xl font-bold mt-1">₹{selectedCustDetails.totalOrdersAmount}</p>
                  </div>
                  <div className="p-4 border rounded-xl text-center bg-success/5 border-success/20">
                    <p className="text-xs text-success font-semibold">Total Paid</p>
                    <p className="text-2xl font-bold text-success mt-1">₹{selectedCustDetails.paid}</p>
                  </div>
                  <div className="p-4 border rounded-xl text-center bg-destructive/5 border-destructive/20">
                    <p className="text-xs text-destructive font-semibold">Total Pending</p>
                    <p className="text-2xl font-bold text-destructive mt-1">₹{selectedCustDetails.pending}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-muted-foreground">Invoice Month</label>
                    <input
                      type="month"
                      value={invoiceMonth}
                      onChange={(e) => setInvoiceMonth(e.target.value)}
                      className="rounded-lg border bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <button
                    onClick={downloadCustomerInvoice}
                    disabled={selectedCustMonthlyOrders.length === 0}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
                  >
                    Download Monthly Invoice PDF
                  </button>
                </div>

                {/* Transaction History */}
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 border-b pb-2">
                  <FileText className="w-5 h-5 text-muted-foreground" /> Transaction History
                </h3>

                <div className="space-y-3">
                  {selectedCustOrders.length === 0 ? (
                    <div className="rounded-xl border py-10 text-center text-muted-foreground text-sm">
                      No completed transactions yet
                    </div>
                  ) : selectedCustOrders.map(o => {
                    const isCredit = o.payment_method === "Credit";
                    return (
                      <div
                        key={o.id}
                        className={isCredit
                          ? "rounded-xl border border-destructive/30 bg-destructive/5 overflow-hidden"
                          : "rounded-xl border bg-card overflow-hidden"}
                      >
                        <div className="flex items-center justify-between px-4 py-3 border-b">
                          <div>
                            <p className="text-xs text-muted-foreground font-mono">
                              #{o.id.substring(0, 8)}
                              {o.table_name === "Manual Entry" && (
                                <span className="ml-2 text-destructive font-semibold">[Manual]</span>
                              )}
                            </p>
                            <p className="text-sm font-semibold text-foreground">
                              {new Date(o.completed_at ?? o.created_at).toLocaleString("en-IN", {
                                day: "2-digit", month: "short", year: "numeric",
                                hour: "2-digit", minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="text-lg font-bold text-foreground">₹{o.total_amount}</p>
                            <button
                              onClick={() => setInvoiceOrderId(o.id)}
                              className="px-3 py-1 rounded-full border border-primary/20 text-xs font-semibold text-primary hover:bg-primary/5 transition"
                            >
                              Invoice
                            </button>
                            {isCredit ? (
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-destructive/10 text-destructive">
                                  Unpaid
                                </span>
                                <button
                                  onClick={() => handleSettleClick(o.id, o.total_amount)}
                                  className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full hover:opacity-90 transition"
                                >
                                  Settle
                                </button>
                              </div>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs font-bold bg-success/10 text-success">
                                Paid · {o.payment_method}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="px-4 py-2 divide-y divide-border/50">
                          {o.items.map(item => (
                            <div key={item.id} className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-primary bg-primary/10 rounded px-1.5 py-0.5">
                                  {item.quantity}x
                                </span>
                                <span className="text-sm text-foreground">{item.product_name}</span>
                              </div>
                              <span className="text-sm font-semibold text-foreground">₹{item.total}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settle Payment Modal */}
      <AnimatePresence>
        {settlingOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4"
            onClick={handleSettleClose}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-card rounded-2xl border w-full max-w-md p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {settleDone ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-2">Payment Received!</h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    ₹{settlingOrder.amount} collected via {settleMethod}
                  </p>
                  <button
                    onClick={handleSettleClose}
                    className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-bold text-lg text-foreground">Collect Payment</h3>
                      <p className="text-sm text-muted-foreground">Amount due: ₹{settlingOrder.amount}</p>
                    </div>
                    <button onClick={handleSettleClose}>
                      <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                      onClick={() => setSettleMethod("Cash")}
                      className={settleMethod === "Cash"
                        ? "p-4 rounded-xl border-2 border-primary bg-accent flex flex-col items-center gap-2 transition"
                        : "p-4 rounded-xl border-2 border-border flex flex-col items-center gap-2 transition hover:border-primary/50"}
                    >
                      <Banknote className="w-8 h-8 text-primary" />
                      <span className="font-semibold text-sm text-foreground">Cash</span>
                    </button>
                    <button
                      onClick={() => setSettleMethod("UPI")}
                      className={settleMethod === "UPI"
                        ? "p-4 rounded-xl border-2 border-primary bg-accent flex flex-col items-center gap-2 transition"
                        : "p-4 rounded-xl border-2 border-border flex flex-col items-center gap-2 transition hover:border-primary/50"}
                    >
                      <Smartphone className="w-8 h-8 text-primary" />
                      <span className="font-semibold text-sm text-foreground">UPI</span>
                    </button>
                  </div>

                  {settleMethod === "UPI" && (
                    <div className="flex flex-col items-center mb-6 p-4 rounded-xl bg-background border">
                      <QRCodeSVG value={upiUrl} size={180} />
                      <p className="text-xs text-muted-foreground mt-3 font-semibold">
                        Scan to pay ₹{settlingOrder.amount}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleConfirmSettle}
                    disabled={!settleMethod}
                    className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition disabled:opacity-50"
                  >
                    Confirm Payment — ₹{settlingOrder.amount}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Entry Modal */}

      {/* Add Customer Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex py-10 justify-center items-center"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              onClick={e => e.stopPropagation()}
              className="bg-card w-full max-w-md rounded-xl shadow-2xl p-6 border"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Add Customer</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-muted rounded-lg transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Customer Name *</label>
                  <input
                    value={newCustomerName}
                    onChange={e => setNewCustomerName(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 outline-none"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Phone Number</label>
                  <input
                    value={newCustomerPhone}
                    onChange={e => setNewCustomerPhone(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 outline-none"
                    placeholder="Enter phone"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">College / Notes</label>
                  <input
                    value={newCustomerCollege}
                    onChange={e => setNewCustomerCollege(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 outline-none"
                    placeholder="Enter college or notes"
                  />
                </div>
                <button
                  onClick={handleAddCustomerSubmit}
                  disabled={!newCustomerName.trim()}
                  className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:opacity-90 disabled:opacity-50 mt-2"
                >
                  Save Customer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {invoiceOrder && (
        <InvoiceModal order={invoiceOrder} onClose={() => setInvoiceOrderId(null)} />
      )}
    </Layout>
  );
};

export default Customers;
