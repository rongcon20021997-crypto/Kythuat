/*
# Seed demo data for field service app

Provides starter customers, products, and a couple of tasks across regions
so both the admin web and technician mobile views have content to show.
*/

INSERT INTO customers (name, phone, address, region) VALUES
('Nguyễn Văn An', '0901 234 567', '12 Nguyễn Huệ, Q.1', 'TP.HCM - Trung tâm'),
('Trần Thị Bình', '0902 345 678', '45 Lê Lợi, Q.Bình Thạnh', 'TP.HCM - Bình Thạnh'),
('Lê Hoàng Cường', '0903 456 789', '78 Cách Mạng Tháng 8, Q.3', 'TP.HCM - Trung tâm'),
('Phạm Thị Dung', '0904 567 890', '23 Võ Văn Tần, Q.10', 'TP.HCM - Q.10'),
('Vũ Minh Đức', '0905 678 901', '99 Điện Biên Phủ, Q.Bình Thạnh', 'TP.HCM - Bình Thạnh')
ON CONFLICT DO NOTHING;

INSERT INTO products (name, sku, unit, price) VALUES
('Bảo trì máy lạnh treo tường', 'AC-MANT', 'sự vụ', 250000),
('Lắp đặt máy lạnh mới', 'AC-INST', 'sự vụ', 450000),
('Vệ sinh ống nước', 'PL-CLEAN', 'sự vụ', 180000),
('Sửa điện chung cư', 'EL-FIX', 'sự vụ', 200000),
('Van gas chính hãng', 'GAS-VALVE', 'cái', 85000)
ON CONFLICT DO NOTHING;

INSERT INTO tasks (code, customer_id, product_id, region, description, technician_name, status) VALUES
('TS-1001',
  (SELECT id FROM customers WHERE phone='0901 234 567'),
  (SELECT id FROM products WHERE sku='AC-MANT'),
  'TP.HCM - Trung tâm',
  'Khách báo máy lạnh冷的深度不够, cần kiểm tra gas và bảo trì.',
  'Kỹ thuật viên A - Trung tâm',
  'completed')
ON CONFLICT (code) DO NOTHING;

UPDATE tasks
SET notes='Đã sạc gas, vệ sinh màng lọc. Máy chạy ổn định.',
    check_in_at = now() - interval '3 hours',
    check_out_at = now() - interval '2 hours'
WHERE code = 'TS-1001';

INSERT INTO tasks (code, customer_id, product_id, region, description, technician_name, status) VALUES
('TS-1002',
  (SELECT id FROM customers WHERE phone='0902 345 678'),
  (SELECT id FROM products WHERE sku='AC-INST'),
  'TP.HCM - Bình Thạnh',
  'Khách mới mua máy, cần đặt lịch lắp đặt 2 máy lạnh tại nhà.',
  'Kỹ thuật viên B - Bình Thạnh',
  'assigned')
ON CONFLICT (code) DO NOTHING;

INSERT INTO tasks (code, customer_id, product_id, region, description, technician_name, status) VALUES
('TS-1003',
  (SELECT id FROM customers WHERE phone='0903 456 789'),
  (SELECT id FROM products WHERE sku='EL-FIX'),
  'TP.HCM - Trung tâm',
  'Hộp điện chung cư chập cháy, cần kiểm tra lại toàn bộ.',
  'Kỹ thuật viên A - Trung tâm',
  'checked_in')
ON CONFLICT (code) DO NOTHING;

UPDATE tasks
SET check_in_at = now() - interval '30 minutes'
WHERE code = 'TS-1003';

INSERT INTO service_history (customer_id, task_code, service_summary, performed_at)
SELECT id, 'TS-1001', 'Bảo trì máy lạnh, sạc gas, vệ sinh màng lọc', now() - interval '2 hours'
FROM customers WHERE phone='0901 234 567'
ON CONFLICT DO NOTHING;