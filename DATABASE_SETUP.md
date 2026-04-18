# Database Setup Guide

## Quick Start

The application is ready to use! Follow these steps to set up your Supabase database:

### Option 1: Automatic Setup (Recommended)
1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Open the **SQL Editor**
4. Copy and run the SQL below to create all tables

### Option 2: Manual Setup
If you prefer to create tables individually, use the queries in the "Individual Tables" section.

---

## SQL Setup Script (Copy & Run All)

```sql
-- Create Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Sales table
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Sale Items table
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS (Row Level Security)
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create public read policies (optional - adjust as needed)
CREATE POLICY "inventory_read" ON inventory FOR SELECT USING (true);
CREATE POLICY "inventory_write" ON inventory FOR INSERT WITH CHECK (true);
CREATE POLICY "inventory_update" ON inventory FOR UPDATE USING (true);

CREATE POLICY "sales_read" ON sales FOR SELECT USING (true);
CREATE POLICY "sales_write" ON sales FOR INSERT WITH CHECK (true);

CREATE POLICY "sale_items_read" ON sale_items FOR SELECT USING (true);
CREATE POLICY "sale_items_write" ON sale_items FOR INSERT WITH CHECK (true);

CREATE POLICY "users_read" ON users FOR SELECT USING (true);
```

---

## Individual Tables (Optional)

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Inventory Table
```sql
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Sales Table
```sql
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_amount DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Sale Items Table
```sql
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## After Setup

1. Run the full SQL script in your Supabase SQL Editor
2. Refresh your application
3. The app will detect the tables and initialize automatically
4. You'll see success notifications in the browser console

---

## Features Available

Once tables are created:
- ✅ Full Inventory Management (Add, Edit, Delete, Search)
- ✅ Real-time Stock Updates
- ✅ Sales Tracking with Multi-item Transactions
- ✅ Automatic Stock Reduction
- ✅ Sales Reporting
- ✅ CSV Export
- ✅ Low Stock Alerts

---

## Troubleshooting

### "Tables do not exist" error
- Copy and run the SQL setup script above
- Refresh your browser

### "Permission denied" error
- Ensure your Supabase service role has write access
- Check RLS policies are configured correctly

### "Connection failed" error
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are correct
- Check your internet connection

---

## Database Schema Diagram

```
users (id, name, email, role, created_at)
  ↑
  └─ sales (id, user_id*, date, total_amount, created_at)
       ↑
       └─ sale_items (id, sale_id*, item_id*, quantity, price)
            ↑
            └─ inventory (id, name, category, price, stock)
```

---

## API Endpoints (Code-level)

### Inventory CRUD
- `getInventory()` - Get all items
- `addInventoryItem(item)` - Create new item
- `updateInventoryItem(id, updates)` - Update item
- `deleteInventoryItem(id)` - Delete item
- `reduceStock(id, qty)` - Reduce stock and validate
- `searchInventory(query)` - Search items
- `subscribeToInventory(callback)` - Real-time updates

### Sales CRUD
- `getSales()` - Get all sales
- `createSale(items, userId)` - Create multi-item sale
- `deleteSale(id)` - Delete sale
- `getSalesReport(startDate, endDate)` - Generate report

---

**Need help?** Check the browser console for detailed logs about database operations.
