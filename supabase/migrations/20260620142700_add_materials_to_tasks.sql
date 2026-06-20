-- Migration: Add materials column and photos column to tasks table and classify products
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS materials jsonb DEFAULT '[]'::jsonb;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS photos jsonb DEFAULT '[]'::jsonb;

-- Add type column to products table (service = Dịch vụ chính, material = Vật tư phụ tùng)
ALTER TABLE products ADD COLUMN IF NOT EXISTS type text DEFAULT 'service';

-- Update existing default products to their proper types
UPDATE products SET type = 'service' WHERE sku IN ('AC-MANT', 'AC-INST', 'PL-CLEAN', 'EL-FIX');
UPDATE products SET type = 'material' WHERE sku = 'GAS-VALVE';

-- Insert additional sample materials (vật tư phụ tùng) if they do not exist
INSERT INTO products (name, sku, unit, price, type)
SELECT 'Ống đồng máy lạnh 6/10', 'AC-TUBE-610', 'mét', 150000, 'material'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'AC-TUBE-610');

INSERT INTO products (name, sku, unit, price, type)
SELECT 'Gas máy lạnh R32 Ấn Độ', 'AC-GAS-R32', 'hộp', 320000, 'material'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'AC-GAS-R32');

INSERT INTO products (name, sku, unit, price, type)
SELECT 'Aptomat 20A Panasonic', 'EL-CB-20A', 'cái', 115000, 'material'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'EL-CB-20A');

INSERT INTO products (name, sku, unit, price, type)
SELECT 'Băng keo điện Nano', 'EL-TAPE', 'cuộn', 15000, 'material'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'EL-TAPE');

-- Update task TS-1001 with sample materials and photos
UPDATE tasks
SET materials = jsonb_build_array(
  jsonb_build_object(
    'id', (SELECT id::text FROM products WHERE sku = 'GAS-VALVE' LIMIT 1),
    'name', 'Van gas chính hãng',
    'sku', 'GAS-VALVE',
    'price', 85000,
    'unit', 'cái',
    'quantity', 2
  ),
  jsonb_build_object(
    'id', (SELECT id::text FROM products WHERE sku = 'AC-TUBE-610' LIMIT 1),
    'name', 'Ống đồng máy lạnh 6/10',
    'sku', 'AC-TUBE-610',
    'price', 150000,
    'unit', 'mét',
    'quantity', 3
  )
),
photos = jsonb_build_array(
  'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400'
)
WHERE code = 'TS-1001';
