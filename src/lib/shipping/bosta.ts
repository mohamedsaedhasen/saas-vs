/**
 * Bosta API Integration
 * Based on Bosta Server APIs v2.0.0
 * https://app.bosta.co/api/v2/
 */

interface BostaConfig {
    apiUrl: string;
    apiKey: string;
    email?: string;
    password?: string;
}

interface BostaAddress {
    firstLine: string;
    secondLine?: string;
    floor?: string;
    apartment?: string;
    buildingNumber?: string;
    city: string;
    districtId?: string;
    zoneId?: string;
}

interface BostaReceiver {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    phone: string;
    secondPhone?: string;
    email?: string;
}

interface BostaDeliveryRequest {
    type: number; // 10 = SEND
    cod: number;
    receiver: BostaReceiver;
    dropOffAddress: BostaAddress;
    businessReference?: string;
    notes?: string;
    allowToOpenPackage?: boolean;
    specs?: {
        size?: string; // SMALL, MEDIUM, LARGE
        packageType?: string; // Parcel, Document
        packageDetails?: {
            itemsCount?: number;
            description?: string;
        };
    };
}

interface BostaDeliveryResponse {
    success: boolean;
    message: string;
    data: {
        _id: string;
        trackingNumber: string;
        state: {
            value: number;
            code: string;
        };
    };
}

interface BostaTrackingResponse {
    success: boolean;
    data: {
        _id: string;
        trackingNumber: string;
        state: {
            value: number;
            code: string;
        };
        cod: number;
        receiver: BostaReceiver;
        dropOffAddress: BostaAddress;
        timeline: Array<{
            state: { value: number; code: string };
            timestamp: string;
            note?: string;
        }>;
    };
}

export class BostaAPI {
    private config: BostaConfig;
    private token: string | null = null;

    constructor(config: BostaConfig) {
        this.config = {
            apiUrl: config.apiUrl || 'https://app.bosta.co/api/v2',
            apiKey: config.apiKey,
            email: config.email,
            password: config.password,
        };
    }

    /**
     * Login and get auth token
     */
    async login(): Promise<string> {
        if (!this.config.email || !this.config.password) {
            throw new Error('Email and password required for login');
        }

        const response = await fetch(`${this.config.apiUrl}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: this.config.email,
                password: this.config.password,
            }),
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Login failed');
        }

        this.token = data.data.token;
        return data.data.token;
    }

    /**
     * Get authorization header
     */
    private getHeaders(): HeadersInit {
        return {
            'Content-Type': 'application/json',
            'Authorization': this.config.apiKey || this.token || '',
        };
    }

    /**
     * Create a new delivery/shipment
     */
    async createDelivery(delivery: BostaDeliveryRequest): Promise<BostaDeliveryResponse> {
        const response = await fetch(`${this.config.apiUrl}/deliveries`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(delivery),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to create delivery');
        }

        return data;
    }

    /**
     * Get delivery by tracking number
     */
    async getDelivery(trackingNumber: string): Promise<BostaTrackingResponse> {
        const response = await fetch(`${this.config.apiUrl}/deliveries/${trackingNumber}`, {
            method: 'GET',
            headers: this.getHeaders(),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to get delivery');
        }

        return data;
    }

    /**
     * Track delivery status
     */
    async trackDelivery(trackingNumber: string): Promise<BostaTrackingResponse> {
        return this.getDelivery(trackingNumber);
    }

    /**
     * Update delivery
     */
    async updateDelivery(trackingNumber: string, updates: Partial<BostaDeliveryRequest>): Promise<BostaDeliveryResponse> {
        const response = await fetch(`${this.config.apiUrl}/deliveries/${trackingNumber}`, {
            method: 'PATCH',
            headers: this.getHeaders(),
            body: JSON.stringify(updates),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to update delivery');
        }

        return data;
    }

    /**
     * Cancel/terminate delivery
     */
    async cancelDelivery(trackingNumber: string): Promise<{ success: boolean; message: string }> {
        const response = await fetch(`${this.config.apiUrl}/deliveries/${trackingNumber}/terminate`, {
            method: 'DELETE',
            headers: this.getHeaders(),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to cancel delivery');
        }

        return data;
    }

    /**
     * Get cities list
     */
    async getCities(): Promise<Array<{ _id: string; name: string; nameAr: string }>> {
        const response = await fetch(`${this.config.apiUrl}/cities`, {
            method: 'GET',
            headers: this.getHeaders(),
        });

        const data = await response.json();
        return data.data || [];
    }

    /**
     * Get zones/districts by city
     */
    async getZones(cityId: string): Promise<Array<{ _id: string; name: string; nameAr: string }>> {
        const response = await fetch(`${this.config.apiUrl}/zones?cityId=${cityId}`, {
            method: 'GET',
            headers: this.getHeaders(),
        });

        const data = await response.json();
        return data.data || [];
    }

    /**
     * Print AWB (Air Waybill)
     */
    async printAWB(trackingNumber: string): Promise<string> {
        const response = await fetch(`${this.config.apiUrl}/deliveries/${trackingNumber}/airwaybill`, {
            method: 'GET',
            headers: this.getHeaders(),
        });

        if (!response.ok) {
            throw new Error('Failed to get AWB');
        }

        const data = await response.json();
        return data.data?.url || '';
    }

    /**
     * Map Bosta state to our status
     */
    static mapStatus(stateCode: string): string {
        const statusMap: Record<string, string> = {
            'PENDING': 'pending',
            'CREATED': 'pending',
            'PICKING_UP': 'pending',
            'PICKED_UP': 'picked_up',
            'IN_TRANSIT': 'in_transit',
            'RECEIVED_AT_WAREHOUSE': 'in_transit',
            'OUT_FOR_DELIVERY': 'out_for_delivery',
            'DELIVERED': 'delivered',
            'RETURNED': 'returned',
            'RETURN_TO_ORIGIN': 'rts',
            'CUSTOMER_REFUSED': 'rejected',
            'CANCELLED': 'cancelled',
        };

        return statusMap[stateCode] || 'pending';
    }
}

/**
 * Create Bosta API instance from carrier config
 */
export function createBostaClient(apiKey: string, apiUrl?: string): BostaAPI {
    return new BostaAPI({
        apiUrl: apiUrl || 'https://app.bosta.co/api/v2',
        apiKey,
    });
}
