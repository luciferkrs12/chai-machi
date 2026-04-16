import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { fetchSetting, createPayment } from "@/lib/customer-queries";
import { updatePaymentStatus } from "@/lib/queries";
import { toast } from "sonner";
import { IndianRupee, QrCode, Banknote, CheckCircle } from "lucide-react";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderAmount: number;
  paidAmount?: number;
  customerId?: string | null;
  tableName?: string;
}

export function PaymentDialog({
  open,
  onOpenChange,
  orderId,
  orderAmount,
  paidAmount = 0,
  customerId,
  tableName,
}: PaymentDialogProps) {
  const queryClient = useQueryClient();
  const balance = orderAmount - paidAmount;
  const [amount, setAmount] = useState(balance.toString());
  const [method, setMethod] = useState<"Cash" | "UPI">("Cash");
  const [showQR, setShowQR] = useState(false);

  const { data: upiId } = useQuery({
    queryKey: ["setting", "upi_id"],
    queryFn: () => fetchSetting("upi_id"),
  });

  const { data: bakeryName } = useQuery({
    queryKey: ["setting", "bakery_name"],
    queryFn: () => fetchSetting("bakery_name"),
  });

  const paymentMutation = useMutation({
    mutationFn: async () => {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) throw new Error("Invalid amount");
      if (parsedAmount > balance) throw new Error("Amount exceeds balance");

      // Record payment
      if (customerId) {
        await createPayment({
          customer_id: customerId,
          order_id: orderId,
          amount_paid: parsedAmount,
          payment_method: method,
          reference_note: `Payment for order ${orderId.slice(0, 8)}`,
        });
      }

      // If fully paid, mark order as Paid
      if (parsedAmount >= balance) {
        await updatePaymentStatus(orderId, "Paid");
      }

      return parsedAmount;
    },
    onSuccess: (paid) => {
      toast.success(`₹${paid.toLocaleString("en-IN")} payment recorded via ${method}!`);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["pendingOrder"] });
      queryClient.invalidateQueries({ queryKey: ["pendingOrders"] });
      queryClient.invalidateQueries({ queryKey: ["todayStats"] });
      queryClient.invalidateQueries({ queryKey: ["customerLedger"] });
      queryClient.invalidateQueries({ queryKey: ["customerPayments"] });
      onOpenChange(false);
      setShowQR(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const parsedAmount = parseFloat(amount);
  const upiUrl = upiId && !isNaN(parsedAmount) && parsedAmount > 0
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(bakeryName || "Bakery")}&am=${parsedAmount.toFixed(2)}&cu=INR&tn=Order-${orderId.slice(0, 8)}`
    : "";

  const handleMethodSelect = (m: "Cash" | "UPI") => {
    setMethod(m);
    if (m === "UPI") {
      setShowQR(true);
    } else {
      setShowQR(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5" />
            Make Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order summary */}
          <div className="rounded-lg border p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order Total</span>
              <span className="font-semibold">₹{orderAmount.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Already Paid</span>
              <span className="text-green-600 font-medium">₹{paidAmount.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-1">
              <span className="font-medium">Balance Due</span>
              <span className="font-bold text-red-600">₹{balance.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Amount input */}
          <div className="space-y-2">
            <Label>Payment Amount (₹)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              max={balance}
              step="0.01"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAmount(balance.toString())}
              >
                Full: ₹{balance}
              </Button>
              {balance > 100 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(Math.round(balance / 2).toString())}
                >
                  Half: ₹{Math.round(balance / 2)}
                </Button>
              )}
            </div>
          </div>

          {/* Payment method */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={method === "Cash" ? "default" : "outline"}
                onClick={() => handleMethodSelect("Cash")}
                className="flex items-center gap-2"
              >
                <Banknote className="h-4 w-4" />
                Cash
              </Button>
              <Button
                variant={method === "UPI" ? "default" : "outline"}
                onClick={() => handleMethodSelect("UPI")}
                className="flex items-center gap-2"
              >
                <QrCode className="h-4 w-4" />
                UPI
              </Button>
            </div>
          </div>

          {/* UPI QR Code */}
          {showQR && method === "UPI" && upiUrl && (
            <div className="flex flex-col items-center gap-3 rounded-lg border bg-white p-4">
              <Badge variant="secondary" className="text-xs">Scan & Pay</Badge>
              <QRCodeSVG value={upiUrl} size={200} level="H" includeMargin />
              <p className="text-lg font-bold text-foreground">₹{parsedAmount.toLocaleString("en-IN")}</p>
              <p className="text-xs text-muted-foreground text-center">
                Scan with any UPI app (Google Pay, PhonePe, Paytm)
              </p>
              {upiId && (
                <p className="text-xs text-muted-foreground">UPI: {upiId}</p>
              )}
            </div>
          )}

          {/* Confirm button */}
          <Button
            className="w-full"
            size="lg"
            onClick={() => paymentMutation.mutate()}
            disabled={paymentMutation.isPending || isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > balance}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            {paymentMutation.isPending
              ? "Processing..."
              : `Confirm ${method} Payment — ₹${(!isNaN(parsedAmount) ? parsedAmount : 0).toLocaleString("en-IN")}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
