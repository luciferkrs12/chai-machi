# Supabase Integration - Quick Reference

## 📍 File Locations

| File | Purpose |
|------|---------|
| `src/lib/supabase.ts` | Client initialization & types |
| `src/lib/auth.ts` | Authentication functions |
| `src/lib/inventory.ts` | Product/inventory CRUD |
| `src/lib/sales.ts` | Sales transaction CRUD |
| `src/contexts/AuthContext.tsx` | Auth state management |
| `src/components/ProtectedRoute.tsx` | Route protection |
| `.env.local` | Environment variables (never commit!) |
| `SUPABASE_SETUP.sql` | Database setup queries |

---

## 🔐 Authentication API

### Sign Up (Create Account)
```typescript
import { signUp } from "@/lib/auth";

const { user, error } = await signUp(
  "user@email.com",
  "password123",
  "John Doe"
);

if (error) console.error(error);
// User created with 'staff' role by default
```

### Sign In (Login)
```typescript
import { signIn } from "@/lib/auth";

const { user, error } = await signIn("user@email.com", "password123");

if (!error) {
  // User logged in
  // user.role will be 'admin' or 'staff'
}
```

### Sign Out (Logout)
```typescript
import { signOut } from "@/lib/auth";

const { error } = await signOut();
// User logged out, session cleared
```

### Get Current User
```typescript
import { getCurrentUser } from "@/lib/auth";

const { user, error } = await getCurrentUser();
if (user) {
  console.log(user.name, user.role);
}
```

### Subscribe to Auth Changes
```typescript
import { onAuthStateChange } from "@/lib/auth";

const unsubscribe = onAuthStateChange((user) => {
  if (user) {
    console.log("User logged in:", user.name);
  } else {
    console.log("User logged out");
  }
});

// Cleanup
unsubscribe?.();
```

---

## 📦 Inventory API

### Get All Products
```typescript
import { getAllInventory } from "@/lib/inventory";

const { items, error } = await getAllInventory();

if (items) {
  items.forEach(item => {
    console.log(`${item.name}: ₹${item.price} (Stock: ${item.stock})`);
  });
}
```

### Get Single Item
```typescript
import { getInventoryItem } from "@/lib/inventory";

const { item, error } = await getInventoryItem("item-id-here");
```

### Add Product (Admin Only)
```typescript
import { addInventoryItem } from "@/lib/inventory";

const { item, error } = await addInventoryItem({
  name: "Chai Tea",
  category: "Beverages",
  price: 50,
  stock: 100
});

// RLS will block if not admin
```

### Update Product (Admin Only)
```typescript
import { updateInventoryItem } from "@/lib/inventory";

// Update only specific fields
const { item, error } = await updateInventoryItem("item-id", {
  stock: 120,
  price: 55
  // name, category can also be updated
});
```

### Delete Product (Admin Only)
```typescript
import { deleteInventoryItem } from "@/lib/inventory";

const { success, error } = await deleteInventoryItem("item-id");
```

### Search Products
```typescript
import { searchInventory } from "@/lib/inventory";

const { items, error } = await searchInventory("chai");
// Searches in name and category (case-insensitive)
```

### Check Stock Availability
```typescript
// Stock is reduced automatically during sales
// But you can check before creating sale:

const { item, error } = await getInventoryItem(itemId);

if (item && item.stock >= requiredQuantity) {
  // Enough stock available
} else {
  // Not enough stock
}
```

---

## 💳 Sales API

### Create Sale (Auto Stock Reduction)
```typescript
import { createSale } from "@/lib/sales";

const { sale, error } = await createSale(
  userId,  // from user.id in AuthContext
  [
    {
      item_id: "uuid-1",
      quantity: 2,
      price: 50    // per unit
    },
    {
      item_id: "uuid-2",
      quantity: 1,
      price: 100
    }
  ]
);

// Total calculated as: (2 × 50) + (1 × 100) = ₹200
// Stock automatically reduced:
// - item 1: stock -= 2
// - item 2: stock -= 1
```

### Get All Sales with Items
```typescript
import { getAllSales } from "@/lib/sales";

const { sales, error } = await getAllSales();

sales?.forEach(sale => {
  console.log(`Sale ${sale.id}`);
  console.log(`  Amount: ₹${sale.total_amount}`);
  console.log(`  Items: ${sale.items.length}`);
  
  sale.items.forEach(item => {
    console.log(`    - Item ${item.item_id}: qty ${item.quantity}`);
  });
});
```

### Get Single Sale
```typescript
import { getSale } from "@/lib/sales";

const { sale, error } = await getSale("sale-id");
```

### Get Sales Report
```typescript
import { getSalesReport } from "@/lib/sales";

const { report, error } = await getSalesReport(
  "2024-01-01",
  "2024-01-31"
);

if (report) {
  console.log(`Total Sales: ${report.total_sales}`);
  console.log(`Total Amount: ₹${report.total_amount}`);
  console.log(`Items Sold: ${report.items_sold}`);
}
```

### Delete Sale (Admin Only)
```typescript
import { deleteSale } from "@/lib/sales";

const { success, error } = await deleteSale("sale-id");
// Stock is NOT restored (audit trail maintained)
```

### Subscribe to Sales Updates
```typescript
import { subscribeToSales } from "@/lib/sales";

const unsubscribe = subscribeToSales((sales) => {
  console.log("Sales updated:", sales);
  // Component can update UI with real-time data
});

// Cleanup
unsubscribe();
```

---

## 🎯 Using in Components

### Example: Inventory List
```typescript
import { useEffect, useState } from "react";
import { getAllInventory } from "@/lib/inventory";

export function ProductsList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { items, error } = await getAllInventory();
      if (!error) setProducts(items);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {products.map(p => (
        <div key={p.id}>
          <h3>{p.name}</h3>
          <p>₹{p.price}</p>
          <p>Stock: {p.stock}</p>
        </div>
      ))}
    </div>
  );
}
```

### Example: Protected Component
```typescript
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export function AdminPanel() {
  return (
    <ProtectedRoute requiredRole="admin">
      <div>
        <h1>Admin Only</h1>
        <p>Only admins can see this</p>
      </div>
    </ProtectedRoute>
  );
}
```

### Example: Get Current User
```typescript
import { useAuth } from "@/contexts/AuthContext";

export function UserProfile() {
  const { user, isAdmin, isStaff, logout } = useAuth();

  return (
    <div>
      <p>Hello, {user?.name}!</p>
      <p>Role: {isAdmin ? "Admin" : "Staff"}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

---

## 🔐 Role-Based Access

```typescript
import { useAuth } from "@/contexts/AuthContext";

export function ConditionalFeatures() {
  const { user, isAdmin, isStaff } = useAuth();

  return (
    <div>
      {isAdmin && (
        <button>Delete Product (Admin Only)</button>
      )}

      {isStaff && (
        <button>Create Sale (Staff + Admin)</button>
      )}

      {user && (
        <button>Profile Settings (All Users)</button>
      )}
    </div>
  );
}
```

---

## ⚠️ Common Patterns & Anti-Patterns

### ✅ DO: Error Handling
```typescript
const { item, error } = await addInventoryItem(data);

if (error) {
  console.error("Failed to add item:", error);
  setError(error);
  return;
}

// Use item
```

### ❌ DON'T: Ignore Errors
```typescript
const { item } = await addInventoryItem(data);
// What if item is null?
```

### ✅ DO: Check Auth Before Action
```typescript
const { user } = useAuth();

if (!user) {
  navigate("/login");
  return;
}

// Safe to use user.id
```

### ❌ DON'T: Assume User Exists
```typescript
// user might be null!
const { role } = useAuth();
console.log(role.name);  // Could crash
```

### ✅ DO: Type Your Responses
```typescript
const { items, error }: { items: InventoryItem[] | null; error: string | null } 
  = await getAllInventory();
```

### ❌ DON'T: Assume Response Structure
```typescript
// items might not exist
const product = items[0];  // Could crash
```

---

## 🐛 Error Codes & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `"Row level security violation"` | Not authorized (wrong role) | Check user role or use different operation |
| `"Insufficient stock"` | Not enough inventory | Reduce quantity or add stock |
| `"UNIQUE constraint"` | Duplicate email | Use different email |
| `"Network error"` | Connection failed | Retry or check internet |
| `"undefined is not a function"` | Missing import | Import function from correct file |

---

## 📊 Data Validation Examples

### Validate Before Creating Sale
```typescript
if (!userId) {
  throw new Error("User ID required");
}

if (!items || items.length === 0) {
  throw new Error("At least one item required");
}

for (const item of items) {
  if (item.quantity <= 0) {
    throw new Error("Quantity must be positive");
  }
  if (item.price < 0) {
    throw new Error("Price cannot be negative");
  }
}

// Safe to create sale
const { sale } = await createSale(userId, items);
```

### Validate Before Adding Product
```typescript
if (!name?.trim()) {
  throw new Error("Product name required");
}

if (price <= 0) {
  throw new Error("Price must be positive");
}

if (stock < 0) {
  throw new Error("Stock cannot be negative");
}

// Safe to add
const { item } = await addInventoryItem({...});
```

---

## 🔄 Common Workflows

### Complete Sale Workflow
```typescript
// 1. Get current user
const { user } = useAuth();

// 2. Load inventory
const { items } = await getAllInventory();

// 3. User selects items and quantities
// [via UI form]

// 4. Validate
if (!user || saleItems.length === 0) return;

// 5. Create sale
const { sale, error } = await createSale(user.id, saleItems);

if (error) {
  setError(error);
  return;
}

// 6. Success - reload and close
await loadSales();
closeModal();
```

### Add & Search Product
```typescript
// 1. Add new product (admin)
const { item } = await addInventoryItem({...});

// 2. Search for it
const { items } = await searchInventory("tea");

// 3. Verify it's there
const found = items?.find(i => i.id === item?.id);
```

---

## 💡 Tips & Tricks

1. **Batch Operations**
   - Load all data once, don't refetch repeatedly
   - Use useState to cache data

2. **Error Messages**
   - Show user-friendly messages
   - Log technical details for debugging

3. **Loading States**
   - Show spinner during async operations
   - Disable buttons while loading

4. **Validation**
   - Validate on client (UX)
   - RLS validates on server (security)

5. **Real-time**
   - Use subscriptions for dashboards
   - Reduces polling overhead

---

## 🚀 Performance Tips

```typescript
// ✅ Good: Load once and cache
const [inventory, setInventory] = useState([]);

useEffect(() => {
  const load = async () => {
    const { items } = await getAllInventory();
    setInventory(items);
  };
  load();
}, []);

// ❌ Bad: Loading on every render
function Component() {
  const inventory = await getAllInventory();  // Refetches every render!
}
```

---

**That's it! You're ready to build. 🚀**
