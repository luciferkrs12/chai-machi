# Supabase Integration - Complete Setup Guide

## 🚀 Quick Start

This project now uses **Supabase** as a backend-less solution for authentication, inventory management, and sales tracking.

---

## 📋 Prerequisites

- [ ] Supabase Account (free at https://supabase.com)
- [ ] Node.js 22+ installed
- [ ] `.env.local` file in project root

---

## 1️⃣ SETUP SUPABASE PROJECT

### Step 1.1: Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Enter project name: `chai-machi` (or any name)
4. Create a strong database password
5. Select region closest to your location
6. Wait for project to be created (~2-3 minutes)

### Step 1.2: Get API Keys

1. Open your project
2. Go to **Settings** → **API**
3. Copy these values:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`

### Step 1.3: Add Keys to `.env.local`

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-key-here
```

---

## 2️⃣ CREATE DATABASE TABLES

### Step 2.1: Open SQL Editor

1. In Supabase dashboard
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**

### Step 2.2: Run SQL Setup

1. Copy all SQL from `SUPABASE_SETUP.sql` file
2. Paste into SQL Editor
3. Click **Run** button
4. Wait for completion

✅ Tables created:
- `users` - User accounts with roles
- `inventory` - Products with stock
- `sales` - Sales transactions
- `sale_items` - Individual items in sales

---

## 3️⃣ ENABLE AUTHENTICATION

### Step 3.1: Enable Email Auth

1. Go to **Authentication** → **Providers**
2. Find **Email**
3. Click toggle to enable
4. Click **Save**

### Step 3.2: Email Templates

1. Go to **Authentication** → **Email Templates**
2. Verify default templates are set (they should be)

---

## 4️⃣ CONFIGURE ROW LEVEL SECURITY (RLS)

✅ **Already configured** in `SUPABASE_SETUP.sql`

RLS Policies:
- **Admin**: Full access to all tables
- **Staff**: Can read inventory, create sales, but cannot delete
- **Everyone**: Can read inventory

---

## 5️⃣ INSTALL DEPENDENCIES

All dependencies already installed. If not:

```bash
npm install @supabase/supabase-js
```

---

## 📝 HOW TO USE

### Authentication Flow

```typescript
import { signUp, signIn, signOut } from "@/lib/auth";

// Sign up new user (creates staff account)
const { user, error } = await signUp("user@email.com", "password", "User Name");

// Sign in
const { user, error } = await signIn("user@email.com", "password");

// Sign out
const { error } = await signOut();
```

### Inventory Management

```typescript
import { 
  getAllInventory, 
  addInventoryItem, 
  updateInventoryItem, 
  deleteInventoryItem 
} from "@/lib/inventory";

// Get all items
const { items, error } = await getAllInventory();

// Add item (Admin only)
const { item, error } = await addInventoryItem({
  name: "Chai Tea",
  category: "Beverages",
  price: 50,
  stock: 100
});

// Update item
const { item, error } = await updateInventoryItem(itemId, {
  stock: 120,
  price: 55
});

// Delete item
const { success, error } = await deleteInventoryItem(itemId);
```

### Sales Tracking

```typescript
import { 
  getAllSales, 
  createSale, 
  deleteSale 
} from "@/lib/sales";

// Get all sales
const { sales, error } = await getAllSales();

// Create sale (automatically reduces stock)
const { sale, error } = await createSale(userId, [
  { item_id: "uuid-1", quantity: 2, price: 50 },
  { item_id: "uuid-2", quantity: 1, price: 100 }
]);
// Total: ₹200
// Stock is automatically reduced for each item

// Get sales report
const { report, error } = await getSalesReport(
  "2024-01-01",
  "2024-12-31"
);
```

---

## 🔐 USER ROLES

### Admin
- Create, edit, delete products
- View all sales
- Delete sales (data integrity)
- Manage inventory

### Staff
- View inventory
- Create sales
- Cannot delete products
- Cannot modify past sales

---

## 📊 FEATURES

### ✅ Implemented

- [x] Email/Password Authentication
- [x] Role-based Access Control (Admin/Staff)
- [x] Product/Inventory Management
  - Add, edit, delete items
  - Track stock levels
  - Low stock alerts
- [x] Sales Transactions
  - Create sales with multiple items
  - Auto-calculate totals
  - Stock reduction on sale
- [x] Sales Reports
  - View all sales
  - Export to CSV
  - Revenue tracking
- [x] Row Level Security (RLS)
  - Admin full access
  - Staff limited access

---

## 🧪 TESTING

### Test Admin Account

1. Sign up with:
   - Email: `admin@test.com`
   - Password: `Test@123`
   - Name: `Admin User`

2. Go to Supabase Dashboard → `users` table
3. Edit the row and change role to `admin`

### Test Staff Account

1. Sign up normally (role auto-set to `staff`)

### Test Inventory

1. As admin, go to **Products & Inventory**
2. Click **Add Product**
3. Fill details and save

### Test Sales

1. Go to **Sales & Orders**
2. Click **New Sale**
3. Select product, quantity, price
4. Complete sale

---

## 🐛 TROUBLESHOOTING

### Error: "Missing Supabase environment variables"

**Solution**: Check `.env.local` file exists and contains:
```
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```

### Error: "Row level security violation"

**Solution**: 
- Check you're logged in
- Verify your role in database
- Admin can do everything, staff is limited
- Refresh page and try again

### Error: "Stock cannot go below 0"

**Solution**: 
- You don't have enough stock
- Either reduce sale quantity or add more stock

### Cannot log in

**Solution**:
- Check email is correct
- Verify password (case sensitive)
- Make sure account was created (check email verification if required)

---

## 📚 FILE STRUCTURE

```
src/
├── lib/
│   ├── supabase.ts          # Client setup & types
│   ├── auth.ts              # Authentication functions
│   ├── inventory.ts         # Inventory CRUD
│   └── sales.ts             # Sales CRUD
├── contexts/
│   ├── AuthContext.tsx      # Auth state management
│   └── DataContext.tsx      # (Keep existing)
├── components/
│   ├── ProtectedRoute.tsx   # Route protection
│   ├── Layout.tsx           # Main layout
│   └── ...others
└── pages/
    ├── Login.tsx            # Auth page
    ├── Products.tsx         # Inventory management
    ├── Orders.tsx           # Sales tracking
    └── ...others
```

---

## 🔄 DATABASE SCHEMA

### users
```sql
- id (uuid, primary key)
- name (text)
- email (text, unique)
- role (text: admin/staff)
- created_at (timestamp)
```

### inventory
```sql
- id (uuid, primary key)
- name (text)
- category (text)
- price (numeric)
- stock (integer)
- created_at (timestamp)
- updated_at (timestamp)
```

### sales
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key → users)
- date (timestamp)
- total_amount (numeric)
- created_at (timestamp)
```

### sale_items
```sql
- id (uuid, primary key)
- sale_id (uuid, foreign key → sales)
- item_id (uuid, foreign key → inventory)
- quantity (integer)
- price (numeric)
- created_at (timestamp)
```

---

## 🚀 DEPLOYMENT

### Environment Variables for Production

Add to your hosting platform (Vercel, Netlify, etc):
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Security Notes

- Never commit `.env.local`
- Anon key is safe to expose (RLS protects data)
- Enable Supabase password protection in production
- Use strong database passwords
- Regularly review RLS policies

---

## 📞 SUPPORT RESOURCES

- Supabase Docs: https://supabase.com/docs
- API Reference: https://supabase.com/docs/reference
- GitHub Issues: Report bugs in your repository

---

## ✅ CHECKLIST

Before going live:

- [ ] Supabase project created
- [ ] Environment variables added
- [ ] SQL queries executed
- [ ] Authentication enabled
- [ ] RLS policies verified
- [ ] Tested signup/login
- [ ] Tested product creation (as admin)
- [ ] Tested sales creation
- [ ] Stock reduction verified
- [ ] CSV export works
- [ ] Mobile responsiveness checked

---

**You're all set! 🎉**

Your Supabase + React inventory and sales system is now ready to use.
