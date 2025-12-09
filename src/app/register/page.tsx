'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        // Step 1: Account Info
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        // Step 2: Company Info
        companyName: '',
        industry: '',
        employeesCount: '',
        // Step 3: Plan Selection
        plan: 'free',
        agreeTerms: false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (step < 3) {
            // Validate current step
            if (step === 1) {
                if (formData.password !== formData.confirmPassword) {
                    setError('كلمة المرور غير متطابقة');
                    return;
                }
                if (formData.password.length < 8) {
                    setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
                    return;
                }
            }
            setError('');
            setStep(step + 1);
            return;
        }

        // Final submission
        if (!formData.agreeTerms) {
            setError('يجب الموافقة على الشروط والأحكام');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Call register API
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password,
                    companyName: formData.companyName,
                    industry: formData.industry,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'حدث خطأ أثناء إنشاء الحساب');
                return;
            }

            // Save user session
            localStorage.setItem('user_id', data.user.id);
            localStorage.setItem('user_email', data.user.email);
            localStorage.setItem('user_name', data.user.name);
            localStorage.setItem('selected_company_id', data.company.id);
            document.cookie = `company_id=${data.company.id}; path=/; max-age=31536000`;
            document.cookie = `user_id=${data.user.id}; path=/; max-age=31536000`;

            // Redirect to dashboard
            router.push('/dashboard');
        } catch (err) {
            console.error('Registration error:', err);
            setError('حدث خطأ أثناء إنشاء الحساب');
        } finally {
            setLoading(false);
        }
    };

    const industries = [
        { value: 'retail', label: 'تجارة التجزئة' },
        { value: 'wholesale', label: 'تجارة الجملة' },
        { value: 'ecommerce', label: 'التجارة الإلكترونية' },
        { value: 'services', label: 'الخدمات' },
        { value: 'manufacturing', label: 'التصنيع' },
        { value: 'food', label: 'الأغذية والمشروبات' },
        { value: 'other', label: 'أخرى' },
    ];

    const employeeOptions = [
        { value: '1-5', label: '1-5 موظفين' },
        { value: '6-20', label: '6-20 موظف' },
        { value: '21-50', label: '21-50 موظف' },
        { value: '51-100', label: '51-100 موظف' },
        { value: '100+', label: 'أكثر من 100' },
    ];

    const plans = [
        {
            id: 'free',
            name: 'مجاني',
            price: '0',
            features: ['مستخدم واحد', 'شركة واحدة', '50 منتج'],
        },
        {
            id: 'starter',
            name: 'المبتدئ',
            price: '99',
            features: ['3 مستخدمين', 'شركة واحدة', '500 منتج'],
        },
        {
            id: 'professional',
            name: 'المحترف',
            price: '299',
            features: ['10 مستخدمين', '3 شركات', 'ربط Shopify'],
            popular: true,
        },
        {
            id: 'enterprise',
            name: 'المؤسسي',
            price: '599',
            features: ['50 مستخدم', '10 شركات', 'كل المميزات'],
        },
    ];

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-lg">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 mb-8">
                        <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
                            <span className="text-white font-bold text-xl">E</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900">ERP SaaS</span>
                    </Link>

                    {/* Progress Steps */}
                    <div className="flex items-center gap-4 mb-8">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex items-center gap-2 flex-1">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${step >= s
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-400'
                                        }`}
                                >
                                    {step > s ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        s
                                    )}
                                </div>
                                {s < 3 && (
                                    <div className={`flex-1 h-1 rounded ${step > s ? 'bg-indigo-600' : 'bg-gray-100'}`} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Step Titles */}
                    <div className="mb-8">
                        {step === 1 && (
                            <>
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">إنشاء حساب جديد</h1>
                                <p className="text-gray-600">أدخل بياناتك الشخصية للبدء</p>
                            </>
                        )}
                        {step === 2 && (
                            <>
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">معلومات الشركة</h1>
                                <p className="text-gray-600">أخبرنا عن نشاطك التجاري</p>
                            </>
                        )}
                        {step === 3 && (
                            <>
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">اختر خطتك</h1>
                                <p className="text-gray-600">يمكنك الترقية في أي وقت</p>
                            </>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Step 1: Account Info */}
                        {step === 1 && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        الاسم الكامل
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                        placeholder="أحمد محمد"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        البريد الإلكتروني
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                        placeholder="example@company.com"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        رقم الهاتف
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                        placeholder="01xxxxxxxxx"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            كلمة المرور
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            تأكيد كلمة المرور
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Step 2: Company Info */}
                        {step === 2 && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        اسم الشركة
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.companyName}
                                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                        placeholder="شركة النجاح"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        مجال العمل
                                    </label>
                                    <select
                                        value={formData.industry}
                                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all bg-white"
                                        required
                                    >
                                        <option value="">اختر مجال العمل</option>
                                        {industries.map((ind) => (
                                            <option key={ind.value} value={ind.value}>
                                                {ind.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        عدد الموظفين
                                    </label>
                                    <select
                                        value={formData.employeesCount}
                                        onChange={(e) => setFormData({ ...formData, employeesCount: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all bg-white"
                                        required
                                    >
                                        <option value="">اختر عدد الموظفين</option>
                                        {employeeOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}

                        {/* Step 3: Plan Selection */}
                        {step === 3 && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    {plans.map((plan) => (
                                        <div
                                            key={plan.id}
                                            onClick={() => setFormData({ ...formData, plan: plan.id })}
                                            className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.plan === plan.id
                                                ? 'border-indigo-600 bg-indigo-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            {plan.popular && (
                                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full">
                                                    الأكثر شعبية
                                                </div>
                                            )}
                                            <div className="font-bold text-gray-900">{plan.name}</div>
                                            <div className="text-2xl font-bold text-indigo-600 mt-1">
                                                {plan.price} <span className="text-sm text-gray-500">ج.م/شهر</span>
                                            </div>
                                            <ul className="mt-3 space-y-1">
                                                {plan.features.map((feature, i) => (
                                                    <li key={i} className="text-xs text-gray-600 flex items-center gap-1">
                                                        <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        {feature}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>

                                <label className="flex items-start gap-3 cursor-pointer mt-6">
                                    <input
                                        type="checkbox"
                                        checked={formData.agreeTerms}
                                        onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                                        className="w-5 h-5 mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-gray-600">
                                        أوافق على{' '}
                                        <a href="#" className="text-indigo-600 hover:underline">الشروط والأحكام</a>
                                        {' '}و{' '}
                                        <a href="#" className="text-indigo-600 hover:underline">سياسة الخصوصية</a>
                                    </span>
                                </label>
                            </>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex gap-4">
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={() => setStep(step - 1)}
                                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                                >
                                    السابق
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        جاري إنشاء الحساب...
                                    </>
                                ) : step === 3 ? (
                                    'إنشاء الحساب'
                                ) : (
                                    'التالي'
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Login Link */}
                    <p className="mt-8 text-center text-gray-600">
                        لديك حساب بالفعل؟{' '}
                        <Link href="/login" className="text-indigo-600 font-medium hover:text-indigo-700">
                            تسجيل الدخول
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right Side - Branding */}
            <div className="hidden lg:flex flex-1 gradient-hero items-center justify-center p-12">
                <div className="max-w-lg text-white text-center">
                    <div className="text-3xl mb-6">✨</div>
                    <h2 className="text-3xl font-bold mb-4">
                        ابدأ رحلتك معنا
                    </h2>
                    <p className="text-white/80 text-lg mb-8">
                        انضم إلى أكثر من 500 شركة تستخدم نظامنا لإدارة أعمالها
                    </p>

                    {/* Testimonial */}
                    <div className="bg-white/10 rounded-2xl p-6 text-right">
                        <p className="text-white/90 mb-4">
                            &quot;نظام ERP ساعدنا على توفير 10 ساعات أسبوعياً في إدارة الحسابات والمخزون.
                            أنصح به بشدة!&quot;
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                👨‍💼
                            </div>
                            <div>
                                <div className="font-medium">أحمد محمد</div>
                                <div className="text-sm text-white/60">مدير شركة النجاح</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
