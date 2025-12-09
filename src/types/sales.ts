// ============================================
// Sales Module Types - Shopify Compatible
// ============================================

// ==========================================
// Customer Types
// ==========================================

export type CustomerGroup = 'retail' | 'wholesale' | 'vip' | 'corporate';
export type CustomerStatus = 'active' | 'inactive' | 'blocked';

export interface Customer {
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
    customer_group: CustomerGroup;
    tax_number?: string;
    credit_limit: number;
    payment_terms_days: number;
    default_price_list_id?: string;

    // Shopify Integration
    shopify_customer_id?: string;
    shopify_synced_at?: string;

    // Balances
    balance: number;           // مدين (عليه)
    credit_balance: number;    // دائن (له)

    // Stats
    total_orders: number;
    total_spent: number;
    last_order_date?: string;

    // Meta
    notes?: string;
    tags?: string[];
    status: CustomerStatus;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// ==========================================
// Order Types (Shopify Compatible)
// ==========================================

export type OrderStatus =
    | 'draft'           // مسودة
    | 'pending'         // قيد الانتظار
    | 'confirmed'       // مؤكد
    | 'processing'      // قيد التجهيز
    | 'ready'           // جاهز للشحن
    | 'shipped'         // تم الشحن
    | 'delivered'       // تم التسليم
    | 'completed'       // مكتمل
    | 'cancelled'       // ملغي
    | 'refunded';       // مسترد

export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded';
export type FulfillmentStatus = 'unfulfilled' | 'partial' | 'fulfilled';

export interface SalesOrder {
    id: string;
    company_id: string;
    branch_id?: string;

    // Order Info
    order_number: string;
    order_date: string;
    due_date?: string;

    // Source
    source: 'manual' | 'shopify' | 'api' | 'pos';
    shopify_order_id?: string;
    shopify_order_number?: string;
    shopify_order_name?: string;  // e.g., #1001

    // Customer
    customer_id?: string;
    customer?: Customer;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;

    // Addresses (Shopify format)
    billing_address?: OrderAddress;
    shipping_address?: OrderAddress;

    // Items
    items: OrderItem[];

    // Amounts
    subtotal: number;
    discount_code?: string;
    discount_amount: number;
    discount_percent: number;
    shipping_cost: number;
    tax_rate: number;
    tax_amount: number;
    total: number;

    // Payment
    payment_status: PaymentStatus;
    paid_amount: number;
    remaining_amount: number;
    payment_method?: string;
    cod_amount?: number;        // الدفع عند الاستلام

    // Fulfillment
    fulfillment_status: FulfillmentStatus;
    warehouse_id?: string;

    // Shipping
    shipping_carrier_id?: string;
    tracking_number?: string;
    shipped_at?: string;
    delivered_at?: string;

    // Status
    status: OrderStatus;

    // Notes
    notes?: string;
    internal_notes?: string;

    // Tags (Shopify)
    tags?: string[];

    // Meta
    created_by?: string;
    created_at: string;
    updated_at: string;
    cancelled_at?: string;
    cancel_reason?: string;
}

export interface OrderAddress {
    first_name?: string;
    last_name?: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    province?: string;
    country: string;
    zip?: string;
    phone?: string;
}

export interface OrderItem {
    id: string;
    order_id: string;

    // Product (Shopify compatible)
    product_id?: string;
    variant_id?: string;
    shopify_line_item_id?: string;

    // Info
    sku?: string;
    name: string;
    variant_title?: string;

    // Quantities
    quantity: number;
    fulfilled_quantity: number;
    returned_quantity: number;

    // Pricing
    unit_price: number;
    cost_price: number;
    discount_amount: number;
    tax_amount: number;
    total: number;

    // Fulfillment
    requires_shipping: boolean;
    is_gift_card: boolean;

    // Custom
    properties?: Record<string, string>;
}

// ==========================================
// Invoice Types
// ==========================================

export type InvoiceType = 'sales' | 'sales_return';
export type InvoiceStatus = 'draft' | 'confirmed' | 'paid' | 'partial' | 'cancelled';

export interface SalesInvoice {
    id: string;
    company_id: string;
    branch_id?: string;
    order_id?: string;

    invoice_type: InvoiceType;
    invoice_number: string;
    invoice_date: string;
    due_date?: string;

    customer_id: string;
    customer?: Customer;

    // Shopify
    shopify_order_id?: string;

    items: InvoiceItem[];

    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    total: number;
    paid_amount: number;
    remaining_amount: number;

    status: InvoiceStatus;
    payment_status: PaymentStatus;

    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface InvoiceItem {
    id: string;
    invoice_id: string;
    product_id?: string;
    variant_id?: string;

    sku?: string;
    name: string;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    tax_amount: number;
    total: number;
}

// ==========================================
// Shipping Types
// ==========================================

export type ShipmentStatus =
    | 'pending'
    | 'picked_up'
    | 'in_transit'
    | 'out_for_delivery'
    | 'delivered'
    | 'returned'
    | 'cancelled';

export interface ShippingCarrier {
    id: string;
    company_id: string;

    name: string;
    code: string;  // bosta, aramex, jt, etc.

    // API Config
    api_url?: string;
    api_key?: string;
    api_secret?: string;

    // COD Settings
    cod_enabled: boolean;
    cod_fee_type: 'fixed' | 'percent';
    cod_fee_amount: number;

    // Settings
    tracking_url_template?: string;  // https://track.bosta.co/{tracking}
    auto_create_awb: boolean;

    is_active: boolean;
    created_at: string;
}

export interface Shipment {
    id: string;
    company_id: string;
    order_id: string;
    carrier_id: string;

    carrier?: ShippingCarrier;
    order?: SalesOrder;

    awb_number?: string;       // Air Waybill
    tracking_number?: string;

    status: ShipmentStatus;

    // COD
    cod_amount: number;
    cod_collected: boolean;
    cod_settled: boolean;

    // Shipping Details
    shipping_cost: number;
    actual_weight?: number;

    // Dates
    picked_up_at?: string;
    delivered_at?: string;

    notes?: string;
    created_at: string;
    updated_at: string;
}

// ==========================================
// Analytics Types
// ==========================================

export interface SalesStats {
    total_orders: number;
    total_revenue: number;
    total_customers: number;
    average_order_value: number;

    orders_today: number;
    revenue_today: number;

    pending_orders: number;
    processing_orders: number;
    shipped_orders: number;

    unpaid_amount: number;
    cod_pending: number;
}

export interface OrdersByStatus {
    status: OrderStatus;
    count: number;
    total: number;
}

export interface TopCustomer {
    customer_id: string;
    customer_name: string;
    orders_count: number;
    total_spent: number;
}

export interface SalesTrend {
    date: string;
    orders: number;
    revenue: number;
}

// ==========================================
// Filters & Inputs
// ==========================================

export interface OrderFilters {
    search?: string;
    status?: OrderStatus;
    payment_status?: PaymentStatus;
    fulfillment_status?: FulfillmentStatus;
    customer_id?: string;
    source?: string;
    date_from?: string;
    date_to?: string;
    has_cod?: boolean;
}

export interface CustomerFilters {
    search?: string;
    group?: CustomerGroup;
    status?: CustomerStatus;
    has_balance?: boolean;
}
