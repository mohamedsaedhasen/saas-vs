// Types for Inventory Management Module
// مديول إدارة المخزون والمنتجات

// ==========================================
// المنتجات (Products)
// ==========================================

export interface Product {
    id: string;
    company_id: string;
    category_id: string | null;
    brand_id: string | null;
    unit_id: string | null;

    // الترميز
    sku: string | null;
    barcode: string | null;

    // التسمية
    name: string;
    name_en?: string;
    description?: string;

    // النوع
    product_type: ProductType;
    has_variants: boolean;
    vendor?: string;
    tags?: string[];

    // الأسعار (للمنتجات بدون تباينات)
    cost_price: number;
    selling_price: number;

    // المخزون
    track_inventory: boolean;
    min_stock_level: number;
    max_stock_level: number;

    // الحالة
    status: ProductStatus;
    is_active: boolean;
    published_at?: string;

    // الصور
    image_url?: string;

    // Shopify
    shopify_product_id?: string;
    shopify_synced_at?: string;

    // التتبع
    created_at: string;
    updated_at: string;

    // العلاقات (للعرض)
    category?: ProductCategory | null;
    brand?: Brand | null;
    variants?: ProductVariant[];
    images?: ProductImage[];
    options?: ProductOption[];
}

export type ProductType = 'product' | 'service';
export type ProductStatus = 'draft' | 'active' | 'archived';

// ==========================================
// تباينات المنتج (Product Variants)
// ==========================================

export interface ProductVariant {
    id: string;
    company_id: string;
    product_id: string;

    // الترميز
    sku: string | null;
    barcode?: string;

    // العنوان المركب
    title: string;                    // "أحمر / XL"

    // الخيارات
    option1?: string;                 // "XL"
    option2?: string;                 // "أحمر"
    option3?: string;                 // "قطن"

    // الأسعار
    price: number;
    compare_at_price?: number;        // السعر قبل الخصم
    cost_price: number;

    // الوزن
    weight?: number;
    weight_unit: 'kg' | 'g' | 'lb' | 'oz';

    // إعدادات
    requires_shipping: boolean;
    is_taxable: boolean;

    // الترتيب
    position: number;
    is_default: boolean;
    is_active: boolean;

    // الصورة
    image_id?: string;
    image?: ProductImage;

    // Shopify
    shopify_variant_id?: string;
    shopify_inventory_item_id?: string;

    // التتبع
    created_at: string;
    updated_at: string;

    // للعرض
    inventory?: VariantInventory[];
    total_stock?: number;
    available_stock?: number;
}

// ==========================================
// خيارات المنتج (Product Options)
// ==========================================

export interface ProductOption {
    id: string;
    company_id: string;
    product_id: string;

    name: string;                     // "المقاس"
    name_en?: string;                 // "Size"
    position: number;
    values: string[];                 // ["S", "M", "L", "XL"]

    created_at: string;
}

// ==========================================
// صور المنتج (Product Images)
// ==========================================

export interface ProductImage {
    id: string;
    company_id: string;
    product_id: string;
    variant_id?: string;

    src: string;
    alt?: string;
    width?: number;
    height?: number;

    position: number;
    is_primary: boolean;

    shopify_image_id?: string;

    created_at: string;
}

// ==========================================
// تصنيفات المنتجات (Product Categories)
// ==========================================

export interface ProductCategory {
    id: string;
    company_id: string;
    parent_id: string | null;

    code?: string;
    name: string;
    name_en?: string;
    description?: string;

    // الهرمية
    level: number;
    path?: string;
    has_children: boolean;

    // الإحصائيات
    product_count: number;

    // العرض
    image_url?: string;
    sort_order: number;
    is_active: boolean;

    // Shopify
    shopify_collection_id?: string;

    created_at: string;

    // للعرض
    children?: ProductCategory[];
}

// ==========================================
// العلامات التجارية (Brands)
// ==========================================

export interface Brand {
    id: string;
    company_id: string;

    name: string;
    name_en?: string;
    slug?: string;

    logo_url?: string;
    description?: string;
    website?: string;

    is_active: boolean;
    product_count: number;

    created_at: string;
    updated_at: string;
}

// ==========================================
// المخازن (Warehouses)
// ==========================================

export interface Warehouse {
    id: string;
    company_id: string;

    code?: string;
    name: string;
    name_en?: string;
    address?: string;

    manager_id?: string;
    manager_name?: string;

    is_active: boolean;
    is_default?: boolean;

    // الإحصائيات
    product_count?: number;
    total_value?: number;

    // Shopify
    shopify_location_id?: string;

    created_at: string;
    updated_at: string;
}

// ==========================================
// مخزون التباينات (Variant Inventory)
// ==========================================

export interface VariantInventory {
    id: string;
    variant_id: string;
    warehouse_id: string;

    quantity: number;
    reserved_quantity: number;
    available_quantity: number;

    average_cost: number;

    // Shopify
    shopify_location_id?: string;

    updated_at: string;

    // للعرض
    warehouse?: Warehouse;
}

// ==========================================
// حركات المخزون (Inventory Movements)
// ==========================================

export interface InventoryMovement {
    id: string;
    company_id: string;
    variant_id: string;
    warehouse_id: string;

    movement_type: MovementType;
    reference_type?: ReferenceType;
    reference_id?: string;

    quantity: number;
    unit_cost?: number;

    from_warehouse_id?: string;
    to_warehouse_id?: string;

    notes?: string;

    created_by?: string;
    created_by_name?: string;
    created_at: string;

    // للعرض
    variant?: ProductVariant;
    warehouse?: Warehouse;
}

export type MovementType = 'in' | 'out' | 'transfer' | 'adjustment';
export type ReferenceType = 'invoice' | 'purchase' | 'transfer' | 'adjustment' | 'shopify_sync';

// ==========================================
// مزامنة شوبيفاي (Shopify Sync)
// ==========================================

export interface ShopifySyncLog {
    id: string;
    company_id: string;
    branch_id?: string;

    sync_type: SyncType;
    direction: 'from_shopify' | 'to_shopify';

    status: SyncStatus;

    items_total: number;
    items_processed: number;
    items_created: number;
    items_updated: number;
    items_failed: number;

    error_message?: string;
    error_details?: Record<string, any>;

    started_at?: string;
    completed_at?: string;

    created_by?: string;
    created_at: string;
}

export type SyncType = 'products' | 'orders' | 'customers' | 'inventory';
export type SyncStatus = 'pending' | 'running' | 'completed' | 'failed';

// ==========================================
// وحدات القياس (Units)
// ==========================================

export interface Unit {
    id: string;
    company_id: string;

    name: string;
    name_en?: string;
    symbol?: string;

    created_at: string;
}

// ==========================================
// الإحصائيات والتحليلات
// ==========================================

export interface InventoryStats {
    total_products: number;
    total_variants: number;
    active_products: number;
    draft_products: number;
    total_stock_value: number;
    low_stock_count: number;
    out_of_stock_count: number;
    categories_count: number;
    warehouses_count: number;
}

export interface ProductStockSummary {
    id: string;
    name: string;
    sku: string | null;
    category_name: string | null;
    has_variants: boolean;
    variant_count: number;
    total_stock: number;
    total_reserved: number;
    min_price: number;
    max_price: number;
    stock_value: number;
}

export interface LowStockItem {
    product_id: string;
    product_name: string;
    variant_id: string;
    sku: string;
    variant_title: string;
    warehouse_name: string;
    quantity: number;
    min_stock_level: number;
    stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface StockByWarehouse {
    warehouse_id: string;
    warehouse_name: string;
    total_products: number;
    total_variants: number;
    total_quantity: number;
    total_value: number;
}

export interface CategorySales {
    category_id: string;
    category_name: string;
    products_sold: number;
    total_revenue: number;
    percentage: number;
}

export interface TopProduct {
    product_id: string;
    product_name: string;
    quantity_sold: number;
    revenue: number;
    profit: number;
}

export interface StockMovementTrend {
    date: string;
    in_quantity: number;
    out_quantity: number;
    net_change: number;
}

// ==========================================
// الفلاتر (Filters)
// ==========================================

export interface ProductFilters {
    search?: string;
    category_id?: string;
    brand_id?: string;
    status?: ProductStatus;
    has_variants?: boolean;
    stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'all';
    price_min?: number;
    price_max?: number;
    warehouse_id?: string;
    tags?: string[];
}

export interface InventoryFilters {
    warehouse_id?: string;
    product_id?: string;
    movement_type?: MovementType;
    date_from?: string;
    date_to?: string;
}

// ==========================================
// Form Inputs
// ==========================================

export interface CreateProductInput {
    name: string;
    name_en?: string;
    description?: string;
    category_id?: string;
    brand_id?: string;
    product_type?: ProductType;
    sku?: string;
    barcode?: string;
    cost_price?: number;
    selling_price?: number;
    track_inventory?: boolean;
    min_stock_level?: number;
    has_variants?: boolean;
    variants?: CreateVariantInput[];
    options?: CreateOptionInput[];
    images?: CreateImageInput[];
}

export interface CreateVariantInput {
    sku?: string;
    barcode?: string;
    option1?: string;
    option2?: string;
    option3?: string;
    price: number;
    compare_at_price?: number;
    cost_price?: number;
    weight?: number;
    weight_unit?: string;
    is_default?: boolean;
}

export interface CreateOptionInput {
    name: string;
    name_en?: string;
    values: string[];
}

export interface CreateImageInput {
    src: string;
    alt?: string;
    is_primary?: boolean;
}

export interface StockAdjustmentInput {
    variant_id: string;
    warehouse_id: string;
    quantity: number;
    adjustment_type: 'set' | 'add' | 'subtract';
    notes?: string;
}

export interface StockTransferInput {
    from_warehouse_id: string;
    to_warehouse_id: string;
    items: {
        variant_id: string;
        quantity: number;
    }[];
    notes?: string;
}

// ==========================================
// API Responses
// ==========================================

export interface ProductWithDetails extends Product {
    variants: ProductVariant[];
    options: ProductOption[];
    images: ProductImage[];
    category: ProductCategory | null;
    brand: Brand | null;
    total_stock: number;
    stock_value: number;
}

export interface PaginatedProducts {
    data: Product[];
    pagination: {
        total: number;
        page: number;
        per_page: number;
        total_pages: number;
    };
    summary: {
        total_products: number;
        active: number;
        low_stock: number;
        out_of_stock: number;
    };
}
