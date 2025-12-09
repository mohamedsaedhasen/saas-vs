'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface InvitationData {
    id: string;
    email: string;
    company: {
        id: string;
        name: string;
    };
    role: {
        id: string;
        name_ar: string;
    };
    status: string;
    expires_at: string;
}

export default function AcceptInvitePage() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;

    const [invitation, setInvitation] = useState<InvitationData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [status, setStatus] = useState<'loading' | 'valid' | 'expired' | 'accepted' | 'error'>('loading');

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });

    useEffect(() => {
        verifyInvitation();
    }, [token]);

    const verifyInvitation = async () => {
        try {
            const response = await fetch(`/api/invite/${token}`);
            const data = await response.json();

            if (!response.ok) {
                if (data.status === 'expired') {
                    setStatus('expired');
                } else if (data.status === 'accepted') {
                    setStatus('accepted');
                } else {
                    setStatus('error');
                    setError(data.error);
                }
                return;
            }

            setInvitation(data);
            setStatus('valid');
        } catch (err) {
            setStatus('error');
            setError('فشل التحقق من الدعوة');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('كلمة المرور غير متطابقة');
            return;
        }

        if (formData.password.length < 8) {
            setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/invite/${token}/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    phone: formData.phone,
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'فشل قبول الدعوة');
                return;
            }

            // Set session cookies
            document.cookie = `user_id=${data.user.id}; path=/; max-age=31536000`;
            document.cookie = `company_id=${data.company_id}; path=/; max-age=31536000`;
            localStorage.setItem('user_id', data.user.id);
            localStorage.setItem('selected_company_id', data.company_id);

            // Redirect to dashboard
            router.push('/dashboard');
        } catch (err) {
            setError('حدث خطأ غير متوقع');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-muted-foreground">جاري التحقق من الدعوة...</p>
                </div>
            </div>
        );
    }

    if (status === 'expired') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center max-w-md">
                    <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">انتهت صلاحية الدعوة</h1>
                    <p className="text-muted-foreground mb-6">
                        هذه الدعوة لم تعد صالحة. يرجى طلب دعوة جديدة من المسؤول.
                    </p>
                    <Button onClick={() => router.push('/login')}>
                        الذهاب لتسجيل الدخول
                    </Button>
                </div>
            </div>
        );
    }

    if (status === 'accepted') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center max-w-md">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">تم قبول الدعوة مسبقاً</h1>
                    <p className="text-muted-foreground mb-6">
                        يمكنك تسجيل الدخول بحسابك.
                    </p>
                    <Button onClick={() => router.push('/login')}>
                        تسجيل الدخول
                    </Button>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center max-w-md">
                    <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">خطأ</h1>
                    <p className="text-muted-foreground mb-6">{error}</p>
                    <Button onClick={() => router.push('/login')}>
                        الذهاب لتسجيل الدخول
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                <div className="bg-card rounded-xl shadow-lg p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">تم دعوتك للانضمام</h1>
                        <p className="text-muted-foreground">
                            تمت دعوتك للانضمام إلى{' '}
                            <span className="font-medium text-foreground">
                                {invitation?.company.name}
                            </span>
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            كـ <span className="font-medium">{invitation?.role.name_ar}</span>
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">البريد الإلكتروني</label>
                            <input
                                type="email"
                                value={invitation?.email || ''}
                                disabled
                                className="w-full px-4 py-2 border rounded-lg bg-muted"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">الاسم الكامل</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="أدخل اسمك"
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">رقم الهاتف (اختياري)</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="01xxxxxxxxx"
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">كلمة المرور</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="8 أحرف على الأقل"
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                required
                                minLength={8}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">تأكيد كلمة المرور</label>
                            <input
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                placeholder="أعد إدخال كلمة المرور"
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full"
                            size="lg"
                        >
                            {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء الحساب والانضمام'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
