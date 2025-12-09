'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDeviceFingerprint } from '@/hooks/useDeviceFingerprint';
import { Monitor, AlertCircle } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const { deviceInfo, isLoading: isDeviceLoading } = useDeviceFingerprint();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [deviceBlocked, setDeviceBlocked] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        remember: false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setDeviceBlocked(false);

        try {
            // Call login API
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'خطأ في تسجيل الدخول');
                return;
            }

            // Check account status
            if (data.status === 'pending') {
                setError('حسابك في انتظار التفعيل من الإدارة');
                return;
            }

            if (data.status === 'suspended') {
                setError('حسابك موقوف. تواصل مع الإدارة');
                return;
            }

            // Check trial expiry
            if (data.trial_ends_at && new Date(data.trial_ends_at) < new Date()) {
                setError('انتهت الفترة التجريبية. قم بترقية اشتراكك');
                return;
            }

            // Verify device if fingerprint is available
            if (deviceInfo?.fingerprint) {
                const deviceResponse = await fetch('/api/devices', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: data.user.id,
                        fingerprint: deviceInfo.fingerprint,
                        device_info: deviceInfo,
                        ip_address: '', // Server will get this
                    }),
                });

                const deviceResult = await deviceResponse.json();

                if (!deviceResult.allowed) {
                    setDeviceBlocked(true);
                    setError(deviceResult.message || 'هذا الجهاز غير مصرح له بالدخول');
                    return;
                }
            }

            // Save user session
            localStorage.setItem('user_id', data.user.id);
            localStorage.setItem('user_email', data.user.email);
            localStorage.setItem('user_name', data.user.name);
            localStorage.setItem('selected_company_id', data.company_id);
            document.cookie = `company_id=${data.company_id}; path=/; max-age=31536000`;
            document.cookie = `user_id=${data.user.id}; path=/; max-age=31536000`;

            router.push('/dashboard');
        } catch (err) {
            console.error('Login error:', err);
            setError('حدث خطأ غير متوقع');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md space-y-8">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 mb-8">
                        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                            E
                        </div>
                        <span className="text-xl font-bold">ERP SaaS</span>
                    </Link>

                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            مرحباً بعودتك! 👋
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            سجّل دخولك للوصول إلى لوحة التحكم
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className={`p-4 rounded-lg text-sm font-medium flex items-start gap-3 ${deviceBlocked
                                ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                                : 'bg-destructive/10 text-destructive'
                            }`}>
                            {deviceBlocked ? (
                                <Monitor className="w-5 h-5 mt-0.5 shrink-0" />
                            ) : (
                                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                            )}
                            <div>
                                <p>{error}</p>
                                {deviceBlocked && (
                                    <p className="text-xs mt-2 opacity-80">
                                        تم إرسال طلب للمدير للموافقة على هذا الجهاز. حاول مرة أخرى لاحقاً.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="البريد الإلكتروني"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="example@company.com"
                            required
                        />

                        <Input
                            label="كلمة المرور"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="••••••••"
                            required
                        />

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                                <input
                                    type="checkbox"
                                    checked={formData.remember}
                                    onChange={(e) => setFormData({ ...formData, remember: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <span className="text-muted-foreground">تذكرني</span>
                            </label>
                            <Link href="/forgot-password" className="text-sm text-primary hover:underline font-medium">
                                نسيت كلمة المرور؟
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            disabled={loading || isDeviceLoading}
                        >
                            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground">
                        ليس لديك حساب؟{' '}
                        <Link href="/register" className="text-primary font-medium hover:underline">
                            إنشاء حساب تجريبي مجاني
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right Side - Image/Branding */}
            <div className="hidden lg:flex flex-1 bg-primary items-center justify-center p-12 text-primary-foreground relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-violet-900 opacity-90" />
                <div className="relative z-10 max-w-lg text-center">
                    <div className="text-6xl mb-8">🚀</div>
                    <h2 className="text-4xl font-bold mb-6">
                        أدِر أعمالك بذكاء
                    </h2>
                    <p className="text-primary-foreground/80 text-xl leading-relaxed">
                        نظام ERP متكامل يساعدك على إدارة الحسابات، المخازن، المبيعات،
                        وشركات الشحن في مكان واحد
                    </p>

                    <div className="mt-12 space-y-4 text-right inline-block w-full max-w-sm">
                        {[
                            '14 يوم تجربة مجانية',
                            'بدون بطاقة ائتمانية',
                            'دعم فني 24/7',
                            'ترقية في أي وقت',
                        ].map((feature, index) => (
                            <div key={index} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
                                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="font-medium">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
