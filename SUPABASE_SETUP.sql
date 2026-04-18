-- ========================================
-- SUPABASE TABLE SETUP SQL QUERIES
-- ========================================
-- Run these queries in your Supabase SQL Editor
-- to create all required tables with proper schema

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can read all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert users" ON users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (
    auth.uid() = id
    AND role IN ('staff', 'admin')
    AND (
      role = 'staff'
      OR auth.email() IN ('naren2004dn@gmail.com', 'naren092104@gmail.com')
    )
  );

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can update any user" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete any user" ON users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 1.5 CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and staff can read customers" ON customers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admin and staff can insert customers" ON customers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Only admins can update customers" ON customers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete customers" ON customers
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  category TEXT DEFAULT 'Other',
  total_sold INTEGER NOT NULL DEFAULT 0,
  daily_added_stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- For upgrading existing databases without dropping the table:
ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Other';

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read products" ON products
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert products" ON products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update products" ON products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete products" ON products
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 3. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('dine_in', 'takeaway')) DEFAULT 'dine_in',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and staff can read orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Admin and staff can insert orders" ON orders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Only admins can update orders" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete orders" ON orders
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. STOCK_LOGS TABLE
CREATE TABLE IF NOT EXISTS stock_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  added_quantity INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE stock_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and staff can read stock logs" ON stock_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Only admins can insert stock logs" ON stock_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5. STOCK MANAGEMENT FUNCTION
CREATE OR REPLACE FUNCTION add_stock(p_product_id UUID, p_added_quantity INTEGER)
RETURNS products LANGUAGE sql SECURITY DEFINER AS $$
  WITH log_insert AS (
    INSERT INTO stock_logs (product_id, added_quantity)
    VALUES (p_product_id, p_added_quantity)
  )
  UPDATE products
  SET stock = stock + p_added_quantity,
      daily_added_stock = daily_added_stock + p_added_quantity
  WHERE id = p_product_id
  RETURNING *;
$$;

-- 6. ORDER CREATION FUNCTION
CREATE OR REPLACE FUNCTION place_order(p_product_id UUID, p_quantity INTEGER, p_customer_id UUID DEFAULT NULL, p_order_type TEXT DEFAULT 'dine_in')
RETURNS orders LANGUAGE sql SECURITY DEFINER AS $$
  WITH updated_product AS (
    UPDATE products
    SET stock = stock - p_quantity,
        total_sold = total_sold + p_quantity
    WHERE id = p_product_id AND stock >= p_quantity
    RETURNING id, price
  )
  INSERT INTO orders (product_id, quantity, total_price, customer_id, order_type)
  SELECT 
    updated_product.id, 
    p_quantity, 
    updated_product.price * p_quantity, 
    p_customer_id, 
    p_order_type
  FROM updated_product
  RETURNING *;
$$;

-- 7. SAMPLE DATA
INSERT INTO products (name, price, stock, category, total_sold, daily_added_stock)
VALUES
  ('Chai Tea', 50.00, 100, 'Beverage', 0, 0),
  ('Coffee', 60.00, 80, 'Beverage', 0, 0),
  ('Samosa', 20.00, 150, 'Snack', 0, 0),
  ('Bread', 40.00, 200, 'Bread', 0, 0),
  ('Butter', 150.00, 50, 'Other', 0, 0)
ON CONFLICT DO NOTHING;
