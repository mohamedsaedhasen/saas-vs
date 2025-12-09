// ============================================
// Shipping Module Types
// ============================================

// شركة الشحن
export interface ShippingCarrier {
    id: string;
    company_id: string;
    name: string;
    code: string;
    api_url?: string;
    api_key?: string;
    api_secret?: string;
    cod_enabled: boolean;
    cod_fee_amount: number;
    is_active: boolean;
    created_at: string;

    // Relations
    zones?: ShippingZone[];
    pricing?: CarrierPricing[];
}

// المنطقة
export interface ShippingZone {
    id: string;
    company_id: string;
    carrier_id: string;
    name: string;
    name_en?: string;
    code: string;
    cities?: string[];
    governorates?: string[];
    is_active: boolean;
}

// نوع الخدمة
export interface ShippingServiceType {
    id: string;
    company_id: string;
    code: string;
    name: string;
    name_en?: string;
    description?: string;
    expense_account_id?: string;
    liability_account_id?: string;
    is_system: boolean;
    is_active: boolean;
}

// أسعار الشحن
export interface CarrierPricing {
    id: string;
    carrier_id: string;
    zone_id: string;
    service_type_id: string;
    price: number;
    vat_included: boolean;
    is_active: boolean;

    // Relations
    zone?: ShippingZone;
    service_type?: ShippingServiceType;
}

// الشحنة
export interface Shipment {
    id: string;
    company_id: string;
    order_id?: string;
    carrier_id?: string;
    awb_number?: string;
    tracking_number?: string;
    service_type: ShipmentServiceType;
    status: ShipmentStatus;
    zone_id?: string;

    // المبالغ
    cod_amount: number;
    cod_collected: boolean;
    cod_settled: boolean;
    shipping_fee: number;
    return_fee: number;
    total_fees: number;

    // التواريخ
    picked_up_at?: string;
    delivered_at?: string;
    created_at: string;
    updated_at: string;

    // Relations
    carrier?: ShippingCarrier;
    zone?: ShippingZone;
    order?: {
        order_number: string;
        customer_name: string;
        total: number;
    };
}

// حالة الشحنة
export type ShipmentStatus =
    | 'pending'         // في انتظار الاستلام
    | 'picked_up'       // تم الاستلام
    | 'in_transit'      // في الطريق
    | 'out_for_delivery'// خارج للتوصيل
    | 'delivered'       // تم التسليم
    | 'returned'        // تم الإرجاع
    | 'rts'             // إعادة للمصدر
    | 'rejected'        // مرفوض
    | 'cancelled';      // ملغي

// نوع خدمة الشحن
export type ShipmentServiceType =
    | 'DELIVERY'        // التوصيل
    | 'RTS'             // الإعادة للمصدر
    | 'CUSTOMER_RETURN' // مرتجعات العملاء
    | 'EXCHANGE'        // استبدال
    | 'REJECTED'        // مرفوض
    | 'PARTIAL_DELIVERY';// توصيل جزئي

// تسوية COD
export interface CODSettlement {
    id: string;
    company_id: string;
    carrier_id: string;
    settlement_date: string;
    settlement_number?: string;
    total_shipments: number;
    total_cod_amount: number;
    carrier_fees: number;
    net_amount: number;
    status: 'pending' | 'confirmed' | 'received';
    vault_id?: string;
    journal_entry_id?: string;
    notes?: string;
    created_at: string;

    // Relations
    carrier?: ShippingCarrier;
}

// إحصائيات الشحن
export interface ShippingStats {
    totalShipments: number;
    pendingShipments: number;
    inTransitShipments: number;
    deliveredShipments: number;
    returnedShipments: number;
    pendingCOD: number;
    totalCarriers: number;
}

// تتبع الشحنة
export interface TrackingEvent {
    timestamp: string;
    status: string;
    description: string;
    location?: string;
}

// مصفوفة الأسعار
export interface PricingMatrix {
    carrier_id: string;
    zones: ShippingZone[];
    service_types: ShippingServiceType[];
    prices: {
        [zoneId: string]: {
            [serviceTypeId: string]: number;
        };
    };
}
