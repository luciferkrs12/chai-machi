# Admin Account Setup

Since the app uses **login only** (no signup), you need to manually create the admin account in Supabase.

## Steps:

### 1. Create Database Tables First
Run the SQL script from `DATABASE_SETUP.md` in Supabase SQL Editor to create all tables.

### 2. Create Auth User in Supabase

Go to **Supabase Dashboard** → **Authentication** → **Users** and click **+ Add user**

Create account with:
- **Email**: `naren2004dn@gmail.com`
- **Password**: `Naren@0921`
- **Auto Confirm User**: ✅ Check this box

Click **Create User**

### 3. Create User Record in Database

Go to **Supabase Dashboard** → **SQL Editor** and run:

```sql
INSERT INTO users (id, email, name, role, created_at, updated_at)
SELECT id, email, 'Admin User' as name, 'admin' as role, NOW(), NOW()
FROM auth.users
WHERE email = 'naren2004dn@gmail.com'
ON CONFLICT (id) DO NOTHING;
```

### 4. Test Login

1. Refresh app at `http://localhost:5174/`
2. Enter:
   - Email: `naren2004dn@gmail.com`
   - Password: `Naren@0921`
3. Click **Sign In**
4. Should redirect to `/dashboard`

## Complete Flow

```
Login Page (/)
    ↓
Sign In with credentials
    ↓
Dashboard (/dashboard)
    ↓
Can access: Inventory, Sales, Products, Orders, Reports, Customers, Tables
```

## Troubleshooting

**Error: "Invalid credentials"**
- Check auth user exists in Supabase Authentication
- Check password is exactly: `Naren@0921`
- Check email is exactly: `naren2004dn@gmail.com`

**Error: "User not found in database"**
- Check users table was created (from DATABASE_SETUP.md)
- Run the INSERT query from step 3 above
- Check user record matches the auth user ID
