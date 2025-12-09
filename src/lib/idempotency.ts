// نظام Idempotency لمنع تكرار العمليات
// يُستخدم مع العمليات الحساسة مثل الدفع والحفظ

import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

interface IdempotencyResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    isReplay: boolean;  // هل هذه نتيجة محفوظة مسبقاً؟
}

// إنشاء مفتاح Idempotency فريد
export function generateIdempotencyKey(
    operation: string,
    ...params: (string | number)[]
): string {
    const timestamp = Date.now();
    const paramsStr = params.join('-');
    return `${operation}-${paramsStr}-${timestamp}-${uuidv4().slice(0, 8)}`;
}

// تنفيذ عملية مع حماية Idempotency
export async function withIdempotency<T>(
    key: string,
    operation: () => Promise<T>,
    expiresInHours: number = 24
): Promise<IdempotencyResult<T>> {
    try {
        // التحقق من وجود المفتاح مسبقاً
        const { data: existingKey, error: fetchError } = await supabase
            .from('idempotency_keys')
            .select('*')
            .eq('key', key)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            throw fetchError;
        }

        // إذا وُجد المفتاح وله نتيجة، أرجع النتيجة المحفوظة
        if (existingKey?.response_body) {
            return {
                success: true,
                data: existingKey.response_body as T,
                isReplay: true,
            };
        }

        // تنفيذ العملية
        const result = await operation();

        // حفظ النتيجة
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + expiresInHours);

        await supabase.from('idempotency_keys').upsert({
            key,
            response_body: result,
            status_code: 200,
            expires_at: expiresAt.toISOString(),
        });

        return {
            success: true,
            data: result,
            isReplay: false,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            isReplay: false,
        };
    }
}

// تنظيف المفاتيح المنتهية الصلاحية
export async function cleanupExpiredKeys(): Promise<void> {
    await supabase
        .from('idempotency_keys')
        .delete()
        .lt('expires_at', new Date().toISOString());
}

// التحقق من أن العملية لم تُنفذ مسبقاً (للاستخدام في Server Actions)
export async function checkIdempotency(key: string): Promise<{
    exists: boolean;
    cachedResponse?: unknown;
}> {
    const { data } = await supabase
        .from('idempotency_keys')
        .select('response_body')
        .eq('key', key)
        .single();

    return {
        exists: !!data,
        cachedResponse: data?.response_body,
    };
}

// حفظ نتيجة عملية
export async function saveIdempotencyResult(
    key: string,
    response: unknown,
    expiresInHours: number = 24
): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    await supabase.from('idempotency_keys').upsert({
        key,
        response_body: response,
        status_code: 200,
        expires_at: expiresAt.toISOString(),
    });
}
