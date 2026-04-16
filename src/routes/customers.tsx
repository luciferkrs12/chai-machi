import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCustomerLedger,
  createCustomer,
  fetchCustomerOrders,
  fetchCustomerPayments,
  createPayment,
  fetchSetting,
  type CustomerLedger,
} from "@/lib/customer-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Users, Plus, IndianRupee, Eye, Banknote, QrCode, CheckCircle, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/customers")({
  component: CustomersPage,
  head: () => ({
    meta: [
      { title: "Customers — Bakery Billing" },
      { name: "description", content: "Customer ledger and credit management" },
    ],
  }),
});

function CustomersPage() {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerLedger | null>(null);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customerLedger"],
    queryFn: fetchCustomerLedger,
  });

  const addCustomerMut = useMutation({
    mutationFn: () => createCustomer({ name: newName, phone: newPhone || undefined }),
    onSuccess: () => {
      toast.success("Customer added successfully!");
      queryClient.invalidateQueries({ queryKey: ["customerLedger"] });
      setShowAddDialog(false);
      setNewName("");
      setNewPhone("");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {selectedCustomer ? (
        <CustomerDetail customer={selectedCustomer} onBack={() => setSelectedCustomer(null)} />
      ) : (
        <>
          <motion.div 
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Customers</h1>
              <p className="mt-2 text-sm text-gray-500">Manage customer ledger, credit balances, and payments.</p>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200/50 transition-all hover:scale-[1.02]">
                  <Plus className="mr-2 h-4 w-4" /> Add Customer
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] rounded-2xl">
                <DialogHeader><DialogTitle className="text-xl font-bold text-gray-900">Add New Customer</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Name *</Label>
                    <Input className="rounded-xl border-gray-200 focus-visible:ring-indigo-500" placeholder="e.g. Rahul Kumar" value={newName} onChange={(e) => setNewName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Phone</Label>
                    <Input className="rounded-xl border-gray-200 focus-visible:ring-indigo-500" placeholder="e.g. 9876543210" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
                  </div>
                  <Button className="w-full rounded-xl bg-indigo-600 py-6 font-semibold" onClick={() => addCustomerMut.mutate()} disabled={!newName.trim() || addCustomerMut.isPending}>
                    {addCustomerMut.isPending ? "Adding..." : "Add Customer"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>

          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5"><Users className="w-24 h-24" /></div>
                <p className="text-sm font-semibold text-gray-500 relative z-10">Total Customers</p>
                <p className="text-3xl font-bold mt-2 relative z-10">{customers.length}</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 border border-red-100 shadow-sm flex flex-col justify-between h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-red-500"><IndianRupee className="w-24 h-24" /></div>
                <p className="text-sm font-semibold text-red-800/70 relative z-10">Total Pending Balance</p>
                <p className="text-3xl font-bold mt-2 text-red-600 relative z-10">₹{customers.reduce((s, c) => s + Math.max(0, c.pending), 0).toLocaleString("en-IN")}</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100 shadow-sm flex flex-col justify-between h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-green-500"><IndianRupee className="w-24 h-24" /></div>
                <p className="text-sm font-semibold text-green-800/70 relative z-10">Total Collected</p>
                <p className="text-3xl font-bold mt-2 text-green-600 relative z-10">₹{customers.reduce((s, c) => s + c.totalPaid, 0).toLocaleString("en-IN")}</p>
              </div>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden flex flex-col">
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-max text-left">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      <th className="px-6 py-4 text-sm font-semibold text-gray-600">Customer Name</th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-600">Phone</th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-600">Total Purchase</th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-600">Total Paid</th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-600">Pending Due</th>
                      <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan={7} className="text-center py-12"><div className="flex justify-center text-gray-400"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div></td></tr>
                    ) : customers.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-16 text-gray-500 text-sm">No customers recorded yet</td></tr>
                    ) : (
                      customers.map((c, idx) => (
                        <motion.tr 
                          key={c.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                          className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors last:border-0 group"
                        >
                          <td className="px-6 py-4 text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{c.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-500 font-mono tracking-wide">{c.phone || "—"}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-700">₹{c.totalOrders.toLocaleString("en-IN")}</td>
                          <td className="px-6 py-4 text-sm font-bold text-green-600">₹{c.totalPaid.toLocaleString("en-IN")}</td>
                          <td className="px-6 py-4 text-sm font-bold text-red-600">₹{Math.max(0, c.pending).toLocaleString("en-IN")}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${c.pending <= 0 ? "bg-green-50 text-green-700 border-green-200/50" : "bg-red-50 text-red-700 border-red-200/50"}`}>
                              {c.pending <= 0 ? "Settled" : "Due"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button size="sm" variant="ghost" className="text-secondary-foreground hover:bg-indigo-50 hover:text-indigo-700" onClick={() => setSelectedCustomer(c)}>
                              <Eye className="mr-1 h-3.5 w-3.5" /> Ledger
                            </Button>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}

function CustomerDetail({ customer, onBack }: { customer: CustomerLedger; onBack: () => void }) {
  const queryClient = useQueryClient();
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [payAmount, setPayAmount] = useState(Math.max(0, customer.pending).toString());
  const [payMethod, setPayMethod] = useState<"Cash" | "UPI">("Cash");

  const { data: orders = [] } = useQuery({
    queryKey: ["customerOrders", customer.id],
    queryFn: () => fetchCustomerOrders(customer.id),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["customerPayments", customer.id],
    queryFn: () => fetchCustomerPayments(customer.id),
  });

  const { data: upiId } = useQuery({
    queryKey: ["setting", "upi_id"],
    queryFn: () => fetchSetting("upi_id"),
  });

  const { data: bakeryName } = useQuery({
    queryKey: ["setting", "bakery_name"],
    queryFn: () => fetchSetting("bakery_name"),
  });

  const payMut = useMutation({
    mutationFn: () => {
      const amt = parseFloat(payAmount);
      if (isNaN(amt) || amt <= 0) throw new Error("Invalid amount");
      return createPayment({
        customer_id: customer.id,
        amount_paid: amt,
        payment_method: payMethod,
        reference_note: "Account settlement",
      });
    },
    onSuccess: () => {
      toast.success("Payment recorded successfully!");
      queryClient.invalidateQueries({ queryKey: ["customerLedger"] });
      queryClient.invalidateQueries({ queryKey: ["customerPayments"] });
      setShowPayDialog(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const parsedPay = parseFloat(payAmount);
  const upiUrl = upiId && !isNaN(parsedPay) && parsedPay > 0
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(bakeryName || "Bakery")}&am=${parsedPay.toFixed(2)}&cu=INR&tn=Settlement-${customer.name}`
    : "";

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      <div className="flex items-center gap-4 border-b border-gray-200 pb-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5"/></Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{customer.name}</h2>
          {customer.phone && <span className="text-sm font-mono text-gray-500">{customer.phone}</span>}
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"><p className="text-sm font-semibold text-gray-500">Total Purchase</p><p className="text-2xl font-bold mt-1 text-gray-900">₹{customer.totalOrders.toLocaleString("en-IN")}</p></div>
        <div className="bg-white rounded-2xl p-5 border border-green-100 shadow-sm bg-gradient-to-b from-white to-green-50/30"><p className="text-sm font-semibold text-green-700/80">Total Paid</p><p className="text-2xl font-bold mt-1 text-green-600">₹{customer.totalPaid.toLocaleString("en-IN")}</p></div>
        <div className={`rounded-2xl p-5 shadow-sm bg-gradient-to-b from-white border flex flex-col justify-between ${customer.pending > 0 ? "border-red-200 to-red-50/50" : "border-gray-100"}`}>
          <div><p className="text-sm font-semibold text-gray-600">Pending Balance</p><p className={`text-2xl font-bold mt-1 ${customer.pending > 0 ? "text-red-600" : "text-gray-900"}`}>₹{Math.max(0, customer.pending).toLocaleString("en-IN")}</p></div>
          {customer.pending > 0 && (
            <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md text-white font-bold">
                  <IndianRupee className="mr-1 h-3.5 w-3.5" /> Collect Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader><DialogTitle className="text-xl">Settle Account — {customer.name}</DialogTitle></DialogHeader>
                <div className="space-y-5 pt-2">
                  <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 space-y-2">
                    <div className="flex justify-between text-sm font-medium text-gray-600"><span>Total Purchases</span><span>₹{customer.totalOrders.toLocaleString("en-IN")}</span></div>
                    <div className="flex justify-between text-sm font-medium text-green-600"><span>Total Paid</span><span>₹{customer.totalPaid.toLocaleString("en-IN")}</span></div>
                    <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2"><span className="text-gray-800">Current Balance</span><span className="text-red-600">₹{Math.max(0, customer.pending).toLocaleString("en-IN")}</span></div>
                  </div>
                  <div>
                    <Label className="font-semibold text-gray-700">Amount to Collect (₹)</Label>
                    <Input type="number" className="rounded-xl mt-1.5 focus-visible:ring-indigo-500" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} min="1" max={customer.pending} />
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setPayAmount(Math.max(0, customer.pending).toString())}>Full Pay</Button>
                      {customer.pending > 200 && <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setPayAmount(Math.round(customer.pending / 2).toString())}>Half Pay</Button>}
                    </div>
                  </div>
                  <div>
                    <Label className="font-semibold text-gray-700">Payment Method</Label>
                    <div className="grid grid-cols-2 gap-3 mt-1.5">
                      <Button variant={payMethod === "Cash" ? "default" : "outline"} className={`rounded-xl ${payMethod === "Cash" && "bg-indigo-600"}`} onClick={() => setPayMethod("Cash")}><Banknote className="mr-2 h-4 w-4" />Cash</Button>
                      <Button variant={payMethod === "UPI" ? "default" : "outline"} className={`rounded-xl ${payMethod === "UPI" && "bg-indigo-600"}`} onClick={() => setPayMethod("UPI")}><QrCode className="mr-2 h-4 w-4" />UPI</Button>
                    </div>
                  </div>
                  {payMethod === "UPI" && upiUrl && (
                    <div className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/50 p-6">
                      <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 mb-2">Scan & Pay</Badge>
                      <div className="bg-white p-2 rounded-xl shadow-sm"><QRCodeSVG value={upiUrl} size={160} level="H" includeMargin={false} /></div>
                      <p className="text-xl font-black text-gray-900 mt-2">₹{parsedPay.toLocaleString("en-IN")}</p>
                    </div>
                  )}
                  <Button className="w-full rounded-xl py-6 font-bold shadow-md bg-indigo-600 hover:bg-indigo-700" onClick={() => payMut.mutate()} disabled={payMut.isPending || isNaN(parsedPay) || parsedPay <= 0}>
                    <CheckCircle className="mr-2 h-5 w-5" /> Confirm Settlement
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Orders history */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
          <div className="p-5 border-b border-gray-100"><h3 className="font-bold text-lg text-gray-900">Order Ledger</h3></div>
          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full text-left">
              <thead className="bg-gray-50 sticky top-0 shadow-sm border-b border-gray-100">
                <tr><th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th><th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Table</th><th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Amount</th><th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {orders.length === 0 ? <tr><td colSpan={4} className="text-center p-8 text-gray-400">No orders recorded</td></tr> : orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/50">
                    <td className="p-4 text-gray-600 font-medium whitespace-nowrap">{format(new Date(o.created_at), "dd MMM yy")}</td>
                    <td className="p-4 text-gray-900 font-semibold">{o.table_name}</td>
                    <td className="p-4 font-bold text-gray-900 text-right">₹{o.total_amount.toLocaleString("en-IN")}</td>
                    <td className="p-4"><span className={`px-2 py-1 text-xs font-bold rounded-md ${o.payment_status === "Paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{o.payment_status.toUpperCase()}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payments history */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
          <div className="p-5 border-b border-gray-100"><h3 className="font-bold text-lg text-gray-900">Payment History</h3></div>
          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full text-left">
              <thead className="bg-gray-50 sticky top-0 shadow-sm border-b border-gray-100">
                <tr><th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th><th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Amount Paid</th><th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th><th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Note</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {payments.length === 0 ? <tr><td colSpan={4} className="text-center p-8 text-gray-400">No payments recorded</td></tr> : payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="p-4 text-gray-600 font-medium whitespace-nowrap">{format(new Date(p.created_at), "dd MMM yy")}</td>
                    <td className="p-4 font-black text-green-600 text-right">₹{p.amount_paid.toLocaleString("en-IN")}</td>
                    <td className="p-4"><span className="px-2 py-1 bg-gray-100 border border-gray-200/50 text-gray-600 font-bold text-xs rounded-md">{p.payment_method}</span></td>
                    <td className="p-4 text-gray-500 italic max-w-[150px] truncate">{p.reference_note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
