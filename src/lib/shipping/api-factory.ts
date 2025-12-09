/**
 * Shipping Carrier API Factory
 * Provides a unified interface to interact with different shipping carrier APIs
 */

import { BostaAPI, createBostaClient } from './bosta';

// Common interface for all carrier APIs
export interface ShippingCarrierAPI {
    createShipment(data: CreateShipmentRequest): Promise<CreateShipmentResponse>;
    trackShipment(trackingNumber: string): Promise<TrackingResponse>;
    cancelShipment(trackingNumber: string): Promise<{ success: boolean }>;
    printAWB(trackingNumber: string): Promise<string>;
}

export interface CreateShipmentRequest {
    orderNumber: string;
    cod: number;
    receiver: {
        name: string;
        phone: string;
        phone2?: string;
    };
    address: {
        city: string;
        district?: string;
        street: string;
        building?: string;
        floor?: string;
        apartment?: string;
    };
    notes?: string;
    weight?: number;
    items?: number;
}

export interface CreateShipmentResponse {
    success: boolean;
    trackingNumber: string;
    awbNumber?: string;
    status: string;
    carrierRef?: string;
}

export interface TrackingResponse {
    trackingNumber: string;
    status: string;
    statusAr: string;
    lastUpdate: string;
    timeline: Array<{
        status: string;
        statusAr: string;
        timestamp: string;
        location?: string;
        notes?: string;
    }>;
}

// Bosta adapter
class BostaAdapter implements ShippingCarrierAPI {
    private client: BostaAPI;

    constructor(apiKey: string, apiUrl?: string) {
        this.client = createBostaClient(apiKey, apiUrl);
    }

    async createShipment(data: CreateShipmentRequest): Promise<CreateShipmentResponse> {
        const response = await this.client.createDelivery({
            type: 10, // SEND
            cod: data.cod,
            receiver: {
                fullName: data.receiver.name,
                phone: data.receiver.phone,
                secondPhone: data.receiver.phone2,
            },
            dropOffAddress: {
                city: data.address.city,
                firstLine: data.address.street,
                buildingNumber: data.address.building,
                floor: data.address.floor,
                apartment: data.address.apartment,
            },
            businessReference: data.orderNumber,
            notes: data.notes,
            specs: {
                packageDetails: {
                    itemsCount: data.items || 1,
                },
            },
        });

        return {
            success: response.success,
            trackingNumber: response.data.trackingNumber,
            awbNumber: response.data._id,
            status: BostaAPI.mapStatus(response.data.state.code),
            carrierRef: response.data._id,
        };
    }

    async trackShipment(trackingNumber: string): Promise<TrackingResponse> {
        const response = await this.client.trackDelivery(trackingNumber);

        const statusLabels: Record<string, string> = {
            pending: 'قيد الانتظار',
            picked_up: 'تم الاستلام',
            in_transit: 'في الطريق',
            out_for_delivery: 'خارج للتوصيل',
            delivered: 'تم التسليم',
            returned: 'مرتجع',
            rts: 'إعادة للمصدر',
            rejected: 'مرفوض',
            cancelled: 'ملغي',
        };

        return {
            trackingNumber: response.data.trackingNumber,
            status: BostaAPI.mapStatus(response.data.state.code),
            statusAr: statusLabels[BostaAPI.mapStatus(response.data.state.code)] || response.data.state.code,
            lastUpdate: response.data.timeline?.[0]?.timestamp || '',
            timeline: (response.data.timeline || []).map((t) => ({
                status: BostaAPI.mapStatus(t.state.code),
                statusAr: statusLabels[BostaAPI.mapStatus(t.state.code)] || t.state.code,
                timestamp: t.timestamp,
                notes: t.note,
            })),
        };
    }

    async cancelShipment(trackingNumber: string): Promise<{ success: boolean }> {
        const response = await this.client.cancelDelivery(trackingNumber);
        return { success: response.success };
    }

    async printAWB(trackingNumber: string): Promise<string> {
        return this.client.printAWB(trackingNumber);
    }
}

// Placeholder for other carriers
class AramexAdapter implements ShippingCarrierAPI {
    async createShipment(): Promise<CreateShipmentResponse> {
        throw new Error('Aramex integration not implemented yet');
    }
    async trackShipment(): Promise<TrackingResponse> {
        throw new Error('Aramex integration not implemented yet');
    }
    async cancelShipment(): Promise<{ success: boolean }> {
        throw new Error('Aramex integration not implemented yet');
    }
    async printAWB(): Promise<string> {
        throw new Error('Aramex integration not implemented yet');
    }
}

// Factory function
export function getCarrierAPI(
    carrierCode: string,
    config: { apiKey: string; apiUrl?: string; apiSecret?: string }
): ShippingCarrierAPI {
    switch (carrierCode.toUpperCase()) {
        case 'BOSTA':
            return new BostaAdapter(config.apiKey, config.apiUrl);
        case 'ARAMEX':
            return new AramexAdapter();
        case 'JT':
        case 'J&T':
            throw new Error('J&T integration not implemented yet');
        case 'R2S':
            throw new Error('R2S integration not implemented yet');
        case 'MYLERZ':
            throw new Error('Mylerz integration not implemented yet');
        default:
            throw new Error(`Unknown carrier: ${carrierCode}`);
    }
}

// Helper to create shipment with automatic carrier selection
export async function createShipmentWithCarrier(
    carrier: { code: string; api_key?: string; api_url?: string },
    shipmentData: CreateShipmentRequest
): Promise<CreateShipmentResponse> {
    if (!carrier.api_key) {
        throw new Error('Carrier API key not configured');
    }

    const api = getCarrierAPI(carrier.code, {
        apiKey: carrier.api_key,
        apiUrl: carrier.api_url,
    });

    return api.createShipment(shipmentData);
}
