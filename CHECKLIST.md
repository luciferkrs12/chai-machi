# Implementation Checklist & Setup Verification

## 🎯 Pre-Setup Checklist

Before you start, make sure you have:

- [ ] Supabase account created (https://supabase.com)
- [ ] Node.js 22+ installed
- [ ] npm or yarn package manager
- [ ] This project open in VS Code
- [ ] 10-15 minutes of setup time

---

## 📋 Phase 1: Supabase Project Setup

### Create Supabase Project
- [ ] Visit https://supabase.com
- [ ] Click "Start your project"
- [ ] Create new project
- [ ] Set project name: `chai-machi` (or your choice)
- [ ] Create strong database password
- [ ] Select nearest region
- [ ] Click "Create new project"
- [ ] Wait 2-3 minutes for creation

### Get API Keys
- [ ] Go to **Settings** → **API**
- [ ] Copy `Project URL` value
- [ ] Copy `anon public` key value
- [ ] Keep these handy

---

## 📋 Phase 2: Environment Configuration

### Create .env.local
- [ ] Open `d:\works\chai machi\.env.local`
- [ ] Paste your Supabase URL:
  ```
  VITE_SUPABASE_URL=https://your-project.supabase.co
  ```
- [ ] Paste your anon key:
  ```
  VITE_SUPABASE_ANON_KEY=your-key-here
  ```
- [ ] Save file
- [ ] Verify `.env.local` is in `.gitignore`

### Verify Installation
```bash
cd "d:\works\chai machi"
npm list @supabase/supabase-js
# Should show: @supabase/supabase-js@x.x.x
```

If not installed:
```bash
npm install @supabase/supabase-js
```

---

## 📋 Phase 3: Database Setup

### Execute SQL Queries
1. [ ] Open Supabase dashboard
2. [ ] Go to **SQL Editor** (left sidebar)
3. [ ] Click **New Query** (or +)
4. [ ] Open `SUPABASE_SETUP.sql` in this project
5. [ ] Copy ALL SQL code
6. [ ] Paste into Supabase SQL Editor
7. [ ] Click **Run** button
8. [ ] Wait for success message
9. [ ] See 4 tables created:
   - [ ] `users`
   - [ ] `inventory`
   - [ ] `sales`
   - [ ] `sale_items`

### Verify Tables
- [ ] Go to **Database** → **Tables**
- [ ] See all 4 tables listed
- [ ] Click each table to verify columns

### Verify RLS Enabled
For each table:
- [ ] Click table name
- [ ] Go to **RLS** tab
- [ ] Verify **RLS is enabled**
- [ ] See multiple policies listed

---

## 📋 Phase 4: Authentication Setup

### Enable Email Auth
- [ ] Go to **Authentication** (left sidebar)
- [ ] Click **Providers**
- [ ] Find **Email**
- [ ] Toggle to **Enable**
- [ ] Click **Save**

### Email Templates
- [ ] Go to **Authentication** → **Email Templates**
- [ ] Verify default templates exist:
  - [ ] Confirm signup email
  - [ ] Reset password email
  - [ ] Magic link email

---

## 📋 Phase 5: Code Verification

### Check Files Exist
- [ ] `src/lib/supabase.ts` ✅ (NEW)
- [ ] `src/lib/auth.ts` ✅ (NEW)
- [ ] `src/lib/inventory.ts` ✅ (NEW)
- [ ] `src/lib/sales.ts` ✅ (NEW)
- [ ] `src/components/ProtectedRoute.tsx` ✅ (NEW)
- [ ] `src/contexts/AuthContext.tsx` ✅ (UPDATED)
- [ ] `src/components/Layout.tsx` ✅ (UPDATED)
- [ ] `src/pages/Login.tsx` ✅ (UPDATED)
- [ ] `src/pages/Products.tsx` ✅ (UPDATED)
- [ ] `src/pages/Orders.tsx` ✅ (UPDATED)

### Compile Check
```bash
npm run lint
# Should show no critical errors
```

---

## 📋 Phase 6: Test Run

### Start Development Server
```bash
npm run dev
```

- [ ] Server started on http://localhost:5173
- [ ] No compilation errors
- [ ] Browser opens automatically

### Navigate to App
- [ ] Open http://localhost:5173
- [ ] See login page
- [ ] Check for errors in browser console (F12)

---

## 📋 Phase 7: Authentication Test

### Test Signup (Create Staff Account)
1. [ ] Click **Sign Up** tab
2. [ ] Enter test account:
   - Name: `Test Staff`
   - Email: `staff@test.com`
   - Password: `Test@123`
3. [ ] Click "Create Account"
4. [ ] Wait for redirect to dashboard
5. [ ] See user name in top-right
6. [ ] See role as **Staff**

### Verify in Database
- [ ] Go to Supabase → Database → `users` table
- [ ] See row with email `staff@test.com`
- [ ] Verify role is `staff`
- [ ] Note the user ID

### Test Logout
1. [ ] Click user profile in top-right
2. [ ] Click **Logout**
3. [ ] See redirect to login page
4. [ ] Browser console should be clear

---

## 📋 Phase 8: Create Admin Account

### Signup Second Account
1. [ ] Go back to login
2. [ ] Click **Sign Up**
3. [ ] Create second account:
   - Name: `Test Admin`
   - Email: `admin@test.com`
   - Password: `Admin@123`
4. [ ] Complete signup and login

### Convert to Admin
1. [ ] Go to Supabase dashboard
2. [ ] Database → `users` table
3. [ ] Find row with email `admin@test.com`
4. [ ] Edit the row
5. [ ] Change `role` from `staff` to `admin`
6. [ ] Save changes

### Verify Admin Access
1. [ ] Go to http://localhost:5173
2. [ ] Logout (if logged in)
3. [ ] Login as admin@test.com
4. [ ] Verify name and role shown
5. [ ] Should show **Admin** as role

---

## 📋 Phase 9: Inventory Test

### As Admin - Add Product
1. [ ] Click **Products & Inventory** in sidebar
2. [ ] Click **Add Product** button
3. [ ] Fill form:
   - Name: `Chai Tea`
   - Category: `Beverages`
   - Price: `50`
   - Stock: `100`
4. [ ] Click **Save Product**
5. [ ] See product appear in list
6. [ ] Verify stock shows `100`

### Add More Products
1. [ ] Repeat above for:
   - Samosa | Snacks | 20 | 150
   - Coffee | Beverages | 60 | 80
   - Butter | Dairy | 150 | 50

### Verify in Database
- [ ] Check Supabase: `inventory` table
- [ ] See 4 products listed
- [ ] Verify stock values

### Test Edit
1. [ ] Click edit icon on "Chai Tea"
2. [ ] Change stock to 120
3. [ ] Click save
4. [ ] See stock updated

### Test Search
1. [ ] Search for "tea"
2. [ ] See "Chai Tea" result
3. [ ] Search for "Beverages"
4. [ ] See Chai Tea + Coffee

---

## 📋 Phase 10: Sales Test

### As Staff - Create Sale
1. [ ] Login as staff (if not already)
2. [ ] Click **Sales & Orders** in sidebar
3. [ ] Click **New Sale** button
4. [ ] Should see modal with:
   - Item selection dropdown
   - Quantity input
   - Price input
   - Add Item button
   - Complete Sale button

### Add Items to Sale
1. [ ] Select "Chai Tea" from dropdown
2. [ ] Enter qty: `5`
3. [ ] Verify price: `50`
4. [ ] Click **+ Add Item**
5. [ ] Select "Samosa"
6. [ ] Enter qty: `3`
7. [ ] Verify price: `20`
8. [ ] Verify total shows: `₹250` (5×50 + 3×20)

### Complete Sale
1. [ ] Click **Complete Sale**
2. [ ] Wait for processing
3. [ ] See modal close
4. [ ] Verify sale appears in table

### Verify Stock Reduced
1. [ ] Go to Products
2. [ ] Check Chai Tea: should be `95` (was 100, -5)
3. [ ] Check Samosa: should be `147` (was 150, -3)

### Check Sales Table
1. [ ] Go back to Sales
2. [ ] See sale in history
3. [ ] Amount shows: ₹250
4. [ ] Items count shows: 2

---

## 📋 Phase 11: Admin Features Test

### As Admin - Delete Sale
1. [ ] Login as admin
2. [ ] Go to Sales page
3. [ ] Click delete icon on a sale
4. [ ] Confirm deletion
5. [ ] Sale removed from list

**Note**: Stock is NOT restored (audit trail)

### As Admin - Delete Product
1. [ ] Go to Products
2. [ ] Click delete icon on a product
3. [ ] Confirm deletion
4. [ ] Product removed

---

## 📋 Phase 12: Low Stock Alert

### Reduce Stock to Test Alert
1. [ ] As admin, edit a product
2. [ ] Set stock to `7`
3. [ ] Save
4. [ ] Return to Products list
5. [ ] See yellow alert banner: "Low Stock Items"
6. [ ] See product with yellow badge showing `7`

---

## 📋 Phase 13: CSV Export Test

### Export Sales
1. [ ] Go to Sales page
2. [ ] Click **CSV** button
3. [ ] File downloads: `sales-TIMESTAMP.csv`
4. [ ] Open CSV file
5. [ ] Verify contains:
   - Header row
   - Sale IDs
   - Dates
   - Item counts
   - Amounts

---

## 📋 Phase 14: Error Handling Test

### Test Insufficient Stock Error
1. [ ] Go to Sales
2. [ ] Create new sale
3. [ ] Select product with low stock
4. [ ] Try quantity higher than stock
5. [ ] Complete sale
6. [ ] See error: "Insufficient stock"

### Test Empty Sale Error
1. [ ] Click New Sale
2. [ ] Try Complete Sale without adding items
3. [ ] See error message

---

## 📋 Phase 15: Access Control Test

### Staff Can't Access Admin Features
1. [ ] Logout and login as staff
2. [ ] Go to Products
3. [ ] "Add Product" button NOT visible
4. [ ] No edit/delete icons on products
5. [ ] Cannot add/modify inventory

### Staff Can Create Sales
1. [ ] As staff, go to Sales
2. [ ] "New Sale" button IS visible
3. [ ] Can complete sales
4. [ ] Can see sales history

### Admin Full Access
1. [ ] Login as admin
2. [ ] All buttons visible
3. [ ] Can create/edit/delete products
4. [ ] Can create/delete sales
5. [ ] Can view reports

---

## 📋 Phase 16: Real-time Test (Optional)

### Test Real-time Updates
1. [ ] Open app in 2 browser windows
2. [ ] Login as different users
3. [ ] One user creates sale
4. [ ] Other user should see it appear (if page has real-time)
5. [ ] Product stock reduces for both

---

## 📋 Phase 17: Mobile Responsiveness

### Test Mobile View
- [ ] Resize browser to mobile width (375px)
- [ ] Login page responsive ✓
- [ ] Products page responsive ✓
- [ ] Sales page responsive ✓
- [ ] All buttons clickable
- [ ] Forms readable

---

## 📋 Phase 18: Final Verification

### Code Quality
- [ ] Run `npm run lint` - no errors
- [ ] No console errors (F12)
- [ ] No TypeScript errors

### Database
- [ ] All tables exist ✓
- [ ] RLS enabled on all tables ✓
- [ ] Sample data present ✓

### Features
- [ ] Authentication working ✓
- [ ] Inventory management working ✓
- [ ] Sales tracking working ✓
- [ ] Stock reduction automatic ✓
- [ ] Low stock alerts showing ✓
- [ ] CSV export working ✓
- [ ] Logout working ✓

### Security
- [ ] Only admin can add/edit/delete products ✓
- [ ] Staff can't modify inventory ✓
- [ ] Both can create sales ✓
- [ ] Only admin can delete sales ✓
- [ ] .env.local not committed ✓

---

## 🚀 Go Live Checklist

Before deploying to production:

- [ ] All tests pass
- [ ] No console errors
- [ ] `.env.local` removed from repo
- [ ] `.env.local` added to `.gitignore`
- [ ] Environment variables set in hosting platform
- [ ] Database backup created
- [ ] RLS policies reviewed
- [ ] Admin account created in production
- [ ] Test user created in production
- [ ] All workflows tested in production
- [ ] Monitor Supabase dashboard
- [ ] Document admin credentials securely

---

## 📊 Testing Summary

```
✅ Authentication (Signup, Login, Logout)
✅ Authorization (Admin vs Staff access)
✅ Inventory (Add, Edit, Delete, Search)
✅ Sales (Create, View, Export)
✅ Stock (Auto-reduction, Low stock alert)
✅ Errors (Handling, Messages)
✅ UI (Responsive, Loading states)
✅ Database (Tables, RLS, Data integrity)
```

---

## ✅ You're Ready!

If all checkboxes are ✅, your system is **fully functional and production-ready**.

Next steps:
1. Deploy to production (Vercel, Netlify, etc)
2. Set up monitoring
3. Train users
4. Collect feedback
5. Iterate and improve

---

**Congratulations! Your Supabase + React inventory system is complete! 🎉**
