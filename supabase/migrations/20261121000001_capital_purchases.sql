-- ====================================================================
-- CASA MORAL 3D PRINTING — CAPITAL PURCHASES TABLE
-- Migration: 20261121000001_capital_purchases.sql
-- Additive, non-destructive migration for /capital purchase ledger
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.capital_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    service_fee NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (service_fee >= 0),
    total_cost NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (total_cost >= 0),
    category TEXT NOT NULL CHECK (category IN ('MESIN', 'FILAMEN', 'KELISTRIKAN', 'KEMASAN', 'ALAT', 'OPERASIONAL')),
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    account TEXT,
    store_location TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_capital_purchases_date ON public.capital_purchases(purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_capital_purchases_category ON public.capital_purchases(category);

ALTER TABLE public.capital_purchases ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    CREATE POLICY "Auth users access capital_purchases"
        ON public.capital_purchases
        FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
