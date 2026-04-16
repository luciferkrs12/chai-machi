import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProducts, createProduct, updateProduct, deleteProduct } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, PackageSearch } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export const Route = createFileRoute("/products")({
  component: ProductsPage,
  head: () => ({
    meta: [
      { title: "Products — Bakery Billing" },
      { name: "description", content: "Manage bakery menu items" },
    ],
  }),
});

const CATEGORIES = ["Bread", "Cake", "Pastry", "Cookie", "Beverage", "Snack", "Other"];

function ProductsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategory, setFormCategory] = useState("Bread");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      toast.success("Product added successfully!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["activeProducts"] });
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...updates }: any) => updateProduct(id, updates),
    onSuccess: () => {
      toast.success("Product updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["activeProducts"] });
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      toast.success("Product deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["activeProducts"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => updateProduct(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["activeProducts"] });
      toast.success("Product status updated");
    },
  });

  const resetForm = () => {
    setDialogOpen(false);
    setEditingProduct(null);
    setFormName("");
    setFormPrice("");
    setFormCategory("Bread");
  };

  const openEdit = (product: any) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormPrice(product.price.toString());
    setFormCategory(product.category);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formName.trim() || !formPrice) return;
    const price = parseFloat(formPrice);
    if (isNaN(price) || price <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, name: formName.trim(), price, category: formCategory });
    } else {
      createMutation.mutate({ name: formName.trim(), price, category: formCategory });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Area */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Menu Products</h1>
          <p className="mt-2 text-sm text-gray-500">Add, edit, or disable available bakery items and pricing.</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200/50 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <Plus className="mr-2 h-4 w-4" />
              Add New Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900">
                {editingProduct ? "Edit Product Details" : "Create New Product"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 pt-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Product Name</Label>
                <Input 
                  value={formName} 
                  onChange={(e) => setFormName(e.target.value)} 
                  placeholder="e.g. Masala Chai" 
                  className="rounded-xl border-gray-200 focus-visible:ring-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Price (₹)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                  <Input 
                    type="number" 
                    value={formPrice} 
                    onChange={(e) => setFormPrice(e.target.value)} 
                    placeholder="0.00" 
                    min="0" step="0.01" 
                    className="pl-8 rounded-xl border-gray-200 focus-visible:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Category</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger className="rounded-xl border-gray-200 focus:ring-indigo-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="rounded-lg cursor-pointer hover:bg-indigo-50 hover:text-indigo-700">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-6 shadow-md mt-4" 
                onClick={handleSubmit} 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingProduct ? "Save Changes" : "Publish Product"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Table Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden flex flex-col"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/80 border-b border-gray-100">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-4 pl-6 font-semibold text-gray-600">Product Name</TableHead>
                <TableHead className="py-4 font-semibold text-gray-600">Price</TableHead>
                <TableHead className="py-4 font-semibold text-gray-600">Category</TableHead>
                <TableHead className="py-4 font-semibold text-gray-600">Status</TableHead>
                <TableHead className="py-4 pr-6 text-right font-semibold text-gray-600">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center text-gray-400 gap-3">
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm font-medium">Loading menu items...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center text-gray-400 gap-3">
                      <PackageSearch className="w-12 h-12 text-gray-300" />
                      <p className="text-base font-medium text-gray-500">Your menu is empty</p>
                      <p className="text-sm">Click "Add New Product" to start building your menu.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id} className="group hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-0">
                    <TableCell className="pl-6 py-4">
                      <span className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {product.name}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded-md text-sm border border-gray-200/50">
                        ₹{product.price.toLocaleString("en-IN")}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100 transition-colors tracking-wide">
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={product.is_active}
                          onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: product.id, is_active: checked })}
                          className="data-[state=checked]:bg-green-500"
                        />
                        <span className={`text-xs font-semibold ${product.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                          {product.is_active ? 'Active' : 'Hidden'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="pr-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors" 
                          onClick={() => openEdit(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                          onClick={() => { if (confirm(`Are you sure you want to delete ${product.name}?`)) deleteMutation.mutate(product.id); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </motion.div>
    </div>
  );
}
