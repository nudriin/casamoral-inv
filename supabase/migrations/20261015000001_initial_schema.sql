-- ====================================================================
-- CASA MORAL 3D PRINTING MANAGEMENT SYSTEM - INITIAL DATABASE SCHEMA
-- Migration: 20261015000001_initial_schema.sql
-- Single Source of Truth: docs/DATABASE_DESIGN.md
-- ====================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 2. USERS & PROFILES
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('owner', 'admin', 'operator')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- 3. CUSTOMERS (OMNICHANNEL DIRECTORY)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    city TEXT,
    channel_source TEXT NOT NULL DEFAULT 'Direct' CHECK (channel_source IN ('Direct', 'Shopee', 'WhatsApp', 'Instagram', 'Other')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- 4. MATERIALS & INVENTORY (FILAMENTS, ELECTRICAL, PACKAGING)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('filament', 'electrical', 'packaging', 'hardware', 'other')),
    unit TEXT NOT NULL CHECK (unit IN ('gram', 'pcs', 'meter', 'roll', 'set')),
    current_stock NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    min_stock_alert NUMERIC(12, 2) NOT NULL DEFAULT 0,
    cost_per_unit NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (cost_per_unit >= 0),
    supplier TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit log for every single stock change
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('PURCHASE', 'PRODUCTION_USAGE', 'WASTE_ADJUSTMENT', 'MANUAL_CORRECTION', 'RETURN')),
    quantity NUMERIC(12, 2) NOT NULL, -- positive for incoming, negative for outgoing
    reference_id UUID,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- 5. ASSETS & 3D PRINTERS (FIXED ASSETS & DEPRECIATION)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('printer_3d', 'tool', 'computer', 'furniture')),
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    purchase_price NUMERIC(15, 2) NOT NULL CHECK (purchase_price > 0),
    residual_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
    useful_life_months INT NOT NULL DEFAULT 24 CHECK (useful_life_months > 0),
    estimated_hours_per_month NUMERIC(8, 2) DEFAULT 150,
    power_watts NUMERIC(8, 2) DEFAULT 100,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'MAINTENANCE', 'RETIRED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- 6. PRODUCT CATALOG & BILL OF MATERIALS (BOM)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT UNIQUE,
    name TEXT NOT NULL,
    category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
    description TEXT,
    dimensions JSONB,
    calculation_mode TEXT NOT NULL DEFAULT 'STANDARD' CHECK (calculation_mode IN ('STANDARD', 'ADVANCED')),
    standard_overhead_multiplier NUMERIC(5, 2) NOT NULL DEFAULT 1.20,
    print_time_minutes NUMERIC(8, 2) NOT NULL DEFAULT 0,
    current_hpp NUMERIC(15, 2) NOT NULL DEFAULT 0,
    recommended_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    selling_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    markup_percent NUMERIC(5, 2) NOT NULL DEFAULT 50.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    component_type TEXT NOT NULL CHECK (component_type IN ('SHADE', 'BASE', 'CAP', 'ELECTRICAL', 'PACKAGING', 'ACCESSORY')),
    material_id UUID REFERENCES public.materials(id) ON DELETE RESTRICT,
    quantity NUMERIC(8, 2) NOT NULL CHECK (quantity >= 0),
    unit_cost_snapshot NUMERIC(15, 2) NOT NULL DEFAULT 0,
    subtotal_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- 7. ORDERS, ORDER ITEMS & TRANSACTIONS
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    channel TEXT NOT NULL DEFAULT 'Direct' CHECK (channel IN ('Direct', 'Shopee', 'WhatsApp', 'Instagram', 'Other')),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'READY', 'SHIPPED', 'COMPLETED', 'CANCELLED')),
    subtotal_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    add_on_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    shipping_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    platform_fee NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'REFUNDED')),
    paid_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(15, 2) NOT NULL, -- Transaction price snapshot
    unit_hpp NUMERIC(15, 2) NOT NULL,   -- HPP snapshot at order time
    color_details TEXT,
    add_on_name TEXT,
    add_on_price NUMERIC(15, 2) DEFAULT 0,
    subtotal NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL DEFAULT 'TRANSFER' CHECK (payment_method IN ('TRANSFER', 'CASH', 'SHOPEE_PAYOUT', 'QRIS')),
    reference_number TEXT,
    proof_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- 8. EXPENSES & OVERHEAD
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    is_fixed_cost BOOLEAN NOT NULL DEFAULT TRUE, -- For BEP calculation
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category_id UUID NOT NULL REFERENCES public.expense_categories(id) ON DELETE RESTRICT,
    description TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL DEFAULT 'TRANSFER' CHECK (payment_method IN ('TRANSFER', 'CASH', 'SHOPEE_PAYOUT', 'QRIS')),
    is_capital_expenditure BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- 9. PERFORMANCE INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);
CREATE INDEX IF NOT EXISTS idx_materials_category ON public.materials(category);
CREATE INDEX IF NOT EXISTS idx_stock_movements_mat_id ON public.stock_movements(material_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_date ON public.orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date);

-- ====================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full read/write access to business management tables
CREATE POLICY "Auth users access profiles" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users access customers" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users access materials" ON public.materials FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users access stock_movements" ON public.stock_movements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users access assets" ON public.assets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users access product_categories" ON public.product_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users access products" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users access product_components" ON public.product_components FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users access orders" ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users access order_items" ON public.order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users access payments" ON public.payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users access expense_categories" ON public.expense_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users access expenses" ON public.expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);
