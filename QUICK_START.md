# 🚀 Quick Start Guide - Chai Machine

## ⏱️ 5-Minute Setup

### 1️⃣ **Install Dependencies** (1 min)
```bash
npm install
```

### 2️⃣ **Configure Supabase** (1 min)

Create file: `.env.local`
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

Get these from Supabase Dashboard → Settings → API

### 3️⃣ **Create Database Tables** (2 min)

**Option A: Copy & Paste (Easiest)**
1. Open [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor**
4. Paste this entire SQL block:

```sql
-- Create Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Sales table
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_amount DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Sale Items table
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create basic policies
CREATE POLICY "inventory_public" ON inventory FOR SELECT USING (true);
CREATE POLICY "inventory_insert" ON inventory FOR INSERT WITH CHECK (true);
CREATE POLICY "sales_public" ON sales FOR SELECT USING (true);
CREATE POLICY "sales_insert" ON sales FOR INSERT WITH CHECK (true);
CREATE POLICY "sale_items_public" ON sale_items FOR SELECT USING (true);
CREATE POLICY "sale_items_insert" ON sale_items FOR INSERT WITH CHECK (true);
```

5. Click **Run** (or Ctrl+Enter)
6. Done! ✅

### 4️⃣ **Start Development** (1 min)
```bash
npm run dev
```

### 5️⃣ **Open Browser**
```
http://localhost:5173
```

---

## 📍 Where to Go

| Feature | URL | What You Can Do |
|---------|-----|-----------------|
| **Inventory** | `/inventory` | Add/Edit/Delete products, Search, Stock tracking |
| **Sales** | `/sales` | Create sales, Track revenue, Export CSV |
| **Dashboard** | `/dashboard` | Overview and stats |
| **Login** | `/` | Sign in / Sign up |

---

## 🎮 Quick Tutorial

### Adding a Product
1. Go to `/inventory`
2. Click **"Add Product"**
3. Fill in:
   - Product Name: `Chai Tea`
   - Category: `Beverages`
   - Price: `50`
   - Stock: `100`
4. Click **"Add"**
5. See it appear instantly! ✨

### Creating a Sale
1. Go to `/sales`
2. Click **"New Sale"**
3. Select product and quantity
4. Click **"+ Add Item"** to add more
5. Click **"Complete Sale"**
6. Stock auto-reduces! ✅

---

## 🧪 Verify Setup

### Check Connection
```bash
# In browser console (F12):
# Should show: ✅ Connected to Supabase
```

### Check Tables
```bash
# In browser console:
# Should show all 4 tables exist:
# ✅ users
# ✅ inventory
# ✅ sales
# ✅ sale_items
```

### Test CRUD
1. Add a product
2. Edit the product
3. Delete the product
4. Should all work! ✅

---

## 📁 Project Structure

```
src/
├── components/
│   ├── InventoryManager.tsx    ← Inventory UI
│   ├── SalesManager.tsx         ← Sales UI
│   └── ui/                      ← Pre-built components
├── hooks/
│   └── useAppData.ts            ← Data management
├── lib/
│   ├── supabase.ts              ← Supabase config
│   ├── crud-inventory.ts        ← Product operations
│   └── crud-sales.ts            ← Sale operations
└── pages/
    ├── Dashboard.tsx
    ├── Login.tsx
    └── ...
```

---

## 💡 Common Tasks

### Add a Product Programmatically
```typescript
import { useInventory } from '@/hooks/useAppData'

function MyComponent() {
  const { addItem } = useInventory()
  
  const handleAdd = async () => {
    await addItem({
      name: 'Chai',
      category: 'Beverage',
      price: 50,
      stock: 100
    })
  }
  
  return <button onClick={handleAdd}>Add</button>
}
```

### Track Inventory Changes
```typescript
import { useInventory } from '@/hooks/useAppData'

function MyComponent() {
  const { items } = useInventory()
  
  useEffect(() => {
    console.log('Inventory updated:', items)
  }, [items])
  
  return <div>{items.length} products</div>
}
```

### Create a Multi-Item Sale
```typescript
import { useSales } from '@/hooks/useAppData'

function MyComponent() {
  const { addSale } = useSales()
  
  const handleCreateSale = async () => {
    await addSale([
      { item_id: 'abc-123', quantity: 2, price: 50 },
      { item_id: 'def-456', quantity: 1, price: 75 }
    ])
    // Stock auto-reduces!
  }
}
```

---

## ⚠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| "Tables do not exist" | Run SQL script above in Supabase SQL Editor |
| "Cannot find module" | Run `npm install` |
| "Connection failed" | Check `.env.local` has correct URL & key |
| "RLS error" | Run the RLS policy creation SQL above |
| "Real-time not working" | Ensure Realtime is enabled in Supabase |

---

## 📚 Read More

- **Full documentation**: See `PROJECT_README.md`
- **Database setup**: See `DATABASE_SETUP.md`
- **API reference**: See `PROJECT_README.md` → API Reference section
- **Implementation details**: See `IMPLEMENTATION_SUMMARY.md`

---

## 🎯 Success Checklist

- ✅ Environment variables set in `.env.local`
- ✅ SQL tables created in Supabase
- ✅ `npm run dev` starts without errors
- ✅ Can visit `/inventory` page
- ✅ Can add a product
- ✅ Product appears instantly (real-time)
- ✅ Can create a sale
- ✅ Stock decreases automatically
- ✅ Can search products
- ✅ Can export CSV

---

## 🚀 Next Steps

1. **Explore the code** - Check `src/components/InventoryManager.tsx`
2. **Customize design** - Edit Tailwind classes
3. **Add features** - Use `useInventory()` and `useSales()` hooks
4. **Deploy** - `npm run build && npm run preview`

---

## 💬 Need Help?

1. Check browser console (F12) for errors
2. Look at Supabase logs → API Requests
3. See troubleshooting section above
4. Read `PROJECT_README.md` for detailed docs

---

**Everything ready!** Start with `/inventory` page. 🎉
