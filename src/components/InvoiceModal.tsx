import React from "react";
import { motion } from "framer-motion";
import { X, Printer } from "lucide-react";
import { Order } from "@/contexts/DataContext";

interface Props {
  order: Order;
  onClose: () => void;
}

const InvoiceModal: React.FC<Props> = ({ order, onClose }) => {
  const date = new Date(order.completed_at ?? order.created_at);
  const formattedDate = date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const printInvoice = () => {
    const content = `
      <html>
        <head>
          <title>Invoice - ${order.id.slice(0, 8)}</title>
          <style>
            body { font-family: Inter, system-ui, sans-serif; margin: 0; padding: 24px; color: #111827; }
            h1, h2, h3, p { margin: 0; }
            .header { margin-bottom: 24px; }
            .section { margin-bottom: 16px; }
            .items { width: 100%; border-collapse: collapse; }
            .items th, .items td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
            .items th { background: #f9fafb; }
            .total { margin-top: 12px; font-size: 18px; font-weight: 700; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; background: #ecfdf5; color: #166534; font-size: 12px; margin-top: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Invoice</h1>
            <p>Order ID: ${order.id.slice(0, 8)}</p>
            <p>Date: ${formattedDate}</p>
          </div>
          <div class="section">
            <p><strong>Table:</strong> ${order.table_name}</p>
            <p><strong>Customer:</strong> ${order.customer_name ?? "Walk-in"}</p>
            <p><strong>Payment:</strong> ${order.payment_method ?? "Pending"}</p>
          </div>
          <table class="items">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items
                .map(
                  (item) => `
                    <tr>
                      <td>${item.product_name}</td>
                      <td>${item.quantity}</td>
                      <td>₹${item.price}</td>
                      <td>₹${item.total}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
          <div class="total">Grand Total: ₹${order.total_amount}</div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=800,height=900");
    if (!printWindow) return;
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-card rounded-3xl border w-full max-w-3xl p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Invoice</h2>
            <p className="text-sm text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={printInvoice}
              className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted transition"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-2xl border p-4 bg-background">
            <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] mb-2">Table</p>
            <p className="font-semibold text-foreground">{order.table_name}</p>
          </div>
          <div className="rounded-2xl border p-4 bg-background">
            <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] mb-2">Customer</p>
            <p className="font-semibold text-foreground">{order.customer_name ?? "Walk-in"}</p>
          </div>
          <div className="rounded-2xl border p-4 bg-background">
            <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] mb-2">Payment</p>
            <p className="font-semibold text-foreground">{order.payment_method ?? "Pending"}</p>
          </div>
        </div>

        <div className="rounded-3xl border bg-background p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-[0.2em]">Items</p>
            <p className="text-sm text-muted-foreground">{formattedDate}</p>
          </div>
          <div className="space-y-3">
            {order.items.map(item => (
              <div key={item.id} className="flex items-center justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0">
                <div>
                  <p className="font-semibold text-foreground">{item.product_name}</p>
                  <p className="text-xs text-muted-foreground">₹{item.price} × {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">₹{item.total}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between text-lg font-bold">
            <span>Total</span>
            <span>₹{order.total_amount}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default InvoiceModal;
