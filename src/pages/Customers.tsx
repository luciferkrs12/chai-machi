import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { Customer } from "@/contexts/DataContext";
import { Users, Eye, Search, Receipt, Download, FileText, ChevronRight, Plus, Edit, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const Customers: React.FC = () => {
  const { user } = useAuth();
  const { customers, orders, addCustomer, payCredit } = useData();
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerCollege, setNewCustomerCollege] = useState("");

  // Compute all metrics
  const customerList = customers.map(c => {
    const cOrders = orders.filter(o => o.customer_name?.toLowerCase() === c.name.toLowerCase() && o.status === "Completed");
    const totalOrdersAmount = cOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const paid = cOrders.filter(o => o.payment_method !== "Credit").reduce((sum, o) => sum + o.total_amount, 0);
    const pending = cOrders.filter(o => o.payment_method === "Credit").reduce((sum, o) => sum + o.total_amount, 0);
    return {
      ...c,
      totalOrdersAmount,
      paid,
      pending
    };
  });

  const totalCustomersCount = customers.length;
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

  const handlePrint = () => {
    window.print();
  };

  const selectedCustDetails = selectedCustomer ? customerList.find(c => c.name === selectedCustomer) : null;
  const selectedCustOrders = selectedCustDetails ? orders.filter(o => o.customer_name?.trim() === selectedCustDetails.name.trim() && o.status === "Completed").sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) : [];

  return (
    <Layout title="Customers" description="Credit ledger & payment tracking">
      {orders.length === 0 && customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Users className="w-16 h-16 mb-4" />
          <p className="text-lg font-medium">No customer activity yet</p>
          <p className="text-sm">Start taking orders to build customer history</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <p className="text-sm text-muted-foreground font-semibold">Total Customers</p>
              <p className="mt-3 text-3xl font-bold text-foreground">{totalCustomersCount}</p>
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

          {/* Search bar inside */}
          <div className="flex justify-between items-center mb-4">
             <div className="w-full max-w-sm relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
               <input type="text" placeholder="Search customer..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border rounded-lg bg-card text-sm focus:ring-2 focus:ring-primary outline-none" />
             </div>
             <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold text-sm hover:opacity-90">
               + Add Customer
             </button>
          </div>

          <div className="bg-card rounded-xl border overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Customer</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Phone</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Total Orders</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Paid</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Pending</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                   <tr>
                     <td colSpan={7} className="text-center py-6 text-muted-foreground">No customers found</td>
                   </tr>
                ) : (
                  filteredCustomers.map(customer => {
                  const statusLabel = customer.pending > 0 ? "Pending" : "Cleared";
                  return (
                    <tr key={customer.id} className="border-b last:border-0 hover:bg-muted/10 transition">
                      <td className="py-4 px-6 font-medium text-foreground">{customer.name}</td>
                      <td className="py-4 px-6 text-muted-foreground">{customer.phone || "-"}</td>
                      <td className="py-4 px-6 font-semibold">₹{customer.totalOrdersAmount}</td>
                      <td className="py-4 px-6 text-success font-semibold">₹{customer.paid}</td>
                      <td className="py-4 px-6 text-destructive font-semibold">₹{customer.pending}</td>
                      <td className="py-4 px-6">
                         <span className={`px-3 py-1 rounded-full text-xs font-bold ${customer.pending > 0 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
                           {statusLabel}
                         </span>
                      </td>
                      <td className="py-4 px-6">
                         <div className="flex gap-2">
                           <button onClick={() => setSelectedCustomer(customer.name)} className="flex items-center gap-2 px-3 py-1.5 border rounded-lg hover:bg-muted/50 transition font-medium text-xs">
                             <Eye className="w-3.5 h-3.5" /> View Ledger
                           </button>
                         </div>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Customer Modal Details */}
      <AnimatePresence>
        {selectedCustomer && selectedCustDetails && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex py-10 justify-center items-start overflow-y-auto" onClick={() => setSelectedCustomer(null)}>
             <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} onClick={e => e.stopPropagation()} className="bg-background w-full max-w-3xl rounded-xl shadow-2xl relative flex flex-col my-auto border print:shadow-none print:w-full print:block print:absolute print:left-0 print:top-0">
               {/* Modal Header */}
               <div className="flex justify-between items-center px-6 py-5 border-b bg-card rounded-t-xl print:hidden">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                     <Receipt className="w-5 h-5 text-primary" /> Invoice Ledger
                  </h2>
                  <div className="flex gap-2">
                     <button onClick={handlePrint} className="flex gap-2 items-center bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold text-sm hover:opacity-90">
                       <Download className="w-4 h-4" /> Download PDF
                     </button>
                     <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-muted rounded-lg transition"><X className="w-5 h-5" /></button>
                  </div>
               </div>

               {/* Print Only Header */}
               <div className="hidden print:block p-6 border-b text-center mb-6">
                   <h1 className="text-3xl font-bold">Chai Machi POS</h1>
                   <p className="text-sm text-gray-500 mt-1">Customer Statement</p>
               </div>

               <div className="p-6 print:p-0">
                  <div className="grid grid-cols-2 gap-4 mb-6 p-5 border rounded-xl bg-card">
                     <div>
                       <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-1">Customer Details</p>
                       <p className="text-xl font-bold text-foreground">{selectedCustDetails.name}</p>
                       {selectedCustDetails.phone && <p className="text-muted-foreground text-sm">{selectedCustDetails.phone}</p>}
                       {selectedCustDetails.college && <p className="text-muted-foreground text-sm">{selectedCustDetails.college}</p>}
                     </div>
                     <div className="text-right flex flex-col justify-center">
                       <p className="text-sm text-muted-foreground mb-1">Statement Date</p>
                       <p className="font-semibold text-foreground">{new Date().toLocaleDateString()}</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-8">
                     <div className="p-4 border rounded-xl text-center">
                        <p className="text-sm text-muted-foreground font-semibold">Total Purchases</p>
                        <p className="text-2xl font-bold mt-1">₹{selectedCustDetails.totalOrdersAmount}</p>
                     </div>
                     <div className="p-4 border rounded-xl text-center bg-success/5 border-success/20">
                        <p className="text-sm text-success font-semibold">Total Paid</p>
                        <p className="text-2xl font-bold text-success mt-1">₹{selectedCustDetails.paid}</p>
                     </div>
                     <div className="p-4 border rounded-xl text-center bg-destructive/5 border-destructive/20">
                        <p className="text-sm text-destructive font-semibold">Total Pending</p>
                        <p className="text-2xl font-bold text-destructive mt-1">₹{selectedCustDetails.pending}</p>
                     </div>
                  </div>

                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2 border-b pb-2"><FileText className="w-5 h-5 text-muted-foreground" /> Transaction History</h3>
                  <div className="rounded-xl border overflow-hidden mb-6">
                     <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                           <tr>
                              <th className="text-left font-semibold text-muted-foreground py-3 px-4">Date</th>
                              <th className="text-left font-semibold text-muted-foreground py-3 px-4">Order ID</th>
                              <th className="text-right font-semibold text-muted-foreground py-3 px-4">Amount</th>
                              <th className="text-right font-semibold text-muted-foreground py-3 px-4">Status</th>
                           </tr>
                        </thead>
                        <tbody>
                           {selectedCustOrders.length === 0 ? (
                              <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">No completed transactions</td></tr>
                           ) : selectedCustOrders.map(o => (
                              <tr key={o.id} className="border-b last:border-0 hover:bg-muted/20">
                                 <td className="py-3 px-4 font-medium">{new Date(o.created_at).toLocaleString()}</td>
                                 <td className="py-3 px-4 uppercase text-muted-foreground text-xs">#{o.id.substring(0,8)}</td>
                                 <td className="py-3 px-4 text-right font-bold">₹{o.total_amount}</td>
                                 <td className="py-3 px-4 text-right">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${o.payment_method === 'Credit' ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
                                      {o.payment_method === 'Credit' ? ( <div className='flex justify-end gap-2 items-center'><span className='px-2 py-1 rounded text-xs font-bold bg-destructive/10 text-destructive whitespace-nowrap'>Unpaid</span><button onClick={() => payCredit(o.id)} className='px-2 py-1 bg-primary text-primary-foreground text-xs font-bold rounded hover:opacity-90 transition whitespace-nowrap'>Settle</button></div> ) : ( <span className='px-2 py-1 rounded text-xs font-bold bg-success/10 text-success'>Paid ({o.payment_method})</span> )}
                                    </span>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Customer Modal */}
      <AnimatePresence>
        {showAddModal && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex py-10 justify-center items-center" onClick={() => setShowAddModal(false)}>
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} className="bg-card w-full max-w-md rounded-xl shadow-2xl p-6 border">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Add Customer</h2>
                    <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-muted rounded-lg transition"><X className="w-5 h-5" /></button>
                 </div>
                 <div className="space-y-4">
                    <div>
                       <label className="text-sm font-medium text-foreground mb-1 block">Customer Name *</label>
                       <input value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 outline-none" placeholder="Enter full name" />
                    </div>
                    <div>
                       <label className="text-sm font-medium text-foreground mb-1 block">Phone Number</label>
                       <input value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 outline-none" placeholder="Enter phone" />
                    </div>
                    <div>
                       <label className="text-sm font-medium text-foreground mb-1 block">College / Notes</label>
                       <input value={newCustomerCollege} onChange={e => setNewCustomerCollege(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 outline-none" placeholder="Enter college or notes" />
                    </div>
                    <button onClick={handleAddCustomerSubmit} disabled={!newCustomerName.trim()} className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:opacity-90 disabled:opacity-50 mt-2">
                       Save Customer
                    </button>
                 </div>
              </motion.div>
           </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default Customers;
