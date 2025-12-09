'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Save, User, Phone, Mail, MapPin, Building2, CreditCard } from 'lucide-react';
import type { CustomerGroup } from '@/types/sales';

export default function NewCustomerPage() {
    const [formData, setFormData] = useState({
        name: '',
        name_en: '',
        email: '',
        phone: '',
        mobile: '',
        address: '',
        city: '',
        country: 'مصر',
        customer_group: 'retail' as CustomerGroup,
        tax_number: '',
        credit_limit: 0,
        payment_terms_days: 0,
        notes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Submit:', formData);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/dashboard/sales/customers" className="p-2 hover:bg-muted rounded-lg text-muted-foreground">
                    <ArrowRight size={20} />
                </Link>
                <div>
                    <div className="text-sm text-muted-foreground mb-1">المبيعات / العملاء</div>
                    <h1 className="text-2xl font-bold">إضافة عميل جديد</h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="bg-card rounded-xl border border-border p-6">
                    <h2 className="font-semibold mb-4 flex items-center gap-2">
                        <User size={18} className="text-primary" />
                        البيانات الأساسية
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">اسم العميل *</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2.5 border border-border rounded-lg focus:border-primary outline-none"
                                placeholder="اسم العميل بالعربية"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">الاسم بالإنجليزية</label>
                            <input
                                type="text"
                                value={formData.name_en}
                                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                                className="w-full px-4 py-2.5 border border-border rounded-lg focus:border-primary outline-none"
                                placeholder="Customer name in English"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">المجموعة</label>
                            <select
                                value={formData.customer_group}
                                onChange={(e) => setFormData({ ...formData, customer_group: e.target.value as CustomerGroup })}
                                className="w-full px-4 py-2.5 border border-border rounded-lg focus:border-primary outline-none"
                            >
                                <option value="retail">تجزئة</option>
                                <option value="wholesale">جملة</option>
                                <option value="vip">VIP</option>
                                <option value="corporate">شركات</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">الرقم الضريبي</label>
                            <input
                                type="text"
                                value={formData.tax_number}
                                onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                                className="w-full px-4 py-2.5 border border-border rounded-lg focus:border-primary outline-none"
                                placeholder="123456789"
                            />
                        </div>
                    </div>
                </div>

                {/* Contact */}
                <div className="bg-card rounded-xl border border-border p-6">
                    <h2 className="font-semibold mb-4 flex items-center gap-2">
                        <Phone size={18} className="text-blue-600" />
                        معلومات التواصل
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">رقم الهاتف</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-4 py-2.5 border border-border rounded-lg focus:border-primary outline-none"
                                placeholder="01012345678"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">رقم المحمول</label>
                            <input
                                type="tel"
                                value={formData.mobile}
                                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                className="w-full px-4 py-2.5 border border-border rounded-lg focus:border-primary outline-none"
                                placeholder="01112223334"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-2.5 border border-border rounded-lg focus:border-primary outline-none"
                                placeholder="customer@email.com"
                            />
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div className="bg-card rounded-xl border border-border p-6">
                    <h2 className="font-semibold mb-4 flex items-center gap-2">
                        <MapPin size={18} className="text-purple-600" />
                        العنوان
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">العنوان</label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full px-4 py-2.5 border border-border rounded-lg focus:border-primary outline-none"
                                placeholder="العنوان التفصيلي"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">المدينة</label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="w-full px-4 py-2.5 border border-border rounded-lg focus:border-primary outline-none"
                                placeholder="القاهرة"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">الدولة</label>
                            <input
                                type="text"
                                value={formData.country}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                className="w-full px-4 py-2.5 border border-border rounded-lg focus:border-primary outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Credit */}
                <div className="bg-card rounded-xl border border-border p-6">
                    <h2 className="font-semibold mb-4 flex items-center gap-2">
                        <CreditCard size={18} className="text-emerald-600" />
                        الائتمان والدفع
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">حد الائتمان</label>
                            <input
                                type="number"
                                value={formData.credit_limit}
                                onChange={(e) => setFormData({ ...formData, credit_limit: Number(e.target.value) })}
                                className="w-full px-4 py-2.5 border border-border rounded-lg focus:border-primary outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">شروط الدفع (بالأيام)</label>
                            <input
                                type="number"
                                value={formData.payment_terms_days}
                                onChange={(e) => setFormData({ ...formData, payment_terms_days: Number(e.target.value) })}
                                className="w-full px-4 py-2.5 border border-border rounded-lg focus:border-primary outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div className="bg-card rounded-xl border border-border p-6">
                    <label className="block text-sm font-medium mb-1">ملاحظات</label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2.5 border border-border rounded-lg focus:border-primary outline-none resize-none"
                        placeholder="ملاحظات إضافية..."
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3">
                    <Link href="/dashboard/sales/customers" className="px-4 py-2.5 border border-border rounded-lg hover:bg-muted">
                        إلغاء
                    </Link>
                    <button
                        type="submit"
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
                    >
                        <Save size={18} />
                        حفظ العميل
                    </button>
                </div>
            </form>
        </div>
    );
}
