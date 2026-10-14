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
    ('33333333-3333-3333-3333-333333333307', 'Bubble Wrap Roll 30cm x 50m', 'packaging', 'meter', 50, 5, 1500, 'Shopee'),
    ('33333333-3333-3333-3333-333333333308', 'Sticker Label / Branding', 'packaging', 'pcs', 100, 10, 1000, 'Percetakan')
ON CONFLICT DO NOTHING;

-- 4. Initial Assets (from Table 3: Capital Purchases)
INSERT INTO public.assets (id, name, category, purchase_date, purchase_price, residual_value, useful_life_months, estimated_hours_per_month, power_watts, status)
VALUES
    ('44444444-4444-4444-4444-444444444401', 'Mesin Bambulab A1 Mini', 'printer_3d', '2026-08-01', 3589221, 500000, 24, 150, 60, 'ACTIVE'),
    ('44444444-4444-4444-4444-444444444402', 'Mesin Anycubic Kobra X', 'printer_3d', '2026-08-01', 5872800, 500000, 24, 150, 110, 'ACTIVE'),
    ('44444444-4444-4444-4444-444444444403', 'Jangka Sorong Digital', 'tool', '2026-08-01', 47499, 0, 24, 50, 0, 'ACTIVE'),
    ('44444444-4444-4444-4444-444444444404', 'Magnet Neodium Bulat 20Pcs (3 set)', 'tool', '2026-08-01', 47000, 0, 24, 50, 0, 'ACTIVE')
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
