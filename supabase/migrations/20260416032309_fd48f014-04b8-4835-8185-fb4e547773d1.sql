
-- Customers table
CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  phone text,
  address text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Anyone can insert customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update customers" ON public.customers FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete customers" ON public.customers FOR DELETE USING (true);

-- Payments table
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  amount_paid numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'Cash',
  reference_note text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read payments" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Anyone can insert payments" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update payments" ON public.payments FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete payments" ON public.payments FOR DELETE USING (true);

-- Settings table
CREATE TABLE public.settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert settings" ON public.settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update settings" ON public.settings FOR UPDATE USING (true);

-- Add customer_id and payment_method to orders
ALTER TABLE public.orders ADD COLUMN customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN payment_method text DEFAULT 'Cash';

-- Indexes
CREATE INDEX idx_payments_customer_id ON public.payments(customer_id);
CREATE INDEX idx_payments_order_id ON public.payments(order_id);
CREATE INDEX idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX idx_settings_key ON public.settings(key);

-- Seed default settings
INSERT INTO public.settings (key, value) VALUES ('upi_id', 'bakeryname@okaxis');
INSERT INTO public.settings (key, value) VALUES ('bakery_name', 'My Bakery');
