'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { ExpenseTree, ExpenseNodeDialog } from '@/components/expenses';
import type { ExpenseTreeNode, CreateExpenseCategoryInput, UpdateExpenseCategoryInput } from '@/types/expenses';

export default function ExpenseTreePage() {
    const [treeData, setTreeData] = useState<ExpenseTreeNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Dialog state
    const [showDialog, setShowDialog] = useState(false);
    const [selectedParent, setSelectedParent] = useState<ExpenseTreeNode | null>(null);
    const [editingCategory, setEditingCategory] = useState<ExpenseTreeNode | null>(null);

    // Related data
    const [costCenters, setCostCenters] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [existingAccounts, setExistingAccounts] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);

            // Fetch expense tree
            const treeRes = await fetch('/api/expenses/tree');
            const treeDataJson = await treeRes.json();
            if (Array.isArray(treeDataJson)) {
                setTreeData(treeDataJson);
            } else if (treeDataJson && Array.isArray(treeDataJson.data)) {
                setTreeData(treeDataJson.data);
            } else {
                setTreeData([]);
            }

            // Fetch cost centers
            const costCentersRes = await fetch('/api/cost-centers');
            const costCentersData = await costCentersRes.json();
            if (Array.isArray(costCentersData)) {
                setCostCenters(costCentersData);
            } else if (costCentersData && Array.isArray(costCentersData.data)) {
                setCostCenters(costCentersData.data);
            }

            // Fetch suppliers
            const suppliersRes = await fetch('/api/suppliers');
            const suppliersData = await suppliersRes.json();
            if (Array.isArray(suppliersData)) {
                setSuppliers(suppliersData.map((s: any) => ({ id: s.id, name: s.name })));
            } else if (suppliersData && Array.isArray(suppliersData.data)) {
                setSuppliers(suppliersData.data.map((s: any) => ({ id: s.id, name: s.name })));
            }

            // Fetch accounts
            const accountsRes = await fetch('/api/accounting/chart-of-accounts');
            const accountsData = await accountsRes.json();
            if (Array.isArray(accountsData)) {
                setExistingAccounts(accountsData.filter((a: any) => a.account_type === 'expense' || a.type === 'expense'));
            } else if (accountsData && Array.isArray(accountsData.data)) {
                setExistingAccounts(accountsData.data.filter((a: any) => a.account_type === 'expense' || a.type === 'expense'));
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'حدث خطأ');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = async () => {
        await fetchData();
    };

    const handleAddCategory = (parentId: string | null) => {
        if (parentId) {
            // Find parent in tree
            const findNode = (nodes: ExpenseTreeNode[]): ExpenseTreeNode | null => {
                for (const node of nodes) {
                    if (node.id === parentId) return node;
                    const found = findNode(node.children);
                    if (found) return found;
                }
                return null;
            };
            setSelectedParent(findNode(treeData));
        } else {
            setSelectedParent(null);
        }
        setEditingCategory(null);
        setShowDialog(true);
    };

    const handleEditCategory = (category: ExpenseTreeNode) => {
        setEditingCategory(category);
        setSelectedParent(null);
        setShowDialog(true);
    };

    const handleDeleteCategory = async (category: ExpenseTreeNode) => {
        if (!confirm(`هل أنت متأكد من حذف "${category.name_ar}"؟`)) return;

        try {
            await fetch(`/api/expenses/categories/${category.id}`, {
                method: 'DELETE',
            });
            handleRefresh();
        } catch (err) {
            console.error('Error deleting category:', err);
        }
    };

    const handleViewLedger = (category: ExpenseTreeNode) => {
        window.location.href = `/dashboard/expenses/tree/${category.id}/ledger`;
    };

    const handleCreateVoucher = (category: ExpenseTreeNode) => {
        window.location.href = `/dashboard/expenses/vouchers/new?category=${category.id}`;
    };

    const handleSubmitCategory = async (data: CreateExpenseCategoryInput | UpdateExpenseCategoryInput) => {
        try {
            if (editingCategory) {
                await fetch(`/api/expenses/categories/${editingCategory.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
            } else {
                await fetch('/api/expenses/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
            }
            setShowDialog(false);
            handleRefresh();
        } catch (err) {
            console.error('Error saving category:', err);
        }
    };

    const handleExport = () => {
        console.log('Exporting tree...');
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
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/expenses"
                    className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
                >
                    <ArrowRight size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">شجرة المصاريف</h1>
                    <p className="text-muted-foreground mt-1">
                        إدارة تصنيفات المصاريف الهرمية
                    </p>
                </div>
            </div>

            {/* Tree Component */}
            <ExpenseTree
                data={treeData}
                isLoading={isLoading}
                onAddCategory={handleAddCategory}
                onEditCategory={handleEditCategory}
                onDeleteCategory={handleDeleteCategory}
                onViewLedger={handleViewLedger}
                onCreateVoucher={handleCreateVoucher}
                onRefresh={handleRefresh}
                onExport={handleExport}
            />

            {/* Add/Edit Dialog */}
            <ExpenseNodeDialog
                isOpen={showDialog}
                onClose={() => setShowDialog(false)}
                onSubmit={handleSubmitCategory}
                parentCategory={selectedParent}
                editCategory={editingCategory}
                costCenters={costCenters}
                suppliers={suppliers}
                existingAccounts={existingAccounts}
            />
        </div>
    );
}
