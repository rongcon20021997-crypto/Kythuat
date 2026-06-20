/*
# Field Service Management Schema (single-tenant, no auth)

## Purpose
Simulates a field-service platform where Telesales (web admin) dispatch tasks
to Technicians (mobile app), technicians check-in/out on site, and telesales
verifies completion.

## 1. New Tables

### customers
- id (uuid PK)
- name (text)
- phone (text)
- address (text)
- region (text) - service area grouping used to route tasks to technicians
- created_at (timestamptz)

### products
- id (uuid PK)
- name (text)
- sku (text)
- unit (text) - e.g. "cai", "met", "hop"
- price (numeric) - service/material price
- created_at (timestamptz)

### tasks
- id (uuid PK)
- code (text) - human-readable task code e.g. TS-1001
- customer_id (uuid FK customers)
- product_id (uuid FK products, nullable - material/service requested)
- region (text) - denormalized from customer for routing
- description (text) - what the telesale requested
- technician_name (text, nullable) - assigned technician
- status (text) - one of: assigned, accepted, checked_in, completed, verified
- notes (text, nullable) - technician field notes
- check_in_at (timestamptz, nullable)
- check_out_at (timestamptz, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)

### service_history
- id (uuid PK)
- customer_id (uuid FK customers)
- task_code (text, nullable) - relates to a task if applicable
- service_summary (text)
- performed_at (timestamptz)
- created_at (timestamptz)

## 2. Security
- RLS enabled on every table.
- Single-tenant demo: anon + authenticated CRUD allowed (intentionally shared data).

## 3. Notes
- updated_at auto-maintained by trigger to reflect task lifecycle changes.
*/

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  address text,
  region text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sku text,
  unit text DEFAULT 'cai',
  price numeric(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  region text,
  description text NOT NULL,
  technician_name text,
  status text NOT NULL DEFAULT 'assigned',
  notes text,
  check_in_at timestamptz,
  check_out_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  task_code text,
  service_summary text,
  performed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_crud_customers" ON customers;
CREATE POLICY "anon_crud_customers" ON customers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_ins_customers" ON customers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_upd_customers" ON customers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_del_customers" ON customers FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_crud_products" ON products;
CREATE POLICY "anon_crud_products" ON products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_ins_products" ON products FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_upd_products" ON products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_del_products" ON products FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_crud_tasks" ON tasks;
CREATE POLICY "anon_crud_tasks" ON tasks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_ins_tasks" ON tasks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_upd_tasks" ON tasks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_del_tasks" ON tasks FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_crud_history" ON service_history;
CREATE POLICY "anon_crud_history" ON service_history FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_ins_history" ON service_history FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_upd_history" ON service_history FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_del_history" ON service_history FOR DELETE TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tasks_touch ON tasks;
CREATE TRIGGER trg_tasks_touch BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();