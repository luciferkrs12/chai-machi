

# Bakery Billing Application — Build Plan

This is a fresh project with no existing bakery code or Supabase connection. We need to build everything from scratch.

## Prerequisites

**Supabase Connection**: You'll need to enable Lovable Cloud (Supabase) for this project. I'll set up the database tables and connect everything once approved.

**Currency**: I'll use ₹ (INR) since this appears to be an Indian bakery app. Let me know if you prefer a different currency.

**Menu Items**: I'll include sample bakery products (Bread, Cake, Cookies, Pastry, etc.) with a product management UI so you can add/edit items.

**Tables**: I'll set up 5 tables (Table 1–5) + Takeaway, with the ability to add more.

---

## Database Schema (Supabase Migrations)

### Table: `products`
- `id` (uuid, PK), `name` (text), `price` (numeric), `category` (text), `is_active` (boolean), `created_at` (timestamptz)

### Table: `orders`
- `id` (uuid, PK), `table_name` (text), `total_amount` (numeric), `payment_status` (text, default 'Pending'), `created_at` (timestamptz)

### Table: `order_items`
- `id` (uuid, PK), `order_id` (uuid, FK → orders), `product_id` (uuid, FK → products), `product_name` (text), `quantity` (int), `price` (numeric), `subtotal` (numeric)

RLS policies: Enable read/insert/update for authenticated users (or anon if no auth needed).

---

## Application Routes

| Route | Purpose |
|-------|---------|
| `/` | Dashboard — today's stats (sales, orders, paid/pending) |
| `/tables` | Table selection grid — click a table to start billing |
| `/billing/$tableName` | Billing screen for a specific table — add items, create order |
| `/orders` | All orders list with search, filter by status/date |
| `/reports` | Reports page — daily/monthly reports, date picker, export |
| `/products` | Product management — add/edit/delete menu items |

---

## Key Features by Route

### Dashboard (`/`)
- 4 stat cards: Today's Sales, Total Orders, Paid Amount, Pending Amount
- Quick links to Tables and Reports

### Tables (`/tables`)
- Grid of table cards (Table 1–5, Takeaway)
- Each card shows active order status if any
- Click → navigate to billing screen

### Billing (`/billing/$tableName`)
- Product grid with categories
- Cart/order items list with quantity controls
- Total calculation
- "Create Bill" button → saves order as Pending
- "Mark as Paid" button for existing pending orders

### Orders (`/orders`)
- Searchable, filterable table of all orders
- Filters: payment status (Pending/Paid), date range, table name
- Color-coded status badges (Red = Pending, Green = Paid)
- Click to view order details

### Reports (`/reports`)
- Date picker and month selector filters
- Daily summary: total sales, order count, paid vs pending
- Monthly summary with top-selling products
- Orders table with all columns
- CSV export button

### Products (`/products`)
- CRUD for menu items (name, price, category)

---

## Technical Approach

- **Data fetching**: Supabase client with TanStack Query for caching
- **Real-time**: Supabase realtime subscriptions on orders table
- **UI**: Shadcn components (Card, Table, Badge, Button, Calendar, Select, Input)
- **Charts**: Recharts (already installed) for monthly report graphs
- **Export**: Client-side CSV generation, optional PDF
- **State**: URL search params for filters (date, status) via TanStack Router

---

## Dependencies to Add
- `@supabase/supabase-js` — Supabase client
- `@tanstack/zod-adapter` — for search param validation

---

## Files to Create (~15 files)

1. Supabase client (`src/lib/supabase.ts`)
2. Database types (`src/lib/database.types.ts`)
3. 6 route files (dashboard, tables, billing, orders, reports, products)
4. Shared layout component with sidebar navigation
5. Reusable components (StatCard, OrderStatusBadge, ProductGrid)
6. Query hooks for orders, products, reports
7. CSV export utility

Seed data migration for sample products.

