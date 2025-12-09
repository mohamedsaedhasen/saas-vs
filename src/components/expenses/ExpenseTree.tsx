'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
    ChevronDown,
    ChevronLeft,
    Plus,
    Edit,
    Trash2,
    FileText,
    FolderOpen,
    Folder,
    User,
    MoreVertical,
    Search,
    Download,
    RefreshCw,
    ChevronsDownUp,
    ChevronsUpDown,
} from 'lucide-react';
import type { ExpenseTreeNode } from '@/types/expenses';

interface ExpenseTreeProps {
    data: ExpenseTreeNode[];
    isLoading?: boolean;
    onAddCategory?: (parentId: string | null) => void;
    onEditCategory?: (category: ExpenseTreeNode) => void;
    onDeleteCategory?: (category: ExpenseTreeNode) => void;
    onViewLedger?: (category: ExpenseTreeNode) => void;
    onCreateVoucher?: (category: ExpenseTreeNode) => void;
    onRefresh?: () => void;
    onExport?: () => void;
}

export function ExpenseTree({
    data,
    isLoading = false,
    onAddCategory,
    onEditCategory,
    onDeleteCategory,
    onViewLedger,
    onCreateVoucher,
    onRefresh,
    onExport,
}: ExpenseTreeProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [selectedNode, setSelectedNode] = useState<string | null>(null);

    // Filter nodes based on search
    const filteredData = useMemo(() => {
        if (!searchTerm) return data;

        const filterNodes = (nodes: ExpenseTreeNode[]): ExpenseTreeNode[] => {
            return nodes.reduce<ExpenseTreeNode[]>((acc, node) => {
                const matchesSearch =
                    node.name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    node.code.toLowerCase().includes(searchTerm.toLowerCase());

                const filteredChildren = filterNodes(node.children);

                if (matchesSearch || filteredChildren.length > 0) {
                    acc.push({
                        ...node,
                        children: filteredChildren,
                    });
                }

                return acc;
            }, []);
        };

        return filterNodes(data);
    }, [data, searchTerm]);

    // Toggle node expansion
    const toggleNode = useCallback((nodeId: string) => {
        setExpandedNodes((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(nodeId)) {
                newSet.delete(nodeId);
            } else {
                newSet.add(nodeId);
            }
            return newSet;
        });
    }, []);

    // Expand all nodes
    const expandAll = useCallback(() => {
        const getAllIds = (nodes: ExpenseTreeNode[]): string[] => {
            return nodes.flatMap((node) => [node.id, ...getAllIds(node.children)]);
        };
        setExpandedNodes(new Set(getAllIds(data)));
    }, [data]);

    // Collapse all nodes
    const collapseAll = useCallback(() => {
        setExpandedNodes(new Set());
    }, []);

    // Calculate total for root
    const totalAmount = useMemo(() => {
        return data.reduce((sum, node) => sum + (node.total_spent || 0), 0);
    }, [data]);

    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border bg-muted/30">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <h2 className="text-lg font-semibold">شجرة المصاريف التفصيلية</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onRefresh}
                            className="p-2 hover:bg-accent rounded-lg text-muted-foreground transition-colors"
                            title="تحديث"
                        >
                            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                        <button
                            onClick={onExport}
                            className="p-2 hover:bg-accent rounded-lg text-muted-foreground transition-colors"
                            title="تصدير Excel"
                        >
                            <Download size={18} />
                        </button>
                        <button
                            onClick={() => onAddCategory?.(null)}
                            className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                        >
                            <Plus size={16} />
                            إضافة بند
                        </button>
                    </div>
                </div>

                {/* Search and controls */}
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <div className="relative flex-1">
                        <Search
                            size={18}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        />
                        <input
                            type="text"
                            placeholder="بحث في الشجرة..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pr-10 pl-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={expandAll}
                            className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:bg-accent rounded-lg transition-colors"
                        >
                            <ChevronsUpDown size={16} />
                            توسيع الكل
                        </button>
                        <button
                            onClick={collapseAll}
                            className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:bg-accent rounded-lg transition-colors"
                        >
                            <ChevronsDownUp size={16} />
                            طي الكل
                        </button>
                    </div>
                </div>
            </div>

            {/* Tree content */}
            <div className="p-4 max-h-[600px] overflow-y-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw size={24} className="animate-spin text-primary" />
                        <span className="mr-2 text-muted-foreground">جاري التحميل...</span>
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد تصنيفات بعد'}
                    </div>
                ) : (
                    <div className="space-y-1">
                        {/* Root summary */}
                        <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <FolderOpen size={20} className="text-primary" />
                                </div>
                                <div>
                                    <div className="font-semibold">المصاريف</div>
                                    <div className="text-sm text-muted-foreground">
                                        {data.length} تصنيف رئيسي
                                    </div>
                                </div>
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-lg">
                                    {totalAmount.toLocaleString('ar-EG')} ج.م
                                </div>
                                <div className="text-xs text-muted-foreground">الإجمالي</div>
                            </div>
                        </div>

                        {/* Tree nodes */}
                        {filteredData.map((node) => (
                            <ExpenseTreeNodeComponent
                                key={node.id}
                                node={node}
                                level={0}
                                expandedNodes={expandedNodes}
                                selectedNode={selectedNode}
                                onToggle={toggleNode}
                                onSelect={setSelectedNode}
                                onAddCategory={onAddCategory}
                                onEditCategory={onEditCategory}
                                onDeleteCategory={onDeleteCategory}
                                onViewLedger={onViewLedger}
                                onCreateVoucher={onCreateVoucher}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ==========================================
// Tree Node Component
// ==========================================

interface ExpenseTreeNodeProps {
    node: ExpenseTreeNode;
    level: number;
    expandedNodes: Set<string>;
    selectedNode: string | null;
    onToggle: (id: string) => void;
    onSelect: (id: string | null) => void;
    onAddCategory?: (parentId: string | null) => void;
    onEditCategory?: (category: ExpenseTreeNode) => void;
    onDeleteCategory?: (category: ExpenseTreeNode) => void;
    onViewLedger?: (category: ExpenseTreeNode) => void;
    onCreateVoucher?: (category: ExpenseTreeNode) => void;
}

function ExpenseTreeNodeComponent({
    node,
    level,
    expandedNodes,
    selectedNode,
    onToggle,
    onSelect,
    onAddCategory,
    onEditCategory,
    onDeleteCategory,
    onViewLedger,
    onCreateVoucher,
}: ExpenseTreeNodeProps) {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNode === node.id;
    const hasChildren = node.children.length > 0;

    // Determine icon
    const getIcon = () => {
        if (node.expense_type === 'employee_related') {
            return <User size={18} className="text-blue-500" />;
        }
        if (hasChildren) {
            return isExpanded ? (
                <FolderOpen size={18} className="text-amber-500" />
            ) : (
                <Folder size={18} className="text-amber-500" />
            );
        }
        return <FileText size={18} className="text-emerald-500" />;
    };

    // Progress bar for budget
    const budgetPercentage = node.budget_used_percentage || 0;
    const budgetColor =
        budgetPercentage > 100
            ? 'bg-red-500'
            : budgetPercentage > 80
                ? 'bg-amber-500'
                : 'bg-emerald-500';

    // Can delete?
    const canDelete = !hasChildren && (node.voucher_count || 0) === 0;

    return (
        <div>
            <div
                className={cn(
                    'group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors',
                    isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
                )}
                style={{ paddingRight: `${level * 24 + 12}px` }}
                onClick={() => onSelect(isSelected ? null : node.id)}
            >
                {/* Expand/Collapse button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (hasChildren) onToggle(node.id);
                    }}
                    className={cn(
                        'w-6 h-6 flex items-center justify-center rounded transition-colors',
                        hasChildren
                            ? 'hover:bg-muted text-muted-foreground'
                            : 'invisible'
                    )}
                >
                    {hasChildren && (
                        <ChevronLeft
                            size={16}
                            className={cn(
                                'transition-transform',
                                isExpanded && '-rotate-90'
                            )}
                        />
                    )}
                </button>

                {/* Icon */}
                <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                    {getIcon()}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                            {node.code}
                        </span>
                        <span className="font-medium truncate">{node.name_ar}</span>
                        {node.is_recurring && (
                            <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                                متكرر
                            </span>
                        )}
                    </div>
                    {node.previous_voucher && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                            آخر سند: {node.previous_voucher.number} ({node.previous_voucher.amount.toLocaleString('ar-EG')} ج.م)
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4">
                    {/* Amount */}
                    <div className="text-left min-w-[100px]">
                        <div className="font-semibold text-sm">
                            {(node.total_spent || 0).toLocaleString('ar-EG')} ج.م
                        </div>
                        {node.voucher_count !== undefined && node.voucher_count > 0 && (
                            <div className="text-xs text-muted-foreground">
                                {node.voucher_count} سند
                            </div>
                        )}
                    </div>

                    {/* Budget progress */}
                    {node.budget_amount && (
                        <div className="w-24">
                            <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-muted-foreground">الموازنة</span>
                                <span
                                    className={cn(
                                        budgetPercentage > 100 ? 'text-red-500' : ''
                                    )}
                                >
                                    {budgetPercentage}%
                                </span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                    className={cn('h-full rounded-full transition-all', budgetColor)}
                                    style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewLedger?.(node);
                        }}
                        className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground"
                        title="كشف الحساب"
                    >
                        <FileText size={16} />
                    </button>

                    {!hasChildren && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onCreateVoucher?.(node);
                            }}
                            className="p-1.5 hover:bg-emerald-100 rounded-lg text-emerald-600"
                            title="سند صرف جديد"
                        >
                            <Plus size={16} />
                        </button>
                    )}

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddCategory?.(node.id);
                        }}
                        className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600"
                        title="إضافة فرع"
                    >
                        <FolderOpen size={16} />
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEditCategory?.(node);
                        }}
                        className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground"
                        title="تعديل"
                    >
                        <Edit size={16} />
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (canDelete) {
                                onDeleteCategory?.(node);
                            }
                        }}
                        className={cn(
                            'p-1.5 rounded-lg',
                            canDelete
                                ? 'hover:bg-red-100 text-red-600'
                                : 'text-muted-foreground/30 cursor-not-allowed'
                        )}
                        title={canDelete ? 'حذف' : 'لا يمكن الحذف - توجد معاملات أو فروع'}
                        disabled={!canDelete}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Children */}
            {hasChildren && isExpanded && (
                <div className="relative">
                    {/* Connecting line */}
                    <div
                        className="absolute top-0 bottom-4 border-r border-dashed border-border"
                        style={{ right: `${level * 24 + 30}px` }}
                    />
                    {node.children.map((child) => (
                        <ExpenseTreeNodeComponent
                            key={child.id}
                            node={child}
                            level={level + 1}
                            expandedNodes={expandedNodes}
                            selectedNode={selectedNode}
                            onToggle={onToggle}
                            onSelect={onSelect}
                            onAddCategory={onAddCategory}
                            onEditCategory={onEditCategory}
                            onDeleteCategory={onDeleteCategory}
                            onViewLedger={onViewLedger}
                            onCreateVoucher={onCreateVoucher}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
