-- ====================================================================
-- CASA MORAL 3D PRINTING MANAGEMENT SYSTEM - SEED DATA
-- Generated from actual business data: HPP CASA MORAL V2.xlsx & Orderan Casa Moral.xlsx
-- ====================================================================

-- 1. Product Categories
INSERT INTO public.product_categories (id, name)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Lampu Ambient')
ON CONFLICT (name) DO NOTHING;

-- 2. Expense Categories
INSERT INTO public.expense_categories (id, name, is_fixed_cost)
VALUES
    ('22222222-2222-2222-2222-222222222221', 'Iklan & Pemasaran (Ads)', true),
    ('22222222-2222-2222-2222-222222222222', 'Listrik & Utilitas Non-Produksi', true),
    ('22222222-2222-2222-2222-222222222223', 'Internet, Wifi & Software', true),
    ('22222222-2222-2222-2222-222222222224', 'Maintenance & Sparepart Mesin', true),
    ('22222222-2222-2222-2222-222222222225', 'Operasional & Perlengkapan Lainnya', true)
ON CONFLICT (name) DO NOTHING;

-- 3. Initial Materials (from Table 1 & Table 3)
INSERT INTO public.materials (id, name, category, unit, current_stock, min_stock_alert, cost_per_unit, supplier)
VALUES
    ('33333333-3333-3333-3333-333333333301', 'Filamen PLA/PETG Standar', 'filament', 'gram', 10000, 1000, 180, 'Shopee'),
    ('33333333-3333-3333-3333-333333333302', 'Lampu LED Bulb / Module 3W', 'electrical', 'pcs', 10, 3, 15000, 'Shopee (Inlite)'),
    ('33333333-3333-3333-3333-333333333303', 'Fitting E27', 'electrical', 'pcs', 20, 5, 6000, 'Shopee'),
    ('33333333-3333-3333-3333-333333333304', 'Kabel Sakelar On/Off', 'electrical', 'pcs', 20, 5, 10000, 'Shopee'),
    ('33333333-3333-3333-3333-333333333305', 'Karet Pelindung Kabel', 'electrical', 'pcs', 30, 5, 700, 'Shopee'),
    ('33333333-3333-3333-3333-333333333306', 'Kardus Kemasan Karton 20x20x20', 'packaging', 'pcs', 20, 5, 4500, 'Shopee'),
    ('33333333-3333-3333-3333-333333333307', 'Bubble Wrap Roll 30cm x 50m', 'packaging', 'meter', 50, 5, 1500, 'Shopee')
ON CONFLICT DO NOTHING;

-- 4. Initial Assets (from data/moral_lab_expenses.csv)
INSERT INTO public.assets (id, name, category, purchase_date, purchase_price, residual_value, useful_life_months, estimated_hours_per_month, power_watts, status)
VALUES
    ('44444444-4444-4444-4444-444444444401', 'Mesin Bambulab A1 Mini', 'printer_3d', '2026-09-23', 3589221, 500000, 24, 150, 60, 'ACTIVE'),
    ('44444444-4444-4444-4444-444444444402', 'Mesin Anycubic Kobra X', 'printer_3d', '2026-10-14', 5870800, 500000, 24, 150, 110, 'ACTIVE'),
    ('44444444-4444-4444-4444-444444444403', 'Vernier Caliper (Sigma/Jangka Sorong)', 'tool', '2026-10-13', 48099, 0, 24, 50, 0, 'ACTIVE'),
    ('44444444-4444-4444-4444-444444444404', 'Magnet Neodymium (60pcs uk 3 x 2)', 'tool', '2026-10-13', 48000, 0, 24, 50, 0, 'ACTIVE')
ON CONFLICT DO NOTHING;

-- 5. Products (from Table 2: Lumi, Ollie, Kumo, Pomi)
INSERT INTO public.products (id, sku, name, category_id, description, dimensions, calculation_mode, standard_overhead_multiplier, current_hpp, recommended_price, selling_price, markup_percent, is_active)
VALUES
    (
        '55555555-5555-5555-5555-555555555501',
        'CM-LUMI-01',
        'Lampu Ambient - Lumi',
        '11111111-1111-1111-1111-111111111111',
        'Lampu meja ambient 3D print model Lumi (Shade + Base, tanpa Cap).',
        '{"height_mm": 150, "width_mm": 170, "shade_height_mm": 80, "base_height_mm": 70}',
        'STANDARD',
        1.20,
        81182.40,
        121773.60,
        120000.00,
        50.00,
        true
    ),
    (
        '55555555-5555-5555-5555-555555555502',
        'CM-OLLIE-01',
        'Lampu Ambient - Ollie',
        '11111111-1111-1111-1111-111111111111',
        'Lampu meja ambient 3D print model Ollie (Shade + Base + Cap atas). Best seller.',
        '{"height_mm": 180, "width_mm": 163.3, "shade_height_mm": 80, "base_height_mm": 100}',
        'STANDARD',
        1.20,
        89705.28,
        134557.92,
        130000.00,
        50.00,
        true
    ),
    (
        '55555555-5555-5555-5555-555555555503',
        'CM-KUMO-01',
        'Lampu Ambient - Kumo',
        '11111111-1111-1111-1111-111111111111',
        'Lampu meja ambient 3D print model Kumo bentuk awan halus.',
        '{"height_mm": 160, "width_mm": 160, "shade_height_mm": 80, "base_height_mm": 80}',
        'STANDARD',
        1.20,
        82588.08,
        123882.12,
        125000.00,
        50.00,
        true
    ),
    (
        '55555555-5555-5555-5555-555555555504',
        'CM-POMI-01',
        'Lampu Ambient - Pomi',
        '11111111-1111-1111-1111-111111111111',
        'Lampu meja ambient 3D print model Pomi ukuran besar bertekstur modern.',
        '{"height_mm": 200, "width_mm": 180, "shade_height_mm": 100, "base_height_mm": 100}',
        'STANDARD',
        1.20,
        103892.16,
        155838.24,
        150000.00,
        50.00,
        true
    )
ON CONFLICT (sku) DO NOTHING;

-- 6. Customers (Sheet: Orderan Casa Moral.xlsx)
INSERT INTO public.customers (id, name, city, channel_source)
VALUES
    ('66666666-6666-6666-6666-666666666601', 'Mahput', 'Sukamara', 'Shopee'),
    ('66666666-6666-6666-6666-666666666602', 'Gress', 'Palangka Raya', 'Direct'),
    ('66666666-6666-6666-6666-666666666603', 'Acil Ely', 'Sukamara', 'Direct'),
    ('66666666-6666-6666-6666-666666666604', 'Pelanggan Umum (Sukamara)', 'Sukamara', 'Direct'),
    ('66666666-6666-6666-6666-666666666605', 'Istri Om Ridwan', 'Sukamara', 'Direct'),
    ('66666666-6666-6666-6666-666666666606', 'Bang Dona', 'Sukamara', 'Direct'),
    ('66666666-6666-6666-6666-666666666607', 'Pelanggan Display / Sampel', 'Sukamara', 'Direct'),
    ('66666666-6666-6666-6666-666666666608', 'Wahyu', 'Palangka Raya', 'Direct'),
    ('66666666-6666-6666-6666-666666666609', 'Mama', 'Sukamara', 'Direct')
ON CONFLICT DO NOTHING;

-- 7. Orders (9 Historical Orders from Orderan Casa Moral.xlsx, Total: Rp 945.000)
INSERT INTO public.orders (id, order_number, order_date, customer_id, channel, status, subtotal_amount, add_on_amount, discount_amount, shipping_cost, platform_fee, total_amount, payment_status, paid_amount, notes)
VALUES
    ('77777777-7777-7777-7777-777777777701', 'ORD-2026-001', '2026-08-05 10:00:00+00', '66666666-6666-6666-6666-666666666601', 'Shopee', 'COMPLETED', 130000, 0, 0, 0, 15600, 130000, 'UNPAID', 0, 'Order via Shopee, checkout Sukamara'),
    ('77777777-7777-7777-7777-777777777702', 'ORD-2026-002', '2026-08-06 11:00:00+00', '66666666-6666-6666-6666-666666666602', 'Direct', 'COMPLETED', 115000, 0, 15000, 0, 0, 115000, 'UNPAID', 0, 'Harga khusus promosi awal (Rp 115.000)'),
    ('77777777-7777-7777-7777-777777777703', 'ORD-2026-003', '2026-08-07 14:00:00+00', '66666666-6666-6666-6666-666666666603', 'Direct', 'COMPLETED', 130000, 0, 0, 0, 0, 130000, 'UNPAID', 0, 'Pesanan Sukamara'),
    ('77777777-7777-7777-7777-777777777704', 'ORD-2026-004', '2026-08-08 09:30:00+00', '66666666-6666-6666-6666-666666666604', 'Direct', 'COMPLETED', 150000, 0, 0, 0, 0, 150000, 'UNPAID', 0, 'Model Pomi (baris 10 Excel tanpa nama pelanggan)'),
    ('77777777-7777-7777-7777-777777777705', 'ORD-2026-005', '2026-08-09 16:00:00+00', '66666666-6666-6666-6666-666666666605', 'Direct', 'COMPLETED', 130000, 0, 0, 0, 0, 130000, 'UNPAID', 0, 'Pesanan keluarga Sukamara'),
    ('77777777-7777-7777-7777-777777777706', 'ORD-2026-006', '2026-08-10 11:00:00+00', '66666666-6666-6666-6666-666666666606', 'Direct', 'COMPLETED', 0, 0, 0, 0, 0, 0, 'UNPAID', 0, 'Unit sampel / hadiah promosi Bang Dona (Rp 0)'),
    ('77777777-7777-7777-7777-777777777707', 'ORD-2026-007', '2026-08-11 13:00:00+00', '66666666-6666-6666-6666-666666666607', 'Direct', 'COMPLETED', 0, 0, 0, 0, 0, 0, 'UNPAID', 0, 'Unit display / sampel studio Kumo (Rp 0, baris 13 Excel)'),
    ('77777777-7777-7777-7777-777777777708', 'ORD-2026-008', '2026-08-12 15:30:00+00', '66666666-6666-6666-6666-666666666608', 'Direct', 'COMPLETED', 130000, 30000, 0, 0, 0, 160000, 'PAID', 160000, 'Lunas transfer. Kustom cap figur Lee Jeno (+Rp 30.000)'),
    ('77777777-7777-7777-7777-777777777709', 'ORD-2026-009', '2026-08-13 10:00:00+00', '66666666-6666-6666-6666-666666666609', 'Direct', 'COMPLETED', 130000, 0, 0, 0, 0, 130000, 'PAID', 130000, 'Lunas. Ollie tanpa cap atas.')
ON CONFLICT (order_number) DO NOTHING;

-- 8. Order Items with Immutable HPP Snapshot
INSERT INTO public.order_items (id, order_id, product_id, quantity, unit_price, unit_hpp, color_details, add_on_name, add_on_price, subtotal)
VALUES
    ('88888888-8888-8888-8888-888888888801', '77777777-7777-7777-7777-777777777701', '55555555-5555-5555-5555-555555555502', 1, 130000, 89705.28, 'Base Pink + Shade Putih + Cap Putih', null, 0, 130000),
    ('88888888-8888-8888-8888-888888888802', '77777777-7777-7777-7777-777777777702', '55555555-5555-5555-5555-555555555502', 1, 115000, 89705.28, 'Base Oren + Shade Putih + Cap Oren', null, 0, 115000),
    ('88888888-8888-8888-8888-888888888803', '77777777-7777-7777-7777-777777777703', '55555555-5555-5555-5555-555555555502', 1, 130000, 89705.28, 'Base Oren + Shade Putih + Cap Oren', null, 0, 130000),
    ('88888888-8888-8888-8888-888888888804', '77777777-7777-7777-7777-777777777704', '55555555-5555-5555-5555-555555555504', 1, 150000, 103892.16, 'Base Oren + Shade Putih + Cap Oren', null, 0, 150000),
    ('88888888-8888-8888-8888-888888888805', '77777777-7777-7777-7777-777777777705', '55555555-5555-5555-5555-555555555502', 1, 130000, 89705.28, 'Base Oren + Shade Putih + Cap Oren', null, 0, 130000),
    ('88888888-8888-8888-8888-888888888806', '77777777-7777-7777-7777-777777777706', '55555555-5555-5555-5555-555555555502', 1, 0, 89705.28, 'Base Oren + Shade Putih + Cap Oren', null, 0, 0),
    ('88888888-8888-8888-8888-888888888807', '77777777-7777-7777-7777-777777777707', '55555555-5555-5555-5555-555555555503', 1, 0, 82588.08, 'Base Oren + Shade Putih', null, 0, 0),
    ('88888888-8888-8888-8888-888888888808', '77777777-7777-7777-7777-777777777708', '55555555-5555-5555-5555-555555555502', 1, 130000, 89705.28, 'Base Oren + Shade Putih + Cap Oren', 'Cap Custom Figur Lee Jeno', 30000, 160000),
    ('88888888-8888-8888-8888-888888888809', '77777777-7777-7777-7777-777777777709', '55555555-5555-5555-5555-555555555502', 1, 130000, 89705.28, 'Base Oren + Shade Putih No Cap', null, 0, 130000)
ON CONFLICT DO NOTHING;
