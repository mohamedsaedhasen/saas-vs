'use client';

import { useState, useEffect } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { Button } from '@/components/ui/button';
import {
    Plus,
    UserCog,
    Mail,
    Shield,
    MoreVertical,
    Check,
    X,
    Clock,
    Search,
    Monitor,
    Lock,
    Unlock
} from 'lucide-react';

interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    status: string;
    plan: string;
    device_restriction_enabled?: boolean;
    role?: {
        id: string;
        name: string;
        name_ar: string;
    };
    last_login_at?: string;
    created_at: string;
}

interface Role {
    id: string;
    name: string;
    name_ar: string;
    description?: string;
}

interface Invitation {
    id: string;
    email: string;
    status: string;
    role: {
        name_ar: string;
    };
    expires_at: string;
    created_at: string;
}

export default function UsersPage() {
    const { company } = useCompany();
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'users' | 'invitations'>('users');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showUserMenu, setShowUserMenu] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [company?.id]);

    const loadData = async () => {
        if (!company?.id) return;
        setIsLoading(true);
        try {
            const [usersRes, rolesRes, invitesRes] = await Promise.all([
                fetch(`/api/users?company_id=${company.id}`),
                fetch(`/api/roles?company_id=${company.id}`),
                fetch(`/api/users/invitations?company_id=${company.id}`),
            ]);

            if (usersRes.ok) setUsers(await usersRes.json());
            if (rolesRes.ok) setRoles(await rolesRes.json());
            if (invitesRes.ok) setInvitations(await invitesRes.json());
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleDeviceRestriction = async (userId: string, currentValue: boolean) => {
        try {
            const response = await fetch(`/api/users/${userId}/device-restriction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: !currentValue }),
            });

            if (response.ok) {
                setUsers(users.map(u =>
                    u.id === userId
                        ? { ...u, device_restriction_enabled: !currentValue }
                        : u
                ));
            }
        } catch (error) {
            console.error('Error toggling device restriction:', error);
        }
        setShowUserMenu(null);
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            active: 'bg-green-100 text-green-700',
            trial: 'bg-blue-100 text-blue-700',
            pending: 'bg-yellow-100 text-yellow-700',
            suspended: 'bg-red-100 text-red-700',
        };
        const labels: Record<string, string> = {
            active: 'نشط',
            trial: 'تجريبي',
            pending: 'في الانتظار',
            suspended: 'موقوف',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
                {labels[status] || status}
            </span>
        );
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">إدارة المستخدمين</h1>
                    <p className="text-muted-foreground">إدارة مستخدمي الشركة وصلاحياتهم</p>
                </div>
                <Button onClick={() => setShowInviteModal(true)}>
                    <Plus className="w-4 h-4 ml-2" />
                    دعوة مستخدم
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`pb-3 px-1 border-b-2 transition-colors ${activeTab === 'users'
                        ? 'border-primary text-primary font-medium'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    المستخدمين ({users.length})
                </button>
                <button
                    onClick={() => setActiveTab('invitations')}
                    className={`pb-3 px-1 border-b-2 transition-colors ${activeTab === 'invitations'
                        ? 'border-primary text-primary font-medium'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    الدعوات ({invitations.filter(i => i.status === 'pending').length})
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="بحث..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
            </div>

            {/* Users List */}
            {activeTab === 'users' && (
                <div className="bg-card rounded-xl border overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-right px-4 py-3 text-sm font-medium">المستخدم</th>
                                <th className="text-right px-4 py-3 text-sm font-medium">الدور</th>
                                <th className="text-right px-4 py-3 text-sm font-medium">الحالة</th>
                                <th className="text-right px-4 py-3 text-sm font-medium">تقييد الجهاز</th>
                                <th className="text-right px-4 py-3 text-sm font-medium">آخر دخول</th>
                                <th className="text-right px-4 py-3 text-sm font-medium">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                        جاري التحميل...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                        لا يوجد مستخدمين
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <span className="text-primary font-medium">
                                                        {user.name.charAt(0)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="font-medium">{user.name}</div>
                                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Shield className="w-4 h-4 text-muted-foreground" />
                                                <span>{user.role?.name_ar || 'بدون دور'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {getStatusBadge(user.status)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => toggleDeviceRestriction(user.id, user.device_restriction_enabled || false)}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${user.device_restriction_enabled
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {user.device_restriction_enabled ? (
                                                    <>
                                                        <Lock className="w-4 h-4" />
                                                        مفعّل
                                                    </>
                                                ) : (
                                                    <>
                                                        <Unlock className="w-4 h-4" />
                                                        معطّل
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {user.last_login_at
                                                ? new Date(user.last_login_at).toLocaleDateString('ar-EG')
                                                : 'لم يسجل دخول'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="relative">
                                                <button
                                                    onClick={() => setShowUserMenu(showUserMenu === user.id ? null : user.id)}
                                                    className="p-2 hover:bg-muted rounded-lg"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                                {showUserMenu === user.id && (
                                                    <div className="absolute left-0 top-full mt-1 bg-card border rounded-lg shadow-lg z-10 min-w-[160px]">
                                                        <button
                                                            onClick={() => toggleDeviceRestriction(user.id, user.device_restriction_enabled || false)}
                                                            className="w-full text-right px-4 py-2 hover:bg-muted flex items-center gap-2 text-sm"
                                                        >
                                                            <Monitor className="w-4 h-4" />
                                                            {user.device_restriction_enabled ? 'إلغاء تقييد الجهاز' : 'تفعيل تقييد الجهاز'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Invitations List */}
            {activeTab === 'invitations' && (
                <div className="bg-card rounded-xl border overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-right px-4 py-3 text-sm font-medium">البريد الإلكتروني</th>
                                <th className="text-right px-4 py-3 text-sm font-medium">الدور</th>
                                <th className="text-right px-4 py-3 text-sm font-medium">الحالة</th>
                                <th className="text-right px-4 py-3 text-sm font-medium">تاريخ الانتهاء</th>
                                <th className="text-right px-4 py-3 text-sm font-medium">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {invitations.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                        لا توجد دعوات
                                    </td>
                                </tr>
                            ) : (
                                invitations.map((invite) => (
                                    <tr key={invite.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-muted-foreground" />
                                                {invite.email}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">{invite.role?.name_ar}</td>
                                        <td className="px-4 py-3">
                                            {invite.status === 'pending' && (
                                                <span className="flex items-center gap-1 text-yellow-600">
                                                    <Clock className="w-4 h-4" />
                                                    في الانتظار
                                                </span>
                                            )}
                                            {invite.status === 'accepted' && (
                                                <span className="flex items-center gap-1 text-green-600">
                                                    <Check className="w-4 h-4" />
                                                    مقبولة
                                                </span>
                                            )}
                                            {invite.status === 'expired' && (
                                                <span className="flex items-center gap-1 text-red-600">
                                                    <X className="w-4 h-4" />
                                                    منتهية
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {new Date(invite.expires_at).toLocaleDateString('ar-EG')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button className="text-sm text-primary hover:underline">
                                                إعادة إرسال
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Invite Modal */}
            {showInviteModal && (
                <InviteUserModal
                    roles={roles}
                    onClose={() => setShowInviteModal(false)}
                    onSuccess={() => {
                        setShowInviteModal(false);
                        loadData();
                    }}
                />
            )}
        </div>
    );
}

// Invite User Modal Component
function InviteUserModal({
    roles,
    onClose,
    onSuccess,
}: {
    roles: Role[];
    onClose: () => void;
    onSuccess: () => void;
}) {
    const { company } = useCompany();
    const [email, setEmail] = useState('');
    const [roleId, setRoleId] = useState('');
    const [deviceRestriction, setDeviceRestriction] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !roleId) {
            setError('جميع الحقول مطلوبة');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/users/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    company_id: company?.id,
                    email,
                    role_id: roleId,
                    device_restriction_enabled: deviceRestriction,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'فشل إرسال الدعوة');
                return;
            }

            onSuccess();
        } catch (err) {
            setError('حدث خطأ غير متوقع');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-xl shadow-xl w-full max-w-md p-6">
                <h2 className="text-xl font-bold mb-4">دعوة مستخدم جديد</h2>

                {error && (
                    <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            البريد الإلكتروني
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@example.com"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            الدور
                        </label>
                        <select
                            value={roleId}
                            onChange={(e) => setRoleId(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                            required
                        >
                            <option value="">اختر الدور</option>
                            {roles.map((role) => (
                                <option key={role.id} value={role.id}>
                                    {role.name_ar || role.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Device Restriction Toggle */}
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Monitor className="w-5 h-5 text-muted-foreground" />
                            <div>
                                <div className="font-medium text-sm">تقييد الجهاز</div>
                                <div className="text-xs text-muted-foreground">
                                    السماح بالدخول من أجهزة محددة فقط
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setDeviceRestriction(!deviceRestriction)}
                            className={`relative w-12 h-6 rounded-full transition-colors ${deviceRestriction ? 'bg-primary' : 'bg-gray-300'
                                }`}
                        >
                            <span
                                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${deviceRestriction ? 'right-1' : 'left-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                        >
                            إلغاء
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1"
                        >
                            {isLoading ? 'جاري الإرسال...' : 'إرسال الدعوة'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
