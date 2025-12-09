import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// دمج كلاسات CSS
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// تنسيق الأرقام
export function formatNumber(
    value: number,
    locale: string = 'ar-EG',
    options: Intl.NumberFormatOptions = {}
): string {
    return new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        ...options,
    }).format(value);
}

// تنسيق العملة
export function formatCurrency(
    value: number,
    currency: string = 'EGP',
    locale: string = 'ar-EG'
): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

// تنسيق التاريخ
export function formatDate(
    date: Date | string,
    locale: string = 'ar-EG',
    options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }
): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, options).format(d);
}

// تنسيق التاريخ والوقت
export function formatDateTime(
    date: Date | string,
    locale: string = 'ar-EG'
): string {
    return formatDate(date, locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

// تحويل التاريخ لصيغة Input
export function toInputDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
}

// إنشاء slug من النص
export function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
}

// اختصار النص
export function truncate(text: string, length: number): string {
    if (text.length <= length) return text;
    return text.slice(0, length) + '...';
}

// التحقق من البريد الإلكتروني
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// التحقق من رقم الهاتف
export function isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\d\s\-+()]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

// تأخير (للاستخدام مع async/await)
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// نسخ للحافظة
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
}

// تحويل حجم الملف
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// الحصول على اتجاه اللغة
export function getDirection(locale: string): 'rtl' | 'ltr' {
    return locale === 'ar' ? 'rtl' : 'ltr';
}

// التحقق من أن الكائن فارغ
export function isEmpty(obj: Record<string, unknown>): boolean {
    return Object.keys(obj).length === 0;
}

// دمج كائنين بعمق
export function deepMerge<T extends Record<string, unknown>>(
    target: T,
    source: Partial<T>
): T {
    const output = { ...target };

    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            output[key] = deepMerge(
                target[key] as Record<string, unknown>,
                source[key] as Record<string, unknown>
            ) as T[Extract<keyof T, string>];
        } else {
            output[key] = source[key] as T[Extract<keyof T, string>];
        }
    }

    return output;
}

// إنشاء معرف فريد قصير
export function generateId(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
