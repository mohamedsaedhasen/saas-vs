'use client';

import { useState, useEffect } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { Button } from '@/components/ui/button';
import {
    Shield,
    Plus,
    Edit2,
    Trash2,
    Check,
    X,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

interface Role {
    id: string;
    name: string;
    name_ar: string;
    description?: string;
    is_system: boolean;
    is_active: boolean;
    permissions?: RolePermission[];
}

interface RolePermission {
    module_code: string;
    module_name: string;
    actions: string[];
}

interface Module {
    id: string;
    code: string;
    name: string;
    name_ar: string;
}

interface Permission {
    id: string;
    module_id: string;
    action: string;
}

export default function RolesPage() {
    const { company } = useCompany();
    const [roles, setRoles] = useState<Role[]>([]);
    const [modules, setModules] = useState<Module[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [expandedRole, setExpandedRole] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [company?.id]);

    const loadData = async () => {
        if (!company?.id) return;
        setIsLoading(true);
        try {
            const [rolesRes, modulesRes, permsRes] = await Promise.all([
                fetch(`/api/roles?company_id=${company.id}`),
                fetch('/api/modules'),
                fetch('/api/permissions/all'),
            ]);

            if (rolesRes.ok) setRoles(await rolesRes.json());
            if (modulesRes.ok) setModules(await modulesRes.json());
            if (permsRes.ok) setPermissions(await permsRes.json());
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteRole = async (roleId: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا الدور؟')) return;

        try {
            const response = await fetch(`/api/roles/${roleId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setRoles(roles.filter(r => r.id !== roleId));
            }
        } catch (error) {
            console.error('Error deleting role:', error);
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Shield className="w-6 h-6" />
                        إدارة الأدوار
                    </h1>
                    <p className="text-muted-foreground">تحديد صلاحيات كل دور في النظام</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 ml-2" />
                    إنشاء دور جديد
                </Button>
            </div>

            {/* Roles List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                        جاري التحميل...
                    </div>
                ) : roles.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        لا توجد أدوار
                    </div>
                ) : (
                    roles.map((role) => (
                        <div key={role.id} className="bg-card rounded-xl border overflow-hidden">
                            {/* Role Header */}
                            <div
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30"
                                onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Shield className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">{role.name_ar || role.name}</h3>
                                        <p className="text-sm text-muted-foreground">{role.description}</p>
                                    </div>
                                    {role.is_system && (
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                            نظامي
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {!role.is_system && (
                                        <>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingRole(role);
                                                    setShowCreateModal(true);
                                                }}
                                                className="p-2 hover:bg-muted rounded-lg"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteRole(role.id);
                                                }}
                                                className="p-2 hover:bg-destructive/10 text-destructive rounded-lg"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                    {expandedRole === role.id ? (
                                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                    )}
                                </div>
                            </div>

                            {/* Permissions Matrix */}
                            {expandedRole === role.id && (
                                <div className="border-t p-4 bg-muted/20">
                                    <h4 className="font-medium mb-4">الصلاحيات</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-right py-2 px-3">الوحدة</th>
                                                    <th className="text-center py-2 px-3">عرض</th>
                                                    <th className="text-center py-2 px-3">إضافة/تعديل</th>
                                                    <th className="text-center py-2 px-3">حذف</th>
                                                    <th className="text-center py-2 px-3">تصدير</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {modules.map((module) => (
                                                    <tr key={module.id} className="border-b last:border-0">
                                                        <td className="py-2 px-3 font-medium">{module.name_ar || module.name}</td>
                                                        <td className="text-center py-2 px-3">
                                                            <PermissionCheck
                                                                roleId={role.id}
                                                                moduleCode={module.code}
                                                                action="read"
                                                                isSystem={role.is_system}
                                                            />
                                                        </td>
                                                        <td className="text-center py-2 px-3">
                                                            <PermissionCheck
                                                                roleId={role.id}
                                                                moduleCode={module.code}
                                                                action="write"
                                                                isSystem={role.is_system}
                                                            />
                                                        </td>
                                                        <td className="text-center py-2 px-3">
                                                            <PermissionCheck
                                                                roleId={role.id}
                                                                moduleCode={module.code}
                                                                action="delete"
                                                                isSystem={role.is_system}
                                                            />
                                                        </td>
                                                        <td className="text-center py-2 px-3">
                                                            <PermissionCheck
                                                                roleId={role.id}
                                                                moduleCode={module.code}
                                                                action="export"
                                                                isSystem={role.is_system}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Create/Edit Modal */}
            {showCreateModal && (
                <CreateRoleModal
                    role={editingRole}
                    modules={modules}
                    companyId={company?.id || ''}
                    onClose={() => {
                        setShowCreateModal(false);
                        setEditingRole(null);
                    }}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        setEditingRole(null);
                        loadData();
                    }}
                />
            )}
        </div>
    );
}

// Permission Check Component
function PermissionCheck({
    roleId,
    moduleCode,
    action,
    isSystem
}: {
    roleId: string;
    moduleCode: string;
    action: string;
    isSystem: boolean;
}) {
    const [hasPermission, setHasPermission] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkPermission();
    }, [roleId, moduleCode, action]);

    const checkPermission = async () => {
        try {
            const response = await fetch(`/api/roles/${roleId}/permissions?module=${moduleCode}&action=${action}`);
            if (response.ok) {
                const data = await response.json();
                setHasPermission(data.hasPermission);
            }
        } catch (error) {
            console.error('Error checking permission:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const togglePermission = async () => {
        if (isSystem) return; // Can't modify system roles

        try {
            const response = await fetch(`/api/roles/${roleId}/permissions`, {
                method: hasPermission ? 'DELETE' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ module: moduleCode, action }),
            });

            if (response.ok) {
                setHasPermission(!hasPermission);
            }
        } catch (error) {
            console.error('Error toggling permission:', error);
        }
    };

    if (isLoading) {
        return <div className="w-5 h-5 mx-auto bg-muted rounded animate-pulse" />;
    }

    return (
        <button
            onClick={togglePermission}
            disabled={isSystem}
            className={`w-6 h-6 rounded flex items-center justify-center mx-auto transition-colors ${hasPermission
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-400'
                } ${isSystem ? 'cursor-not-allowed' : 'hover:opacity-80'}`}
        >
            {hasPermission ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
        </button>
    );
}

// Create Role Modal
function CreateRoleModal({
    role,
    modules,
    companyId,
    onClose,
    onSuccess,
}: {
    role: Role | null;
    modules: Module[];
    companyId: string;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [formData, setFormData] = useState({
        name: role?.name || '',
        name_ar: role?.name_ar || '',
        description: role?.description || '',
    });
    const [selectedPermissions, setSelectedPermissions] = useState<Record<string, string[]>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.name_ar) {
            setError('الاسم مطلوب');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(role ? `/api/roles/${role.id}` : '/api/roles', {
                method: role ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    company_id: companyId,
                    ...formData,
                    permissions: selectedPermissions,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.error || 'فشل حفظ الدور');
                return;
            }

            onSuccess();
        } catch (err) {
            setError('حدث خطأ غير متوقع');
        } finally {
            setIsLoading(false);
        }
    };

    const togglePermission = (moduleCode: string, action: string) => {
        setSelectedPermissions(prev => {
            const modulePerms = prev[moduleCode] || [];
            if (modulePerms.includes(action)) {
                return { ...prev, [moduleCode]: modulePerms.filter(a => a !== action) };
            }
            return { ...prev, [moduleCode]: [...modulePerms, action] };
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold">
                        {role ? 'تعديل الدور' : 'إنشاء دور جديد'}
                    </h2>
                </div>

                {error && (
                    <div className="mx-6 mt-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">اسم الدور (English)</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="sales_manager"
                                className="w-full px-4 py-2 border rounded-lg"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">اسم الدور (عربي)</label>
                            <input
                                type="text"
                                value={formData.name_ar}
                                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                                placeholder="مدير المبيعات"
                                className="w-full px-4 py-2 border rounded-lg"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">الوصف</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="وصف الدور..."
                            className="w-full px-4 py-2 border rounded-lg"
                            rows={2}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-4">الصلاحيات</label>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted">
                                    <tr>
                                        <th className="text-right py-2 px-3">الوحدة</th>
                                        <th className="text-center py-2 px-3">عرض</th>
                                        <th className="text-center py-2 px-3">تعديل</th>
                                        <th className="text-center py-2 px-3">حذف</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {modules.map((module) => (
                                        <tr key={module.id} className="border-t">
                                            <td className="py-2 px-3">{module.name_ar}</td>
                                            {['read', 'write', 'delete'].map((action) => (
                                                <td key={action} className="text-center py-2 px-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPermissions[module.code]?.includes(action)}
                                                        onChange={() => togglePermission(module.code, action)}
                                                        className="w-4 h-4 rounded"
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            إلغاء
                        </Button>
                        <Button type="submit" disabled={isLoading} className="flex-1">
                            {isLoading ? 'جاري الحفظ...' : 'حفظ'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
