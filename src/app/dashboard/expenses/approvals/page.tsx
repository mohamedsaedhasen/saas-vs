'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ArrowRight,
    Check,
    X,
    Clock,
    User,
    FileText,
    AlertCircle,
    RefreshCw,
    MessageSquare,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PendingApproval, ExpenseApproval, ApprovalStatus } from '@/types/expenses';

export default function ApprovalsPage() {
    const [approvals, setApprovals] = useState<PendingApproval[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [comments, setComments] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchApprovals();
    }, []);

    const fetchApprovals = async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/api/expenses/approvals/pending');
            const data = await res.json();

            if (Array.isArray(data)) {
                setApprovals(data);
            } else if (data && Array.isArray(data.data)) {
                setApprovals(data.data);
            } else {
                setApprovals([]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ');
            setApprovals([]);
        } finally {
            setIsLoading(false);
        }
    };

    const totalPending = approvals.length;
    const totalAmount = approvals.reduce((sum, a) => sum + (a.amount || 0), 0);

    const handleApprove = async (id: string) => {
        setActionLoading(true);
        try {
            await fetch(`/api/expenses/approvals/${id}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comments }),
            });
            setApprovals((prev) => prev.filter((a) => a.voucher_id !== id));
        } catch (err) {
            console.error('Error approving:', err);
        } finally {
            setActionLoading(false);
            setSelectedId(null);
            setComments('');
        }
    };

    const handleReject = async (id: string) => {
        if (!comments.trim()) {
            alert('يرجى إدخال سبب الرفض');
            return;
        }
        setActionLoading(true);
        try {
            await fetch(`/api/expenses/approvals/${id}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comments }),
            });
            setApprovals((prev) => prev.filter((a) => a.voucher_id !== id));
        } catch (err) {
            console.error('Error rejecting:', err);
        } finally {
            setActionLoading(false);
            setSelectedId(null);
            setComments('');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">خطأ في تحميل البيانات</h2>
                <p className="text-muted-foreground">{error}</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/expenses"
                        className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
                    >
                        <ArrowRight size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">الموافقات المعلقة</h1>
                        <p className="text-muted-foreground mt-1">
                            مراجعة واعتماد سندات الصرف المطلوبة
                        </p>
                    </div>
                </div>

                <button
                    onClick={fetchApprovals}
                    className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
                >
                    <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                            <Clock size={20} className="text-amber-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{totalPending}</div>
                            <div className="text-sm text-muted-foreground">طلبات معلقة</div>
                        </div>
                    </div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <FileText size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{totalAmount.toLocaleString('ar-EG')}</div>
                            <div className="text-sm text-muted-foreground">إجمالي المبالغ</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Approvals List */}
            <div className="space-y-4">
                {approvals.map((approval) => (
                    <div
                        key={approval.voucher_id}
                        className="bg-card rounded-xl border border-border overflow-hidden"
                    >
                        {/* Main Info */}
                        <div className="p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded">
                                            {approval.voucher_number}
                                        </span>
                                        <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">
                                            المستوى {approval.approval_level}
                                        </span>
                                        {approval.days_pending > 0 && (
                                            <span className="text-xs text-muted-foreground">
                                                منذ {approval.days_pending} يوم
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="font-semibold text-lg mb-1">{approval.description}</h3>

                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <FileText size={14} />
                                            {approval.category_name}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <User size={14} />
                                            {approval.requester_name}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-left">
                                    <div className="text-2xl font-bold">{(approval.amount || 0).toLocaleString('ar-EG')}</div>
                                    <div className="text-sm text-muted-foreground">ج.م</div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-4 bg-muted/30 border-t border-border">
                            {selectedId === approval.voucher_id ? (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">
                                            ملاحظات / سبب الرفض
                                        </label>
                                        <textarea
                                            value={comments}
                                            onChange={(e) => setComments(e.target.value)}
                                            rows={2}
                                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none"
                                            placeholder="أدخل ملاحظاتك هنا..."
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleApprove(approval.voucher_id)}
                                            disabled={actionLoading}
                                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                                        >
                                            <Check size={16} />
                                            موافقة
                                        </button>
                                        <button
                                            onClick={() => handleReject(approval.voucher_id)}
                                            disabled={actionLoading}
                                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                                        >
                                            <X size={16} />
                                            رفض
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedId(null);
                                                setComments('');
                                            }}
                                            className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm"
                                        >
                                            إلغاء
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setSelectedId(approval.voucher_id)}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                                    >
                                        <MessageSquare size={16} />
                                        مراجعة واتخاذ إجراء
                                    </button>
                                    <Link
                                        href={`/dashboard/expenses/vouchers/${approval.voucher_id}`}
                                        className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm"
                                    >
                                        عرض التفاصيل
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {approvals.length === 0 && (
                    <div className="bg-card rounded-xl border border-border p-12 text-center">
                        <Check size={48} className="mx-auto mb-4 text-emerald-500" />
                        <h3 className="font-semibold text-lg mb-1">لا توجد موافقات معلقة</h3>
                        <p className="text-muted-foreground">تم اعتماد جميع الطلبات</p>
                    </div>
                )}
            </div>
        </div>
    );
}
