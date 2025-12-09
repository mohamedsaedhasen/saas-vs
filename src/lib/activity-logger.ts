// Activity Log Helper Utility
// Use this to log activities from server actions or API routes

import { ActivityActionType } from '@/types/notifications';

interface LogActivityParams {
    modelType: string;
    modelId: string;
    modelName?: string;
    actionType: ActivityActionType;
    title: string;
    description?: string;
    changes?: Record<string, { old: unknown; new: unknown }>;
    userId?: string;
    userName?: string;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        await fetch(`${baseUrl}/api/activity-logs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model_type: params.modelType,
                model_id: params.modelId,
                model_name: params.modelName,
                action_type: params.actionType,
                title: params.title,
                description: params.description,
                changes: params.changes,
                user_id: params.userId,
                user_name: params.userName || 'النظام',
            }),
        });
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
}

// Create notification helper
interface CreateNotificationParams {
    type?: 'info' | 'success' | 'warning' | 'error' | 'action';
    category?: 'order' | 'payment' | 'inventory' | 'shipping' | 'system';
    title: string;
    message?: string;
    userId?: string;
    linkType?: string;
    linkId?: string;
    priority?: number;
}

export async function createNotification(params: CreateNotificationParams): Promise<void> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        await fetch(`${baseUrl}/api/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: params.type || 'info',
                category: params.category,
                title: params.title,
                message: params.message,
                user_id: params.userId,
                link_type: params.linkType,
                link_id: params.linkId,
                priority: params.priority || 0,
            }),
        });
    } catch (error) {
        console.error('Failed to create notification:', error);
    }
}

// Predefined activity titles in Arabic
export const activityTitles = {
    create: 'إنشاء جديد',
    update: 'تحديث البيانات',
    delete: 'حذف',
    status_change: 'تغيير الحالة',
    comment: 'تعليق جديد',
    email: 'إرسال بريد',
    call: 'مكالمة هاتفية',
    note: 'ملاحظة داخلية',
};

// Model type names in Arabic
export const modelTypeNames: Record<string, string> = {
    sales_order: 'طلب مبيعات',
    sales_invoice: 'فاتورة مبيعات',
    purchase_order: 'أمر شراء',
    purchase_invoice: 'فاتورة مشتريات',
    customer: 'عميل',
    supplier: 'مورد',
    product: 'منتج',
    shipment: 'شحنة',
    payment: 'دفعة',
    expense: 'مصروف',
};
