# Chai Machine - Inventory & Sales Management System

A modern, **production-ready** inventory and sales management system built with React, TypeScript, Supabase, and Tailwind CSS. Features real-time updates, multi-item transactions, and automatic stock management.

---

## 🎯 Features

### Inventory Management
- ✅ **Full CRUD Operations** - Add, edit, delete, search products
- ✅ **Stock Tracking** - Real-time inventory levels with low-stock alerts
- ✅ **Search & Filter** - Search by product name or category
- ✅ **Stock Visualization** - Color-coded stock levels (red < 10, green >= 10)
- ✅ **Real-time Updates** - Changes sync instantly across users

### Sales Management
- ✅ **Multi-item Transactions** - Create sales with multiple products in one transaction
- ✅ **Automatic Stock Reduction** - Stock automatically decreases when items are sold
- ✅ **Sales History** - View all transactions with timestamps and amounts
- ✅ **CSV Export** - Export sales data for reporting
- ✅ **Real-time Sync** - Sales appear instantly for all users
- ✅ **Revenue Tracking** - Total revenue calculation and display

### Technical Features
- ✅ **Type-Safe** - Full TypeScript implementation
- ✅ **Real-time Database** - Supabase PostgreSQL with live subscriptions
- ✅ **Error Handling** - Comprehensive error management and user feedback
- ✅ **Loading States** - Smooth loading indicators and skeleton screens
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile
- ✅ **Animation** - Smooth transitions with Framer Motion

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (free tier works!)

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Supabase
a. Create a project at [supabase.com](https://supabase.com)
b. Get your credentials from **Project Settings > API**
c. Create `.env.local`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### 3. Setup Database
Follow the [DATABASE_SETUP.md](./DATABASE_SETUP.md) guide:
- Copy the SQL setup script
- Run it in your Supabase SQL Editor
- Tables are created automatically

### 4. Start Development
```bash
npm run dev
```

### 5. Build for Production
```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
src/
├── components/
│   ├── InventoryManager.tsx    # Inventory UI component
│   ├── SalesManager.tsx         # Sales UI component
│   ├── Layout.tsx               # App layout wrapper
│   └── ui/                      # Reusable UI components (buttons, modals, etc.)
├── contexts/
│   ├── AuthContext.tsx          # Authentication context
│   └── DataContext.tsx          # Global data state
├── hooks/
│   └── useAppData.ts            # Custom hooks for inventory & sales data
├── lib/
│   ├── supabase.ts              # Supabase client & types
│   ├── initialization.ts        # DB initialization
│   ├── crud-inventory.ts        # Inventory API operations
│   └── crud-sales.ts            # Sales API operations
├── pages/
│   ├── Dashboard.tsx            # Main dashboard
│   ├── Login.tsx                # Authentication
│   ├── Products.tsx             # Product management
│   ├── Orders.tsx               # Orders view
│   └── ...other pages
└── App.tsx                       # Main app component
```

---

## 🔧 API Reference

### Inventory Functions (`src/lib/crud-inventory.ts`)

```typescript
// Get all inventory items
getInventory(): Promise<{ items: InventoryItem[], error: string | null }>

// Get single item
getInventoryItem(id: string): Promise<{ item: InventoryItem | null, error }>

// Add new product
addInventoryItem(item): Promise<{ item: InventoryItem | null, error }>

// Update product
updateInventoryItem(id, updates): Promise<{ item: InventoryItem | null, error }>

// Delete product
deleteInventoryItem(id): Promise<{ success: boolean, error }>

// Reduce stock when item is sold
reduceStock(id, quantity): Promise<{ success: boolean, error }>

// Search products
searchInventory(query): Promise<{ items: InventoryItem[], error }>

// Subscribe to real-time updates
subscribeToInventory(callback): () => void  // Returns unsubscribe function
```

### Sales Functions (`src/lib/crud-sales.ts`)

```typescript
// Get all sales with items
getSales(): Promise<{ sales: SaleWithItems[], error }>

// Get single sale
getSale(id): Promise<{ sale: SaleWithItems | null, error }>

// Create multi-item sale (auto-reduces stock)
createSale(items, userId?): Promise<{ sale: Sale | null, error }>

// Delete sale
deleteSale(id): Promise<{ success: boolean, error }>

// Generate sales report
getSalesReport(startDate, endDate): Promise<{ report: {...}, error }>

// Subscribe to real-time updates
subscribeToSales(callback): () => void
```

### React Hooks (`src/hooks/useAppData.ts`)

```typescript
// Inventory hook with state management
const {
  items,           // Array of products
  loading,         // Loading state
  error,           // Error message if any
  addItem,         // Add new item
  updateItem,      // Update existing item
  deleteItem,      // Delete item
  search,          // Search products
  refresh          // Manual refresh
} = useInventory()

// Sales hook with state management
const {
  sales,           // Array of sales
  loading,
  error,
  addSale,         // Create new sale
  removeSale,      // Delete sale
  refresh
} = useSales()

// Combined hook for initialization
const {
  inventory,       // useInventory result
  sales,           // useSales result
  isInitialized,   // Both loaded
  isLoading        // Either loading
} = useAppData()
```

---

## 💾 Database Schema

### `inventory`
```sql
id         UUID PRIMARY KEY
name       TEXT NOT NULL
category   TEXT NOT NULL
price      DECIMAL(10,2) NOT NULL
stock      INTEGER DEFAULT 0
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

### `sales`
```sql
id            UUID PRIMARY KEY
user_id       UUID (references users)
date          TIMESTAMP DEFAULT NOW()
total_amount  DECIMAL(12,2) NOT NULL
created_at    TIMESTAMP DEFAULT NOW()
```

### `sale_items`
```sql
id        UUID PRIMARY KEY
sale_id   UUID (references sales)
item_id   UUID (references inventory)
quantity  INTEGER NOT NULL
price     DECIMAL(10,2) NOT NULL
created_at TIMESTAMP DEFAULT NOW()
```

### `users`
```sql
id         UUID PRIMARY KEY
name       TEXT NOT NULL
email      TEXT UNIQUE NOT NULL
role       TEXT ('admin' | 'staff')
created_at TIMESTAMP DEFAULT NOW()
```

---

## 🎨 UI Components

### InventoryManager
Main component for inventory management:
- Add/Edit/Delete products
- Search functionality
- Low-stock alerts
- Real-time updates

Usage:
```tsx
import InventoryManager from '@/components/InventoryManager'

export default function Page() {
  return <InventoryManager />
}
```

### SalesManager  
Main component for sales tracking:
- Create multi-item sales
- View sales history
- Export to CSV
- Real-time updates

Usage:
```tsx
import SalesManager from '@/components/SalesManager'

export default function Page() {
  return <SalesManager />
}
```

---

## 🔐 Authentication & Security

- ✅ Supabase Auth with email/password
- ✅ Role-based access control (admin/staff)
- ✅ Row Level Security (RLS) policies
- ✅ Protected routes on frontend
- ✅ Secure database access via policies

**Note**: For production, configure RLS policies in Supabase to restrict data access per user/role.

---

## ⚡ Performance Features

- **Real-time Subscriptions**: Uses Supabase Realtime for instant updates
- **Optimistic Updates**: UI updates immediately, syncs with DB
- **Lazy Loading**: Components load data on-demand
- **Memoization**: React hooks prevent unnecessary renders
- **Code Splitting**: Separate bundle for each route

---

## 🐛 Error Handling

All API functions return `{ data, error }` pattern:

```typescript
const { items, error } = await getInventory()

if (error) {
  console.error('Failed to load inventory:', error)
  // Handle error gracefully
} else {
  // Use items
}
```

UI Components display:
- Error banners with actionable messages
- Loading skeletons during data fetch
- Retry buttons when operations fail
- Toast notifications for success/failure

---

## 📊 Example Usage

### Add a Product
```typescript
const { items, addItem } = useInventory()

const handleAddProduct = async () => {
  const result = await addItem({
    name: 'Chai Tea',
    category: 'Beverages',
    price: 50,
    stock: 100
  })
  
  if (result) {
    console.log('Product added!')
  }
}
```

### Create a Sale
```typescript
const { sales, addSale } = useSales()

const handleCreateSale = async () => {
  const result = await addSale([
    { item_id: 'abc-123', quantity: 2, price: 50 },
    { item_id: 'def-456', quantity: 1, price: 75 }
  ])
  
  if (result) {
    console.log('Sale created! Stock auto-reduced.')
  }
}
```

### Subscribe to Changes
```typescript
const { inventory } = useInventory()

useEffect(() => {
  // Component re-renders when inventory changes
  console.log('Inventory updated:', inventory)
}, [inventory])
```

---

## 🚨 Troubleshooting

### "Tables do not exist" Error
→ See [DATABASE_SETUP.md](./DATABASE_SETUP.md)

### "Connection failed" Error
→ Check `VITE_SUPABASE_URL` and API keys in `.env.local`

### "Permission denied" Error
→ Check RLS policies or service role access

### Real-time updates not working
→ Ensure Realtime is enabled in Supabase Dashboard

### Items not appearing
→ Ensure tables are created before first use

---

## 📦 Dependencies

- **react** - UI library
- **react-router-dom** - Routing
- **@supabase/supabase-js** - Backend
- **framer-motion** - Animations
- **lucide-react** - Icons
- **tailwindcss** - Styling
- **typescript** - Type safety
- **react-query** - Data fetching (optional, can be replaced)

---

## 🔄 Data Flow

```
User Interaction
    ↓
React Component (InventoryManager, SalesManager)
    ↓
Custom Hooks (useInventory, useSales)
    ↓
CRUD Functions (crud-inventory.ts, crud-sales.ts)
    ↓
Supabase Client (supabase.ts)
    ↓
PostgreSQL Database
    ↓
Real-time Subscription
    ↓
UI Updates (Live)
```

---

## 🎓 Best Practices

1. **Always use TypeScript** - Full type safety for data operations
2. **Handle errors gracefully** - Never crash, show user-friendly messages
3. **Use custom hooks** - Encapsulate data logic in useInventory, useSales
4. **Real-time subscriptions** - Subscribe in useEffect, unsubscribe on cleanup
5. **Optimize queries** - Only fetch what you need
6. **Cache results** - Use React Query for efficient caching

---

## 📈 Future Enhancements

- [ ] Multi-location inventory
- [ ] Supplier management
- [ ] Purchase orders
- [ ] Discount codes
- [ ] Advanced analytics
- [ ] Barcode scanning
- [ ] Mobile app
- [ ] API rate limiting
- [ ] Audit logging
- [ ] Inventory forecasting

---

## 📝 License

MIT - Feel free to use this template for your projects!

---

## 🤝 Support

For issues or questions:
1. Check [DATABASE_SETUP.md](./DATABASE_SETUP.md) for common issues
2. Review browser console for detailed error messages
3. Check Supabase logs for backend errors

---

**Happy coding! 🚀**
