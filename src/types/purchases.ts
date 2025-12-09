// ============================================
// Purchases Module Types
// ============================================

// ==========================================
// Supplier Types
// ==========================================

export type SupplierGroup = 'local' | 'international' | 'manufacturer' | 'distributor';
export type SupplierStatus = 'active' | 'inactive' | 'blocked';

export interface Supplier {
    id: string;
    company_id: string;
    account_id?: string;

    // Basic Info
    code?: string;
    name: string;
    name_en?: string;
    email?: string;
    phone?: string;
    mobile?: string;

    // Address
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;

    // Business
    supplier_group: SupplierGroup;
    tax_number?: string;
    credit_limit: number;
    payment_terms_days: number;

    // Balances (negative = we owe them)
    balance: number;
    credit_balance: number;

    // Stats
    total_orders: number;
    total_purchases: number;
    last_order_date?: string;

    // Meta
    notes?: string;
    tags?: string[];
    status: SupplierStatus;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// ==========================================
// Purchase Order Types
// ==========================================

export type PurchaseOrderStatus =
    | 'draft'
    | 'sent'
    | 'confirmed'
    | 'partial'
    | 'received'
    | 'completed'
    | 'cancelled';

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export interface PurchaseOrder {
    id: string;
    company_id: string;
    branch_id?: string;

    order_number: string;
    order_date: string;
    expected_date?: string;

    supplier_id: string;
    supplier?: Supplier;
    supplier_name?: string;

    warehouse_id?: string;

    items: PurchaseOrderItem[];

    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    shipping_cost: number;
    total: number;

    payment_status: PaymentStatus;
    paid_amount: number;
    remaining_amount: number;

    status: PurchaseOrderStatus;

    notes?: string;

    created_by?: string;
    created_at: string;
    updated_at: string;
}

export interface PurchaseOrderItem {
    id: string;
    order_id: string;
    product_id?: string;
    variant_id?: string;

    sku?: string;
    name: string;

    quantity: number;
    received_quantity: number;

    unit_cost: number;
    discount_amount: number;
    tax_amount: number;
    total: number;
}

// ==========================================
// Purchase Invoice Types
// ==========================================

export type PurchaseInvoiceStatus = 'draft' | 'confirmed' | 'paid' | 'partial' | 'cancelled';

export interface PurchaseInvoice {
    id: string;
    company_id: string;
    order_id?: string;

    invoice_number: string;
    invoice_date: string;
    due_date?: string;

    supplier_id: string;
    supplier?: Supplier;

    items: PurchaseInvoiceItem[];

    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    total: number;
    paid_amount: number;
    remaining_amount: number;

    status: PurchaseInvoiceStatus;
    payment_status: PaymentStatus;

    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface PurchaseInvoiceItem {
    id: string;
    invoice_id: string;
    product_id?: string;

    sku?: string;
    name: string;
    quantity: number;
    unit_cost: number;
    discount_amount: number;
    tax_amount: number;
    total: number;
}

// ==========================================
// Analytics Types
// ==========================================

export interface PurchaseStats {
    total_orders: number;
    total_purchases: number;
    total_suppliers: number;
    average_order_value: number;

    pending_orders: number;
    unpaid_amount: number;

    orders_this_month: number;
    purchases_this_month: number;
}

export interface TopSupplier {
    supplier_id: string;
    supplier_name: string;
    orders_count: number;
    total_purchases: number;
}

// ==========================================
// Filters
// ==========================================

export interface PurchaseOrderFilters {
    search?: string;
    status?: PurchaseOrderStatus;
    payment_status?: PaymentStatus;
    supplier_id?: string;
    date_from?: string;
    date_to?: string;
}

export interface SupplierFilters {
    search?: string;
    group?: SupplierGroup;
    status?: SupplierStatus;
    has_balance?: boolean;
}
