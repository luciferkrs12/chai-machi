# Supabase + React Inventory & Sales System

Complete, production-ready inventory management and sales tracking system built with **React**, **TypeScript**, **Supabase**, and **Tailwind CSS**.

## ✨ Features

### 🔐 Authentication
- Email/password signup and login
- Role-based access (Admin & Staff)
- Persistent sessions
- Secure logout

### 📦 Inventory Management
- Add, edit, delete products
- Stock tracking with levels
- Low stock alerts
- Search and filter
- Category grouping

### 💳 Sales Tracking
- Multi-item transactions
- Automatic stock reduction
- Price override per sale
- Revenue reporting
- CSV export

### 🔒 Security
- Row Level Security (RLS)
- Admin-only operations
- Staff limited access
- Data isolation
- Audit trail

---

## 🚀 Quick Start (5 Minutes)

### 1️⃣ Create Supabase Project

```bash
# Visit https://supabase.com
# Create new project → Get API Keys
```

### 2️⃣ Add Environment Variables

Create `.env.local` in project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-key-here
```

### 3️⃣ Setup Database

1. Open Supabase dashboard → SQL Editor
2. Copy & paste entire `SUPABASE_SETUP.sql` file
3. Click Run
4. Wait for completion

### 4️⃣ Test It

```bash
npm install
npm run dev
```

Visit `http://localhost:5173` and signup!

---

## 📋 Detailed Setup Guide

See **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** for:
- Step-by-step Supabase configuration
- Database table creation
- Email authentication setup
- RLS policies explanation
- Troubleshooting

---

## 🎯 Usage

### Create Admin Account

1. Sign up normally (auto-creates staff account)
2. Go to Supabase → Database → users table
3. Edit row: change `role` from `staff` to `admin`
4. Login again

### Add Products (as Admin)

1. Go to Products page
2. Click "Add Product"
3. Fill: Name, Category, Price, Stock
4. Save

### Create Sale (as Staff/Admin)

1. Go to Sales page
2. Click "New Sale"
3. Select item → Enter quantity & price
4. Click "+ Add Item" for more
5. Click "Complete Sale"
6. Stock auto-reduced ✓

### Export Data

- Click CSV button on Sales page
- Downloads sales report

---

## 📁 Project Structure

```
src/
├── lib/
│   ├── supabase.ts       # Client setup
│   ├── auth.ts           # Authentication
│   ├── inventory.ts      # Products CRUD
│   └── sales.ts          # Sales CRUD
├── contexts/
│   ├── AuthContext.tsx   # Auth state
│   └── DataContext.tsx   # (existing)
├── components/
│   ├── ProtectedRoute.tsx # Route guard
│   ├── Layout.tsx        # Main layout
│   └── ...
└── pages/
    ├── Login.tsx         # Auth page
    ├── Products.tsx      # Inventory
    ├── Orders.tsx        # Sales
    └── ...
```

---

## 🔑 Key API Functions

### Authentication
```typescript
import { signUp, signIn, signOut, getCurrentUser } from "@/lib/auth";

await signUp("user@email.com", "password", "Name");
await signIn("user@email.com", "password");
await signOut();
```

### Inventory
```typescript
import { 
  getAllInventory, 
  addInventoryItem, 
  updateInventoryItem, 
  deleteInventoryItem 
} from "@/lib/inventory";

const { items } = await getAllInventory();
await addInventoryItem({ name, category, price, stock });
```

### Sales
```typescript
import { 
  getAllSales, 
  createSale, 
  getSalesReport 
} from "@/lib/sales";

await createSale(userId, [
  { item_id: "uuid", quantity: 2, price: 50 }
]);
```

See **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** for complete API docs.

---

## 🏗️ Architecture

```
Frontend (React)
     ↓
Service Layer (auth.ts, inventory.ts, sales.ts)
     ↓
Supabase Client SDK
     ↓
PostgreSQL Database + Auth
```

See **[ARCHITECTURE.md](./ARCHITECTURE.md)** for detailed diagrams and explanations.

---

## 🔐 Security Model

### Admin Role
- ✅ Create, edit, delete products
- ✅ View and delete sales
- ✅ Manage inventory

### Staff Role
- ✅ View inventory
- ✅ Create sales
- ❌ Cannot delete products
- ❌ Cannot modify sales

All enforced by **Row Level Security (RLS)** at database level.

---

## 📊 Database Schema

### users
```sql
id (uuid), name, email (unique), role (admin/staff), created_at
```

### inventory
```sql
id (uuid), name, category, price, stock, created_at, updated_at
```

### sales
```sql
id (uuid), user_id (FK), date, total_amount, created_at
```

### sale_items
```sql
id (uuid), sale_id (FK), item_id (FK), quantity, price, created_at
```

---

## 🧪 Testing

### Test Accounts

```
Admin:
- Email: admin@test.com
- Password: Test@123
- Role: admin (set manually)

Staff:
- Email: staff@test.com
- Password: Test@123
- Role: staff (auto-assigned)
```

### Test Scenarios

1. **Signup** → Login → See dashboard
2. **Add Product** (as admin) → See in inventory
3. **Create Sale** → See stock reduce
4. **Low Stock Alert** → Stock < 10
5. **Logout** → Redirected to login

---

## 🐛 Troubleshooting

### "Missing Supabase environment variables"
→ Check `.env.local` file exists with correct keys

### "Row level security violation"
→ Check your role (admin/staff) in users table

### "Insufficient stock"
→ Reduce sale quantity or add more stock

### "Cannot login"
→ Verify email/password, check account exists

See **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** for more troubleshooting.

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| **SETUP_GUIDE.md** | Step-by-step setup instructions |
| **ARCHITECTURE.md** | System design & data flows |
| **QUICK_REFERENCE.md** | API functions & examples |
| **SUPABASE_SETUP.sql** | Database creation queries |
| **IMPLEMENTATION_SUMMARY.md** | Changes made to project |

---

## 🚀 Deployment

### Environment Variables

Add to your hosting (Vercel, Netlify, etc):
```
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```

### Build & Deploy

```bash
npm run build
# Deploy dist/ folder
```

---

## 🔄 Next Steps

1. ✅ **Setup Supabase** (follow SETUP_GUIDE.md)
2. ✅ **Create test accounts**
3. ✅ **Test all features**
4. ✅ **Deploy to production**
5. ✅ **Collect feedback & iterate**

---

## 📞 Resources

- **Supabase Docs**: https://supabase.com/docs
- **React Router**: https://tanstack.com/router
- **Tailwind CSS**: https://tailwindcss.com
- **TypeScript**: https://www.typescriptlang.org

---

## 📝 License

This project is ready for commercial use. Modify as needed for your business.

---

## ✅ Implementation Checklist

- [x] Authentication system (signup/login/logout)
- [x] Role-based access control
- [x] Inventory management (CRUD)
- [x] Stock tracking
- [x] Sales transactions
- [x] Automatic stock reduction
- [x] Sales reporting
- [x] CSV export
- [x] Row Level Security
- [x] Error handling
- [x] Loading states
- [x] Responsive UI
- [x] TypeScript types
- [x] Documentation

---

**Ready to go live! 🎉**

Start with [SETUP_GUIDE.md](./SETUP_GUIDE.md) →

---

## Support

For questions or issues:
1. Check documentation files
2. Review error messages in browser console
3. Verify Supabase configuration
4. Check that RLS policies are enabled
