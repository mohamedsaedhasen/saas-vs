'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Building2,
    ArrowLeft,
    ArrowRight,
    Check,
    Globe,
    Phone,
    Mail,
    MapPin,
    CreditCard,
    Receipt,
    Settings,
    Sparkles,
    AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCompany } from '@/contexts/CompanyContext';

// قائمة العملات
const currencies = [
    { code: 'EGP', name: 'جنيه مصري', symbol: 'ج.م', flag: '🇪🇬' },
    { code: 'SAR', name: 'ريال سعودي', symbol: 'ر.س', flag: '🇸🇦' },
    { code: 'AED', name: 'درهم إماراتي', symbol: 'د.إ', flag: '🇦🇪' },
    { code: 'USD', name: 'دولار أمريكي', symbol: '$', flag: '🇺🇸' },
    { code: 'EUR', name: 'يورو', symbol: '€', flag: '🇪🇺' },
    { code: 'GBP', name: 'جنيه استرليني', symbol: '£', flag: '🇬🇧' },
    { code: 'KWD', name: 'دينار كويتي', symbol: 'د.ك', flag: '🇰🇼' },
    { code: 'QAR', name: 'ريال قطري', symbol: 'ر.ق', flag: '🇶🇦' },
    { code: 'BHD', name: 'دينار بحريني', symbol: 'د.ب', flag: '🇧🇭' },
    { code: 'OMR', name: 'ريال عماني', symbol: 'ر.ع', flag: '🇴🇲' },
    { code: 'JOD', name: 'دينار أردني', symbol: 'د.أ', flag: '🇯🇴' },
    { code: 'LBP', name: 'ليرة لبنانية', symbol: 'ل.ل', flag: '🇱🇧' },
    { code: 'SDG', name: 'جنيه سوداني', symbol: 'ج.س', flag: '🇸🇩' },
    { code: 'LYD', name: 'دينار ليبي', symbol: 'د.ل', flag: '🇱🇾' },
    { code: 'MAD', name: 'درهم مغربي', symbol: 'د.م', flag: '🇲🇦' },
    { code: 'TND', name: 'دينار تونسي', symbol: 'د.ت', flag: '🇹🇳' },
    { code: 'DZD', name: 'دينار جزائري', symbol: 'د.ج', flag: '🇩🇿' },
    { code: 'IQD', name: 'دينار عراقي', symbol: 'د.ع', flag: '🇮🇶' },
];

const countries = [
    { code: 'EG', name: 'مصر', flag: '🇪🇬' },
    { code: 'SA', name: 'السعودية', flag: '🇸🇦' },
    { code: 'AE', name: 'الإمارات', flag: '🇦🇪' },
    { code: 'KW', name: 'الكويت', flag: '🇰🇼' },
    { code: 'QA', name: 'قطر', flag: '🇶🇦' },
    { code: 'BH', name: 'البحرين', flag: '🇧🇭' },
    { code: 'OM', name: 'عمان', flag: '🇴🇲' },
    { code: 'JO', name: 'الأردن', flag: '🇯🇴' },
    { code: 'LB', name: 'لبنان', flag: '🇱🇧' },
    { code: 'SD', name: 'السودان', flag: '🇸🇩' },
    { code: 'LY', name: 'ليبيا', flag: '🇱🇾' },
    { code: 'MA', name: 'المغرب', flag: '🇲🇦' },
    { code: 'TN', name: 'تونس', flag: '🇹🇳' },
    { code: 'DZ', name: 'الجزائر', flag: '🇩🇿' },
    { code: 'IQ', name: 'العراق', flag: '🇮🇶' },
    { code: 'SY', name: 'سوريا', flag: '🇸🇾' },
    { code: 'YE', name: 'اليمن', flag: '🇾🇪' },
];

interface CompanyForm {
    // Step 1: Basic Info
    name: string;
    name_en: string;
    legal_name: string;

    // Step 2: Location & Contact
    country: string;
    city: string;
    address: string;
    phone: string;
    email: string;
    website: string;

    // Step 3: Currency & Tax
    currency: string;
    vat_enabled: boolean;
    vat_rate: number;

    // Step 4: Legal
    tax_number: string;
    commercial_register: string;
    invoice_prefix: string;
}

export default function NewCompanyPage() {
    const router = useRouter();
    const { setCompany, refreshCompanies } = useCompany();
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState<CompanyForm>({
        name: '',
        name_en: '',
        legal_name: '',
        country: 'مصر',
        city: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        currency: 'EGP',
        vat_enabled: false,
        vat_rate: 14,
        tax_number: '',
        commercial_register: '',
        invoice_prefix: 'INV',
    });

    const steps = [
        { id: 1, title: 'معلومات الشركة', icon: Building2 },
        { id: 2, title: 'الموقع والتواصل', icon: MapPin },
        { id: 3, title: 'العملة والضريبة', icon: CreditCard },
        { id: 4, title: 'المعلومات القانونية', icon: Receipt },
    ];

    const updateForm = (field: keyof CompanyForm, value: string | boolean | number) => {
        setForm({ ...form, [field]: value });
        setError(null);
    };

    const nextStep = () => {
        if (currentStep < 4) setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            setError('يرجى إدخال اسم الشركة');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            console.log('Submitting company:', form);

            const response = await fetch('/api/companies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            const data = await response.json();
            console.log('Response:', response.status, data);

            if (response.ok && data.id) {
                // Set the new company as active
                setCompany({
                    id: data.id,
                    name: data.name,
                    name_en: data.name_en,
                    settings: data.settings,
                });

                // Set cookie
                document.cookie = `company_id=${data.id}; path=/; max-age=31536000`;
                localStorage.setItem('selected_company_id', data.id);

                // Refresh companies list
                await refreshCompanies();

                // Navigate to dashboard
                router.push('/dashboard');
            } else {
                setError(data.error || data.details || 'حدث خطأ في إنشاء الشركة');
                console.error('Error response:', data);
            }
        } catch (err) {
            console.error('Exception:', err);
            setError('حدث خطأ في الاتصال بالخادم');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10" dir="rtl">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
                        <Sparkles className="text-primary-foreground" size={32} />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">إنشاء شركة جديدة</h1>
                    <p className="text-muted-foreground">أكمل الخطوات التالية لإعداد شركتك</p>
                </div>

                {/* Steps Indicator */}
                <div className="flex items-center justify-center mb-8">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = currentStep === step.id;
                        const isCompleted = currentStep > step.id;

                        return (
                            <div key={step.id} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                                        isCompleted && "bg-emerald-500 text-white",
                                        isActive && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                                        !isActive && !isCompleted && "bg-muted text-muted-foreground"
                                    )}>
                                        {isCompleted ? <Check size={24} /> : <Icon size={24} />}
                                    </div>
                                    <span className={cn(
                                        "text-xs mt-2 font-medium",
                                        isActive ? "text-primary" : "text-muted-foreground"
                                    )}>
                                        {step.title}
                                    </span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={cn(
                                        "w-16 h-1 mx-2 rounded-full transition-colors",
                                        isCompleted ? "bg-emerald-500" : "bg-muted"
                                    )} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Form Card */}
                <div className="bg-card rounded-2xl border border-border shadow-xl overflow-hidden">
                    <div className="p-8">
                        {/* Error Alert */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                                <AlertCircle size={20} />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}
                        {/* Step 1: Basic Info */}
                        {currentStep === 1 && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <Building2 className="text-primary" size={24} />
                                    معلومات الشركة الأساسية
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium mb-2">
                                            اسم الشركة بالعربي <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={(e) => updateForm('name', e.target.value)}
                                            className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary/20 text-lg"
                                            placeholder="مثال: شركة النور للتجارة"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            اسم الشركة بالإنجليزي
                                        </label>
                                        <input
                                            type="text"
                                            value={form.name_en}
                                            onChange={(e) => updateForm('name_en', e.target.value)}
                                            className="w-full px-4 py-3 border border-border rounded-xl bg-background"
                                            placeholder="Al Nour Trading Co."
                                            dir="ltr"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            الاسم القانوني
                                        </label>
                                        <input
                                            type="text"
                                            value={form.legal_name}
                                            onChange={(e) => updateForm('legal_name', e.target.value)}
                                            className="w-full px-4 py-3 border border-border rounded-xl bg-background"
                                            placeholder="الاسم كما في السجل التجاري"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Location & Contact */}
                        {currentStep === 2 && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <MapPin className="text-primary" size={24} />
                                    الموقع ومعلومات التواصل
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">الدولة</label>
                                        <select
                                            value={form.country}
                                            onChange={(e) => updateForm('country', e.target.value)}
                                            className="w-full px-4 py-3 border border-border rounded-xl bg-background"
                                        >
                                            {countries.map((c) => (
                                                <option key={c.code} value={c.name}>
                                                    {c.flag} {c.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">المدينة</label>
                                        <input
                                            type="text"
                                            value={form.city}
                                            onChange={(e) => updateForm('city', e.target.value)}
                                            className="w-full px-4 py-3 border border-border rounded-xl bg-background"
                                            placeholder="القاهرة"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium mb-2">العنوان</label>
                                        <textarea
                                            value={form.address}
                                            onChange={(e) => updateForm('address', e.target.value)}
                                            className="w-full px-4 py-3 border border-border rounded-xl bg-background"
                                            rows={2}
                                            placeholder="العنوان التفصيلي"
                                        />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium mb-2">
                                            <Phone size={14} />
                                            رقم الهاتف
                                        </label>
                                        <input
                                            type="tel"
                                            value={form.phone}
                                            onChange={(e) => updateForm('phone', e.target.value)}
                                            className="w-full px-4 py-3 border border-border rounded-xl bg-background"
                                            placeholder="+20 1234567890"
                                            dir="ltr"
                                        />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium mb-2">
                                            <Mail size={14} />
                                            البريد الإلكتروني
                                        </label>
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => updateForm('email', e.target.value)}
                                            className="w-full px-4 py-3 border border-border rounded-xl bg-background"
                                            placeholder="info@company.com"
                                            dir="ltr"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="flex items-center gap-2 text-sm font-medium mb-2">
                                            <Globe size={14} />
                                            الموقع الإلكتروني
                                        </label>
                                        <input
                                            type="url"
                                            value={form.website}
                                            onChange={(e) => updateForm('website', e.target.value)}
                                            className="w-full px-4 py-3 border border-border rounded-xl bg-background"
                                            placeholder="https://www.company.com"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Currency & Tax */}
                        {currentStep === 3 && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <CreditCard className="text-primary" size={24} />
                                    العملة والضريبة
                                </h2>

                                <div>
                                    <label className="block text-sm font-medium mb-3">اختر العملة الأساسية</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {currencies.slice(0, 8).map((currency) => (
                                            <button
                                                key={currency.code}
                                                type="button"
                                                onClick={() => updateForm('currency', currency.code)}
                                                className={cn(
                                                    "p-4 rounded-xl border-2 transition-all text-center",
                                                    form.currency === currency.code
                                                        ? "border-primary bg-primary/10"
                                                        : "border-border hover:border-primary/50"
                                                )}
                                            >
                                                <div className="text-2xl mb-1">{currency.flag}</div>
                                                <div className="font-bold">{currency.symbol}</div>
                                                <div className="text-xs text-muted-foreground">{currency.name}</div>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="mt-4">
                                        <select
                                            value={form.currency}
                                            onChange={(e) => updateForm('currency', e.target.value)}
                                            className="w-full px-4 py-3 border border-border rounded-xl bg-background"
                                        >
                                            {currencies.map((c) => (
                                                <option key={c.code} value={c.code}>
                                                    {c.flag} {c.name} ({c.symbol})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="border-t border-border pt-6">
                                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                                        <div>
                                            <h4 className="font-medium">تفعيل ضريبة القيمة المضافة (VAT)</h4>
                                            <p className="text-sm text-muted-foreground">
                                                سيتم احتساب الضريبة تلقائياً على الفواتير
                                            </p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={form.vat_enabled}
                                                onChange={(e) => updateForm('vat_enabled', e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-14 h-7 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:right-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                                        </label>
                                    </div>

                                    {form.vat_enabled && (
                                        <div className="mt-4">
                                            <label className="block text-sm font-medium mb-2">نسبة الضريبة (%)</label>
                                            <input
                                                type="number"
                                                value={form.vat_rate}
                                                onChange={(e) => updateForm('vat_rate', parseFloat(e.target.value) || 0)}
                                                className="w-32 px-4 py-3 border border-border rounded-xl bg-background text-center"
                                                min="0"
                                                max="100"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 4: Legal */}
                        {currentStep === 4 && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <Receipt className="text-primary" size={24} />
                                    المعلومات القانونية
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">الرقم الضريبي</label>
                                        <input
                                            type="text"
                                            value={form.tax_number}
                                            onChange={(e) => updateForm('tax_number', e.target.value)}
                                            className="w-full px-4 py-3 border border-border rounded-xl bg-background"
                                            placeholder="123-456-789"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">رقم السجل التجاري</label>
                                        <input
                                            type="text"
                                            value={form.commercial_register}
                                            onChange={(e) => updateForm('commercial_register', e.target.value)}
                                            className="w-full px-4 py-3 border border-border rounded-xl bg-background"
                                            placeholder="12345"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">بادئة أرقام الفواتير</label>
                                        <input
                                            type="text"
                                            value={form.invoice_prefix}
                                            onChange={(e) => updateForm('invoice_prefix', e.target.value.toUpperCase())}
                                            className="w-full px-4 py-3 border border-border rounded-xl bg-background"
                                            placeholder="INV"
                                            maxLength={5}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            مثال: {form.invoice_prefix}-2024-0001
                                        </p>
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="mt-8 p-6 bg-primary/5 rounded-xl border border-primary/20">
                                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                                        <Check className="text-primary" size={20} />
                                        ملخص الإعدادات
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">الشركة:</span>
                                            <p className="font-medium">{form.name || '-'}</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">الدولة:</span>
                                            <p className="font-medium">{form.country || '-'}</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">العملة:</span>
                                            <p className="font-medium">
                                                {currencies.find(c => c.code === form.currency)?.name}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">الضريبة:</span>
                                            <p className="font-medium">
                                                {form.vat_enabled ? `${form.vat_rate}%` : 'غير مفعلة'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between p-6 bg-muted/30 border-t border-border">
                        <button
                            onClick={prevStep}
                            disabled={currentStep === 1}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl hover:bg-muted transition-colors disabled:opacity-50"
                        >
                            <ArrowRight size={18} />
                            السابق
                        </button>

                        {currentStep < 4 ? (
                            <button
                                onClick={nextStep}
                                className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 font-medium"
                            >
                                التالي
                                <ArrowLeft size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading || !form.name}
                                className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        جاري الإنشاء...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        إنشاء الشركة
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
