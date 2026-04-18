# Supabase Integration - Architecture & Code Overview

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────┐
│         React Frontend (Your App)            │
│  ┌─────────────────────────────────────────┐ │
│  │     Pages: Login, Products, Orders      │ │
│  └─────────────────────────────────────────┘ │
│                     ↓                         │
│  ┌─────────────────────────────────────────┐ │
│  │     Service Layer (lib/*.ts)            │ │
│  │  - auth.ts                              │ │
│  │  - inventory.ts                         │ │
│  │  - sales.ts                             │ │
│  └─────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────┘
                       │
                       ↓
        ┌──────────────────────────────┐
        │    Supabase Client (SDK)     │
        │   @supabase/supabase-js      │
        └──────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        ↓                             ↓
   ┌─────────────┐          ┌─────────────────┐
   │ PostgreSQL  │          │ Auth Service    │
   │ Database    │          │ (JWT Tokens)    │
   └─────────────┘          └─────────────────┘
```

---

## 📁 Core Files Added

### 1. `src/lib/supabase.ts`
**Purpose**: Supabase client initialization and type definitions

```typescript
// Initialize client with environment variables
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export TypeScript interfaces for type safety
export interface User { ... }
export interface InventoryItem { ... }
export interface Sale { ... }
export interface SaleItem { ... }
```

**Key Points**:
- Reads API keys from `.env.local`
- Throws error if keys missing
- Exports TypeScript types for all models

---

### 2. `src/lib/auth.ts`
**Purpose**: Authentication operations

#### `signUp(email, password, name)`
```typescript
// Creates auth user AND inserts into users table
// Default role: "staff"
// Returns: { user, error }
```

**Flow**:
1. Create user in Supabase Auth
2. Get auth UUID
3. Insert into users table with staff role
4. Return user object

#### `signIn(email, password)`
```typescript
// Authenticates and fetches user profile
// Returns: { user, error }
```

#### `signOut()`
```typescript
// Clears auth session
// Returns: { error }
```

#### `getCurrentUser()`
```typescript
// Gets logged-in user from session + users table
// Runs on app startup
```

#### `onAuthStateChange(callback)`
```typescript
// Subscribes to auth changes
// Useful for real-time updates
// Returns: unsubscribe function
```

---

### 3. `src/lib/inventory.ts`
**Purpose**: Product/Inventory CRUD operations

#### `getAllInventory()`
- Fetches all products
- Returns: `{ items, error }`

#### `addInventoryItem(data)`
- **Requires**: Admin role (enforced by RLS)
- Adds new product with stock
- Returns: `{ item, error }`

#### `updateInventoryItem(id, updates)`
- **Requires**: Admin role
- Updates product details
- Returns: `{ item, error }`

#### `deleteInventoryItem(id)`
- **Requires**: Admin role
- Removes product
- Returns: `{ success, error }`

#### `reduceStock(id, quantity)`
- **Internal function** - called by sales
- Validates stock available
- Reduces by quantity
- Returns: `{ success, error }`

#### `searchInventory(query)`
- Full-text search by name/category
- Returns: `{ items, error }`

**Stock Management**:
```
When creating a sale with item quantity 5:
1. Check current stock
2. Verify quantity < stock
3. Reduce stock by quantity
4. Update inventory timestamp
```

---

### 4. `src/lib/sales.ts`
**Purpose**: Sales transactions and reporting

#### `createSale(userId, items[])`
**Most important function**:
```typescript
// 1. Calculate total from items
// 2. Create sale record in sales table
// 3. For each item:
//    a. Insert into sale_items
//    b. Reduce inventory stock
// Returns: { sale, error }
```

**Atomic Operation**:
If any step fails, entire transaction fails (data consistency).

#### `getAllSales()`
- Fetches all sales with items
- Returns: `{ sales, error }`

#### `getSalesReport(startDate, endDate)`
- Calculates metrics:
  - Total sales count
  - Total amount
  - Items sold count
- Returns: `{ report, error }`

#### `deleteSale(id)`
- **Requires**: Admin role
- **Note**: Stock is NOT restored (audit trail)
- Returns: `{ success, error }`

#### `subscribeToSales(callback)`
- Real-time updates when sales created
- Useful for dashboards

---

## 🔐 Row Level Security (RLS) Policies

### Admin Policies
```sql
-- Can read all users
-- Can update any user
-- Can insert/update/delete inventory
-- Can insert/update/delete sales
```

### Staff Policies
```sql
-- Can read own profile
-- Can read all inventory
-- Can insert sales (create)
-- Cannot update/delete sales
-- Cannot modify inventory
```

### Public Policies
```sql
-- Everyone can read inventory
-- Everyone can read sales
-- But cannot modify without role
```

**RLS Check**:
```sql
EXISTS (
  SELECT 1 FROM users 
  WHERE id = auth.uid() AND role = 'admin'
)
```

---

## 🔄 Context: AuthContext.tsx

**Updated** to use Supabase instead of mock auth

```typescript
interface AuthContextType {
  user: User | null;                    // Current user object
  isAuthenticated: boolean;              // !!user
  isLoading: boolean;                    // During auth operations
  login: async (email, password)         // Supabase signin
  signup: async (email, password, name)  // Supabase signup
  logout: async ()                       // Supabase signout
  isAdmin: boolean;                      // user?.role === 'admin'
  isStaff: boolean;                      // user?.role === 'staff'
}
```

**Initialization** (on app start):
1. Get current session
2. Fetch user profile from users table
3. Subscribe to auth changes
4. Update context when user logs in/out

---

## 🛡️ ProtectedRoute Component

**Purpose**: Protect pages that require authentication

```typescript
<ProtectedRoute requiredRole="admin">
  <AdminOnlyPage />
</ProtectedRoute>
```

**Features**:
- Redirects to login if not authenticated
- Shows loading spinner during auth check
- Shows "Access Denied" if role mismatch
- Checks both authentication AND authorization

---

## 🔄 Login Flow

```
┌─────────────┐
│   User      │
│ enters      │
│ credentials │
└──────┬──────┘
       ↓
   ┌───────────────────────────────┐
   │ Validate email/password       │
   │ (Supabase Auth)               │
   └───────────┬───────────────────┘
               ↓
       ┌──────────────────┐
       │ Success? ✓       │
       └────┬─────────────┘
            ↓
    ┌─────────────────────────┐
    │ Fetch user profile from │
    │ users table             │
    └────┬────────────────────┘
         ↓
    ┌──────────────────┐
    │ Get role (admin/ │
    │ staff)           │
    └────┬─────────────┘
         ↓
    ┌─────────────────────────┐
    │ Store in AuthContext    │
    │ Redirect to dashboard   │
    └─────────────────────────┘
```

---

## 📊 Sales Transaction Flow

```
┌──────────────────┐
│ New Sale Modal   │
│ - Select item    │
│ - Enter quantity │
│ - Set price      │
└────────┬─────────┘
         ↓
┌───────────────────────────┐
│ User clicks "Complete"    │
└────────┬──────────────────┘
         ↓
┌──────────────────────────────────┐
│ createSale(userId, items)        │
│ 1. Validate stock for each item  │
│ 2. Calculate total              │
│ 3. Create sale record            │
└────────┬───────────────────────┘
         ↓
┌──────────────────────────────────┐
│ For each item:                   │
│ 1. Create sale_items row         │
│ 2. Call reduceStock()            │
│ 3. Update inventory.stock        │
└────────┬───────────────────────┘
         ↓
┌──────────────────────────────────┐
│ ✓ Sale complete                  │
│ ✓ Stock reduced                  │
│ ✓ Reload data                    │
│ ✓ Close modal                    │
└──────────────────────────────────┘
```

---

## 🎯 Product Management Flow

### Adding a Product (Admin only)

```
Admin clicks "Add Product"
     ↓
Modal opens with form
- Name: "Chai Tea"
- Category: "Beverages"
- Price: 50
- Stock: 100
     ↓
Admin submits
     ↓
addInventoryItem() is called
     ↓
RLS checks: Is user admin? ✓
     ↓
INSERT into inventory table
     ↓
Return new product
     ↓
Add to products list
```

### Editing a Product

```
Admin clicks edit icon
     ↓
Modal opens with current values
     ↓
User changes stock to 120
     ↓
updateInventoryItem(id, { stock: 120 })
     ↓
RLS checks: Is user admin? ✓
     ↓
UPDATE inventory WHERE id = ...
     ↓
Return updated product
     ↓
Update in list
```

### Low Stock Alert

```
Products with stock < 10
     ↓
Display with yellow background
     ↓
Show in alert banner at top
     ↓
Quick visual inventory check
```

---

## 📋 Data Flow Examples

### Example 1: View All Products

```typescript
// In Products.tsx component
useEffect(() => {
  loadInventory();
}, []);

async function loadInventory() {
  const { items, error } = await getAllInventory();
  
  if (error) {
    setError(error);
    return;
  }
  
  setItems(items);
}

// Result: React state updated, UI re-renders
```

### Example 2: Create Sale

```typescript
// In Orders.tsx
const handleSaveNewSale = async () => {
  // saleItems = [
  //   { item_id: "uuid-1", quantity: 2, price: 50 },
  //   { item_id: "uuid-2", quantity: 1, price: 100 }
  // ]
  
  const { sale, error } = await createSale(user.id, saleItems);
  
  if (error) {
    setError(error);
    return;
  }
  
  // Reload all sales
  await loadData();
  
  // Clear form and close modal
  setSaleItems([]);
  setShowNewSaleModal(false);
}
```

**What happens in DB**:
1. INSERT into sales → id: "sale-123"
2. INSERT into sale_items (qty: 2, price: 50)
3. UPDATE inventory SET stock = stock - 2
4. INSERT into sale_items (qty: 1, price: 100)
5. UPDATE inventory SET stock = stock - 1
6. Both inventory items reduced ✓

---

## ⚡ Error Handling

All functions return `{ data, error }` pattern:

```typescript
const { item, error } = await addInventoryItem(data);

if (error) {
  // Handle error
  // RLS violations
  // Network errors
  // Validation errors
  setError(error);
  return;
}

// Success - use data
```

**Common Errors**:
- `"Row level security violation"` - Role check failed
- `"Insufficient stock"` - Not enough inventory
- `"UNIQUE constraint"` - Duplicate email
- `"Network error"` - Connection issue

---

## 🔄 Real-time Updates

Supabase supports subscriptions:

```typescript
// In sales.ts
export function subscribeToSales(callback) {
  supabase
    .from("sales")
    .on("*", async () => {
      const { sales } = await getAllSales();
      callback(sales);
    })
    .subscribe();
}
```

When another user creates a sale:
1. Database changes
2. Webhook triggers
3. Subscription callback fires
4. Component re-renders
5. Dashboard updates in real-time

---

## 📱 UI Components Updated

### Login.tsx
- Added signup tab
- Role-based signup (new users = staff)
- Error messages
- Loading states

### Products.tsx
- Admin-only add/edit/delete
- Stock display with progress bar
- Low stock warning
- Search/filter by category

### Orders.tsx
- New Sale modal
- Multi-item selection
- Auto stock reduction
- Sales history
- CSV export

### Layout.tsx
- Display current user name + role
- Proper async logout
- Loading state during auth init

---

## 🧪 Testing Scenarios

### Scenario 1: Admin adds product
1. Login as admin
2. Go to Products
3. Click "Add Product"
4. Enter: Chai Tea, ₹50, 100 stock
5. Save → Creates inventory record

### Scenario 2: Staff creates sale
1. Login as staff
2. Go to Sales
3. Click "New Sale"
4. Select Chai Tea, qty 5
5. Save → 
   - Creates sale record
   - Creates sale_items record
   - Reduces stock: 100 → 95
   - Sales visible in table

### Scenario 3: Stock runs low
1. Chai Tea stock = 8
2. In Products page → shows yellow badge
3. Alert banner appears: "Low Stock Items"

### Scenario 4: Admin tries to delete sale
1. Login as admin
2. View sales
3. Click delete
4. Sale removed (stock NOT restored)

---

## 🔐 Security Checklist

✅ **Authentication**
- Email/password via Supabase Auth
- JWT tokens stored in browser
- Session management

✅ **Authorization**
- Role-based access (admin/staff)
- RLS policies enforce at database level
- ProtectedRoute components verify permissions

✅ **Data Protection**
- Never expose sensitive operations
- Stock auditing (no restoration)
- User isolation (can't see other user data)

✅ **Secrets**
- API keys in `.env.local` (not committed)
- Anon key is safe to expose
- Secret key never used in frontend

---

## 📚 Key TypeScript Types

```typescript
// User Model
interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "staff";
  created_at: string;
}

// Inventory Model
interface InventoryItem {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: integer;
  created_at: string;
  updated_at: string;
}

// Sales Models
interface Sale {
  id: string;
  user_id: string;
  date: string;
  total_amount: number;
  created_at: string;
}

interface SaleItem {
  id: string;
  sale_id: string;
  item_id: string;
  quantity: integer;
  price: number;
  created_at: string;
}

interface SaleWithItems extends Sale {
  items: SaleItem[];
}
```

---

## 🚀 Next Steps

1. **Deploy to Production**
   - Add env vars to Vercel/Netlify
   - Test all workflows
   - Monitor Supabase dashboard

2. **Add Features**
   - Customer management
   - Payment processing
   - Advanced reports
   - Multi-location support

3. **Optimize**
   - Add caching layer
   - Pagination for large datasets
   - Real-time notifications

---

This architecture provides:
- ✅ Type-safe database access
- ✅ Automatic stock management
- ✅ Role-based security
- ✅ Clean separation of concerns
- ✅ Easy to test and extend
