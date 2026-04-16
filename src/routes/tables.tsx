import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UtensilsCrossed, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/tables")({
  component: TablesPage,
  head: () => ({
    meta: [
      { title: "Tables — Chai Machi" },
      { name: "description", content: "Select a table to start billing" },
    ],
  }),
});

const TABLES = ["Table 1", "Table 2", "Table 3", "Table 4", "Table 5", "Takeaway"];

function TablesPage() {
  const { data: pendingOrders } = useQuery({
    queryKey: ["pendingOrders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("table_name, id, total_amount")
        .eq("payment_status", "Pending");
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });

  const pendingByTable = new Map<string, { id: string; total_amount: number }>();
  pendingOrders?.forEach((o) => {
    if (!pendingByTable.has(o.table_name)) {
      pendingByTable.set(o.table_name, { id: o.id, total_amount: o.total_amount });
    }
  });

  return (
    <div className="mb-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Tables</h1>
        <p className="mt-2 text-gray-600">Select a table to start billing</p>
      </motion.div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {TABLES.map((table, index) => {
          const pending = pendingByTable.get(table);
          const Icon = table === "Takeaway" ? ShoppingBag : UtensilsCrossed;

          return (
            <Link key={table} to="/billing/$tableName" params={{ tableName: encodeURIComponent(table) }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`bg-white rounded-2xl shadow-md p-6 flex flex-col items-center justify-center text-center transition transform hover:-translate-y-2 hover:shadow-xl h-full ${
                  pending ? "border border-red-100 bg-red-50/30" : "border border-transparent"
                }`}
              >
                <div className="flex justify-center w-full">
                  <Icon className={`w-10 h-10 mb-3 ${pending ? "text-red-500" : "text-indigo-500"}`} />
                </div>
                
                <h2 className="text-lg font-semibold text-gray-800 mb-3">
                  {table}
                </h2>
                
                <div className="mt-auto flex flex-col items-center justify-center min-h-[48px]">
                  {pending ? (
                    <>
                      <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-medium">
                        ● Occupied
                      </span>
                      <p className="text-red-500 font-semibold mt-2">
                        ₹{pending.total_amount.toLocaleString("en-IN")}
                      </p>
                    </>
                  ) : (
                    <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm font-medium">
                      ✓ Available
                    </span>
                  )}
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
