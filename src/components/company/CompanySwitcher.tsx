'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ChevronDown, Check, Plus, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCompany } from '@/contexts/CompanyContext';

export default function CompanySwitcher() {
    const router = useRouter();
    const { company, companies, setCompany, isLoading } = useCompany();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-lg" />
                <div className="w-24 h-4 bg-muted rounded" />
            </div>
        );
    }

    if (!company) {
        return (
            <button
                onClick={() => router.push('/setup/company')}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
                <Plus size={18} />
                إنشاء شركة
            </button>
        );
    }

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-lg transition-colors"
            >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold">
                    {company.name.charAt(0)}
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium line-clamp-1">{company.name}</p>
                    <p className="text-xs text-muted-foreground">
                        {company.settings?.currency || 'EGP'}
                    </p>
                </div>
                <ChevronDown size={16} className={cn(
                    "text-muted-foreground transition-transform",
                    isOpen && "rotate-180"
                )} />
            </button>

            {isOpen && (
                <div className="absolute left-0 top-full mt-2 w-72 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 border-b border-border bg-muted/30">
                        <p className="text-xs font-medium text-muted-foreground px-2">الشركات</p>
                    </div>

                    <div className="max-h-64 overflow-y-auto p-1">
                        {companies.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => {
                                    setCompany(c);
                                    setIsOpen(false);
                                    // Reload to apply new company
                                    window.location.reload();
                                }}
                                className={cn(
                                    "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-right",
                                    c.id === company.id
                                        ? "bg-primary/10 text-primary"
                                        : "hover:bg-muted"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center font-bold",
                                    c.id === company.id
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground"
                                )}>
                                    {c.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm line-clamp-1">{c.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {c.settings?.currency || 'EGP'}
                                    </p>
                                </div>
                                {c.id === company.id && (
                                    <Check size={18} className="text-primary flex-shrink-0" />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="p-2 border-t border-border space-y-1">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                router.push('/setup/company');
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-lg transition-colors"
                        >
                            <Plus size={16} />
                            إضافة شركة جديدة
                        </button>
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                router.push('/dashboard/settings/company');
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-lg transition-colors"
                        >
                            <Settings size={16} />
                            إعدادات الشركة
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
