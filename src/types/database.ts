/**
 * Database Types Definition for Casa Moral Management System
 * Matches PostgreSQL schema defined in docs/DATABASE_DESIGN.md
 */

export type UserRole = "owner" | "admin" | "operator";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type ChannelSource = "Direct" | "Shopee" | "WhatsApp" | "Instagram" | "Other";

export interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  channel_source: ChannelSource;
  created_at: string;
  updated_at: string;
}

export type MaterialCategory = "filament" | "electrical" | "packaging" | "hardware" | "other";
export type MaterialUnit = "gram" | "pcs" | "meter" | "roll";

export interface Material {
  id: string;
  name: string;
  category: MaterialCategory;
  unit: MaterialUnit;
  current_stock: number;
  min_stock_alert: number;
  cost_per_unit: number;
  supplier?: string | null;
  created_at: string;
  updated_at: string;
}

export type StockMovementType =
  | "PURCHASE"
  | "PRODUCTION_USAGE"
  | "WASTE_ADJUSTMENT"
  | "MANUAL_CORRECTION"
  | "RETURN";

export interface StockMovement {
  id: string;
  material_id: string;
  movement_type: StockMovementType;
  quantity: number;
  reference_id?: string | null;
  notes?: string | null;
  created_at: string;
}

export type AssetCategory = "printer_3d" | "tool" | "computer" | "furniture";
export type AssetStatus = "ACTIVE" | "MAINTENANCE" | "RETIRED";

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  purchase_date: string;
  purchase_price: number;
  residual_value: number;
  useful_life_months: number;
  estimated_hours_per_month: number;
  power_watts: number;
  status: AssetStatus;
  created_at: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  created_at: string;
}

export type CalculationMode = "STANDARD" | "ADVANCED";

export interface ProductDimensions {
  shade_height_mm?: number;
  shade_width_mm?: number;
  base_height_mm?: number;
  base_width_mm?: number;
  nut_height_mm?: number;
  total_height_mm?: number;
}

export interface Product {
  id: string;
  sku?: string | null;
  name: string;
  category_id?: string | null;
  description?: string | null;
  dimensions?: ProductDimensions | null;
  calculation_mode: CalculationMode;
  standard_overhead_multiplier: number;
  print_time_minutes: number;
  current_hpp: number;
  recommended_price: number;
  selling_price: number;
  markup_percent: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ComponentType = "SHADE" | "BASE" | "CAP" | "ELECTRICAL" | "PACKAGING" | "ACCESSORY";

export interface ProductComponent {
  id: string;
  product_id: string;
  component_type: ComponentType;
  material_id?: string | null;
  quantity: number;
  unit_cost_snapshot: number;
  subtotal_cost: number;
  created_at: string;
}

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PRODUCTION"
  | "READY"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID" | "REFUNDED";

export interface Order {
  id: string;
  order_number: string;
  order_date: string;
  customer_id?: string | null;
  channel: ChannelSource;
  status: OrderStatus;
  subtotal_amount: number;
  add_on_amount: number;
  discount_amount: number;
  shipping_cost: number;
  platform_fee: number;
  total_amount: number;
  payment_status: PaymentStatus;
  paid_amount: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string | null;
  quantity: number;
  unit_price: number;
  unit_hpp: number;
  color_details?: string | null;
  add_on_name?: string | null;
  add_on_price?: number | null;
  subtotal: number;
  created_at: string;
  product?: Product;
}

export type PaymentMethod = "TRANSFER" | "CASH" | "SHOPEE_PAYOUT" | "QRIS";

export interface Payment {
  id: string;
  order_id: string;
  payment_date: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_number?: string | null;
  proof_url?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  is_fixed_cost: boolean;
  created_at: string;
}

export interface Expense {
  id: string;
  expense_date: string;
  category_id: string;
  description: string;
  amount: number;
  payment_method: PaymentMethod;
  is_capital_expenditure: boolean;
  notes?: string | null;
  created_at: string;
  category?: ExpenseCategory;
}
