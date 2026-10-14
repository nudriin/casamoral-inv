-- ====================================================================
-- CASA MORAL 3D PRINTING — REVISION & FEATURE COMPLETION MIGRATION
-- Migration: 20261015000002_revisions_and_payables.sql
-- ====================================================================

-- 1. EXTEND PRODUCTS TABLE FOR PRODUCT & MODEL HIERARCHY
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'PRINTED' CHECK (product_type IN ('PRINTED', 'MANUFACTURED', 'PROCURED', 'CUSTOM')),
ADD COLUMN IF NOT EXISTS color_variants JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS pricing_source TEXT NOT NULL DEFAULT 'INDIVIDUAL' CHECK (pricing_source IN ('GLOBAL', 'CATEGORY', 'INDIVIDUAL')),
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_products_parent_id ON public.products(parent_id);
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_archived ON public.products(is_archived);

-- 2. CREATE BUSINESS SETTINGS TABLE (GLOBAL PRICING, MARKETPLACE FEES, PRODUCTION ASSUMPTIONS)
CREATE TABLE IF NOT EXISTS public.business_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users access business_settings" ON public.business_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed initial business settings if not exists
INSERT INTO public.business_settings (key, value, description)
VALUES 
(
    'marketplace_fees',
    '{"shopee_admin_fee_percent": 8.0, "shopee_free_shipping_fee_percent": 4.0, "shopee_free_shipping_cap": 10000, "extra_platform_fee": 0, "promo_discount_borne_by_seller": 0}'::jsonb,
    'Konfigurasi potongan platform marketplace (Shopee admin 8%, gratis ongkir 4% max 10rb)'
),
(
    'global_pricing',
    '{"pricing_mode": "INDIVIDUAL", "default_markup_percent": 50.0, "default_margin_percent": 33.33, "apply_to": "ALL"}'::jsonb,
    'Pengaturan penetapan harga jual global (Markup vs Margin vs Individual Override)'
),
(
    'production_assumptions',
    '{"electricity_rate_kwh": 1500, "default_printer_power_watts": 120, "labor_packing_cost": 10000, "default_reject_rate": 0.10, "default_overhead_multiplier": 1.20}'::jsonb,
    'Asumsi biaya produksi 3D printing (Tarif PLN, daya printer, tenaga kerja, reject rate)'
)
ON CONFLICT (key) DO NOTHING;

-- 3. CREATE PAYABLES & ASSET INSTALLMENT TABLES
CREATE TABLE IF NOT EXISTS public.payables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    payable_type TEXT NOT NULL DEFAULT 'ASSET_INSTALLMENT' CHECK (payable_type IN ('ASSET_INSTALLMENT', 'SUPPLIER_DEBT', 'OPERATIONAL_DEBT', 'OTHER')),
    creditor_name TEXT NOT NULL,
    related_asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
    total_amount NUMERIC(15, 2) NOT NULL CHECK (total_amount > 0),
    remaining_amount NUMERIC(15, 2) NOT NULL CHECK (remaining_amount >= 0),
    monthly_installment NUMERIC(15, 2) NOT NULL CHECK (monthly_installment > 0),
    term_months INT NOT NULL CHECK (term_months > 0),
    start_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'UNPAID' CHECK (status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payable_installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payable_id UUID NOT NULL REFERENCES public.payables(id) ON DELETE CASCADE,
    installment_number INT NOT NULL,
    due_date DATE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    paid_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'UNPAID' CHECK (status IN ('UNPAID', 'PAID', 'OVERDUE')),
    payment_date DATE,
    payment_method TEXT CHECK (payment_method IN ('TRANSFER', 'CASH', 'SHOPEE_PAYOUT', 'QRIS')),
    reference_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payables_status ON public.payables(status);
CREATE INDEX IF NOT EXISTS idx_payables_asset ON public.payables(related_asset_id);
CREATE INDEX IF NOT EXISTS idx_payable_installments_payable ON public.payable_installments(payable_id);
CREATE INDEX IF NOT EXISTS idx_payable_installments_due ON public.payable_installments(due_date);
CREATE INDEX IF NOT EXISTS idx_payable_installments_status ON public.payable_installments(status);

ALTER TABLE public.payables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payable_installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users access payables" ON public.payables FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users access payable_installments" ON public.payable_installments FOR ALL TO authenticated USING (true) WITH CHECK (true);
