import React, { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { X, Banknote, Smartphone, CheckCircle } from "lucide-react";

interface Props {
  orderId: string;
  amount: number;
  onClose: () => void;
}

const PaymentModal: React.FC<Props> = ({ orderId, amount, onClose }) => {
  const { completeOrder } = useData();
  const [method, setMethod] = useState<"Cash" | "UPI" | null>(null);
  const [done, setDone] = useState(false);

  const handlePay = () => {
    if (!method) return;
    completeOrder(orderId, method);
    setDone(true);
  };

  const upiUrl = `upi://pay?pa=srivinayagabakes@upi&pn=Sri Vinayaga Bakes&am=${amount}&cu=INR`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-card rounded-2xl border w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        {done ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">Payment Successful!</h3>
            <p className="text-muted-foreground text-sm mb-6">₹{amount} paid via {method}</p>
            <button onClick={onClose} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm">Done</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-foreground">Payment - ₹{amount}</h3>
              <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => setMethod("Cash")}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition ${method === "Cash" ? "border-primary bg-accent" : "border-border hover:border-primary/50"}`}
              >
                <Banknote className="w-8 h-8 text-primary" />
                <span className="font-semibold text-sm text-foreground">Cash</span>
              </button>
              <button
                onClick={() => setMethod("UPI")}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition ${method === "UPI" ? "border-primary bg-accent" : "border-border hover:border-primary/50"}`}
              >
                <Smartphone className="w-8 h-8 text-primary" />
                <span className="font-semibold text-sm text-foreground">UPI</span>
              </button>
            </div>

            {method === "UPI" && (
              <div className="flex flex-col items-center mb-6 p-4 rounded-xl bg-background border">
                <QRCodeSVG value={upiUrl} size={180} />
                <p className="text-xs text-muted-foreground mt-3">Scan to pay ₹{amount}</p>
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={!method}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition disabled:opacity-50"
            >
              Confirm Payment
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default PaymentModal;
