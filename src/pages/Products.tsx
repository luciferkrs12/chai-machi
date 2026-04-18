import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import {
  getProducts,
  addProduct,
  updateProduct,
  addStock,
  deleteProduct,
  subscribeProducts,
} from "@/lib/products";
import { Product } from "@/lib/supabase";

const ProductsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockModalMode, setStockModalMode] = useState<"add" | "set">("add");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", price: "", category: "Bread" });
  const [trackStock, setTrackStock] = useState(true);
  const [addedQuantity, setAddedQuantity] = useState("0");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isStocking, setIsStocking] = useState(false);
  const [activeTab, setActiveTab] = useState<"catalog" | "stock">("catalog");

  useEffect(() => {
    loadProducts();
    const unsubscribe = subscribeProducts((updatedProducts) => {
      setProducts(updatedProducts);
    });
    return () => unsubscribe();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    setError("");

    const { products: loadedProducts, error: productsError } = await getProducts();
    if (productsError) {
      setError(productsError);
    } else {
      setProducts(loadedProducts || []);
    }

    setIsLoading(false);
  };

  const openCreateProduct = () => {
    setEditingProduct(null);
    setForm({ name: "", price: "", category: "Bread" });
    setTrackStock(true);
    setError("");
    setShowProductModal(true);
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setForm({ name: product.name, price: String(product.price), category: product.category || "Bread" });
    setTrackStock(product.stock >= 0);
    setError("");
    setShowProductModal(true);
  };

  const openStockModal = (product: Product, mode: "add" | "set") => {
    setStockProduct(product);
    setStockModalMode(mode);
    setAddedQuantity(mode === "set" ? String(product.stock) : "0");
    setError("");
    setShowStockModal(true);
  };

  const handleSaveProduct = async () => {
    if (!form.name.trim() || !form.price || !form.category.trim()) {
      setError("Please provide name, price, and category.");
      return;
    }

    setIsSaving(true);
    setError("");
    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      category: form.category.trim(),
    };

    try {
      if (editingProduct) {
        const { product, error: updateError } = await updateProduct(editingProduct.id, payload);
        if (updateError || !product) {
          setError(updateError || "Unable to update product.");
          return;
        }
        setProducts((prev) => prev.map((item) => (item.id === product.id ? product : item)));
      } else {
        const { product, error: createError } = await addProduct({ ...payload, stock: trackStock ? 0 : -1 });
        if (createError || !product) {
          setError(createError || "Unable to create product.");
          return;
        }
        setProducts((prev) => [product, ...prev]);
      }
      setShowProductModal(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddStock = async () => {
    if (!stockProduct) return;

    const quantity = Number(addedQuantity);
    if (isNaN(quantity) || quantity < 0) {
      setError("Please enter a valid stock quantity.");
      return;
    }

    setIsStocking(true);
    setError("");

    try {
      if (stockModalMode === "set") {
        const { product, error: updateError } = await updateProduct(stockProduct.id, { stock: quantity });
        if (updateError || !product) {
          setError(updateError || "Unable to set stock.");
          return;
        }
        setProducts((prev) => prev.map((item) => (item.id === product.id ? product : item)));
      } else {
        if (quantity <= 0) {
           setError("Added quantity must be greater than zero.");
           setIsStocking(false);
           return;
        }
        const { product, error: stockError } = await addStock(stockProduct.id, quantity);
        if (stockError || !product) {
          setError(stockError || "Unable to add stock.");
          return;
        }
        setProducts((prev) => prev.map((item) => (item.id === product.id ? product : item)));
      }
      setShowStockModal(false);
      setAddedQuantity(stockModalMode === "set" ? String(stockProduct.stock) : "0");
    } finally {
      setIsStocking(false);
    }
  };

  const handleResetModalInput = () => {
    if (!stockProduct) return;
    setAddedQuantity(stockModalMode === "set" ? String(stockProduct.stock) : "0");
    setError("");
  };

  const handleResetDailyAdditions = async () => {
    if (!window.confirm("Reset all daily additions to zero?")) return;
    setError("");

    const updates = await Promise.all(products.map(async (product) => {
      if (product.stock < 0) return null;
      return await updateProduct(product.id, { daily_added_stock: 0 });
    }));

    const hasError = updates.some(item => item?.error);
    if (hasError) {
      setError("Unable to reset daily stock counts for some products.");
    }

    const { products: refreshedProducts, error: loadError } = await getProducts();
    if (loadError || !refreshedProducts) {
      setProducts((prev) => prev.map((product) => ({ ...product, daily_added_stock: product.stock >= 0 ? 0 : product.daily_added_stock })));
      if (loadError) setError(loadError);
      return;
    }

    setProducts(refreshedProducts);
  };

  const handleResetProductDailyAddition = async (productId: string) => {
    setError("");
    const { product, error } = await updateProduct(productId, { daily_added_stock: 0 });
    if (error || !product) {
      setError(error || "Unable to reset daily addition for this product.");
      return;
    }
    setProducts((prev) => prev.map((item) => (item.id === product.id ? product : item)));
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Delete this product?")) return;

    setError("");
    const { success, error: deleteError } = await deleteProduct(id);
    if (deleteError) {
      setError(deleteError);
      return;
    }
    setProducts((prev) => prev.filter((product) => product.id !== id));
  };

  const lowStockProducts = products.filter((product) => product.stock >= 0 && product.stock < 5);

  if (isLoading) {
    return (
      <Layout title="Products">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Products">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
           <div className="flex bg-muted p-1 rounded-xl w-max">
             <button onClick={() => setActiveTab("catalog")} className={`px-5 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'catalog' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
               Product Catalog
             </button>
             <button onClick={() => setActiveTab("stock")} className={`px-5 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'stock' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
               Daily Stock Update
             </button>
           </div>
           {isAdmin && activeTab === 'catalog' && (
             <button
               onClick={openCreateProduct}
               className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
             >
               <Plus className="w-4 h-4" /> Add Product
             </button>
           )}
           {isAdmin && activeTab === 'stock' && (
             <button
               onClick={handleResetDailyAdditions}
               className="inline-flex items-center gap-2 rounded-lg border border-destructive px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 transition"
             >
               Reset Daily Additions
             </button>
           )}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-muted-foreground text-sm">{products.length} products</p>
            {lowStockProducts.length > 0 ? (
              <p className="text-destructive text-sm mt-1">⚠️ {lowStockProducts.length} items low in stock</p>
            ) : (
              <p className="text-muted-foreground text-sm mt-1">Stock healthy</p>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {activeTab === "catalog" ? (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            {products.map((product) => {
              const isLow = product.stock < 5;
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-3xl border p-5 bg-card ${isLow ? "border-yellow-300" : "border-slate-200"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{product.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                         <p className="text-sm font-bold">₹{product.price.toFixed(2)}</p>
                         <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{product.category || "Other"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-2">
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => openEditProduct(product)}
                          className="flex-1 rounded-lg border px-4 py-2 text-sm hover:bg-muted transition flex items-center justify-center gap-2"
                        >
                          <Pencil className="w-4 h-4" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="rounded-lg border border-destructive px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="bg-card rounded-2xl border overflow-hidden">
             <table className="w-full text-sm">
                <thead className="bg-muted/30 border-b">
                   <tr>
                      <th className="text-left font-semibold py-4 px-6 text-muted-foreground">Product</th>
                      <th className="text-left font-semibold py-4 px-6 text-muted-foreground">Action</th>
                      <th className="text-right font-semibold py-4 px-6 text-muted-foreground">Daily Additions</th>
                      <th className="text-right font-semibold py-4 px-6 text-muted-foreground">Total Sold</th>
                      <th className="text-right font-semibold py-4 px-6 text-muted-foreground">Current Stock</th>
                   </tr>
                </thead>
                <tbody>
                   {products.map(product => {
                      const isLow = product.stock >= 0 && product.stock < 5;
                      const hasStock = product.stock >= 0;
                      return (
                         <tr key={product.id} className="border-b last:border-0 hover:bg-muted/10">
                            <td className="py-3 px-6 font-semibold text-foreground">
                               {product.name}
                               <span className="ml-2 text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">{product.category || "Other"}</span>
                            </td>
                            <td className="py-3 px-6">
                               {isAdmin && hasStock && (
                                  <div className="flex flex-wrap items-center gap-2">
                                    <button onClick={() => openStockModal(product, "add")} className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-bold px-3 py-1.5 rounded-lg transition text-xs">
                                       + Add
                                    </button>
                                    <button onClick={() => openStockModal(product, "set")} className="border border-input hover:bg-muted text-foreground font-bold px-3 py-1.5 rounded-lg transition text-xs flex items-center gap-1">
                                       <Pencil className="w-3 h-3" /> Set
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleResetProductDailyAddition(product.id)}
                                      className="border border-destructive text-destructive hover:bg-destructive/10 font-bold px-3 py-1.5 rounded-lg transition text-xs"
                                    >
                                      Reset
                                    </button>
                                  </div>
                               )}
                               {isAdmin && !hasStock && (
                                  <span className="text-xs text-muted-foreground">Not Tracked</span>
                               )}
                            </td>
                            <td className="py-3 px-6 text-right font-medium">{hasStock ? (product.daily_added_stock || 0) : "-"}</td>
                            <td className="py-3 px-6 text-right font-medium">{product.total_sold || 0}</td>
                            <td className="py-3 px-6 text-right">
                               {hasStock ? (
                                 <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${isLow ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
                                    {product.stock}
                                 </span>
                               ) : (
                                 <span className="text-muted-foreground font-medium">-</span>
                               )}
                            </td>
                         </tr>
                      );
                   })}
                </tbody>
             </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showProductModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl border border-slate-200 bg-card p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {editingProduct ? "Edit Product" : "Add Product"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {editingProduct ? "Update the product details." : "Create a new product."}
                  </p>
                </div>
                <button onClick={() => setShowProductModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground">Product Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-foreground">Price</label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary appearance-none"
                    >
                       <option value="Bread">Bread</option>
                       <option value="Cake">Cake</option>
                       <option value="Pastry">Pastry</option>
                       <option value="Cookie">Cookie</option>
                       <option value="Beverage">Beverage</option>
                       <option value="Snack">Snack</option>
                       <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                {!editingProduct && (
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={trackStock}
                      onChange={(e) => setTrackStock(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-foreground">Track Stock Quantity?</span>
                  </label>
                )}
                {error && <p className="text-sm text-destructive">{error}</p>}
                <button
                  onClick={handleSaveProduct}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : editingProduct ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStockModal && stockProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-md rounded-3xl border border-slate-200 bg-card p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Add Stock</h2>
                  <p className="text-sm text-muted-foreground">Current stock: {stockProduct.stock}</p>
                </div>
                <button
                  onClick={() => setShowStockModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    {stockModalMode === "add" ? "Quantity to add" : "New Total Stock"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={addedQuantity}
                    onChange={(e) => setAddedQuantity(e.target.value)}
                    className="w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary mt-1"
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    onClick={handleAddStock}
                    disabled={isStocking}
                    className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
                  >
                    {isStocking ? "Saving..." : stockModalMode === "add" ? "Add to Stock" : "Set Exact Stock"}
                  </button>
                  <button
                    type="button"
                    onClick={handleResetModalInput}
                    className="inline-flex items-center justify-center rounded-2xl border border-input px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted transition"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default ProductsPage;
