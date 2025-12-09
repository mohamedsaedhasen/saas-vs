'use client';

import { useState, useEffect } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { Button } from '@/components/ui/button';
import {
    Monitor,
    Smartphone,
    Laptop,
    Trash2,
    Check,
    X,
    Clock,
    Shield,
    AlertCircle
} from 'lucide-react';

interface Device {
    id: string;
    device_name: string;
    device_info: {
        browser: string;
        os: string;
        platform: string;
        screenResolution: string;
    };
    ip_address: string;
    is_trusted: boolean;
    is_current: boolean;
    last_used_at: string;
    created_at: string;
}

interface DeviceRequest {
    id: string;
    device_info: {
        browser: string;
        os: string;
    };
    ip_address: string;
    status: string;
    created_at: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
}

export default function DevicesPage() {
    const { company } = useCompany();
    const [devices, setDevices] = useState<Device[]>([]);
    const [requests, setRequests] = useState<DeviceRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'devices' | 'requests'>('requests');

    useEffect(() => {
        loadData();
    }, [company?.id]);

    const loadData = async () => {
        if (!company?.id) return;
        setIsLoading(true);
        try {
            // Load pending requests (for admins)
            const requestsRes = await fetch(`/api/devices/requests?company_id=${company.id}`);
            if (requestsRes.ok) {
                setRequests(await requestsRes.json());
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApproval = async (requestId: string, action: 'approve' | 'reject') => {
        const userId = localStorage.getItem('user_id');

        try {
            const response = await fetch('/api/devices/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    request_id: requestId,
                    action,
                    reviewer_id: userId,
                }),
            });

            if (response.ok) {
                setRequests(requests.filter(r => r.id !== requestId));
            }
        } catch (error) {
            console.error('Error processing request:', error);
        }
    };

    const getDeviceIcon = (os: string) => {
        if (os?.toLowerCase().includes('android') || os?.toLowerCase().includes('ios')) {
            return Smartphone;
        }
        if (os?.toLowerCase().includes('windows') || os?.toLowerCase().includes('mac')) {
            return Laptop;
        }
        return Monitor;
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Shield className="w-6 h-6" />
                    إدارة الأجهزة الموثوقة
                </h1>
                <p className="text-muted-foreground">الموافقة على طلبات الأجهزة الجديدة</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b">
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'requests'
                            ? 'border-primary text-primary font-medium'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    طلبات في الانتظار
                    {requests.length > 0 && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                            {requests.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                    جاري التحميل...
                </div>
            ) : requests.length === 0 ? (
                <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">لا توجد طلبات معلقة</h3>
                    <p className="text-muted-foreground">
                        جميع طلبات الأجهزة تمت معالجتها
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map((request) => {
                        const DeviceIcon = getDeviceIcon(request.device_info?.os);
                        return (
                            <div key={request.id} className="bg-card rounded-xl border p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-lg bg-yellow-50">
                                            <DeviceIcon className="w-6 h-6 text-yellow-600" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium">{request.user?.name}</h3>
                                                <span className="text-sm text-muted-foreground">
                                                    ({request.user?.email})
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {request.device_info?.browser} على {request.device_info?.os}
                                            </p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                <span>IP: {request.ip_address || 'غير معروف'}</span>
                                                <span>
                                                    منذ {new Date(request.created_at).toLocaleDateString('ar-EG')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleApproval(request.id, 'reject')}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <X className="w-4 h-4 ml-1" />
                                            رفض
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => handleApproval(request.id, 'approve')}
                                        >
                                            <Check className="w-4 h-4 ml-1" />
                                            موافقة
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">كيف تعمل حماية الأجهزة؟</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                        <li>عند تفعيل "تقييد الجهاز" للمستخدم، لن يستطيع الدخول إلا من الأجهزة الموثوقة</li>
                        <li>الجهاز الأول يُضاف تلقائياً كجهاز موثوق</li>
                        <li>أي جهاز جديد يحتاج موافقتك هنا</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
