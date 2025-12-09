'use client';

import { useState, useRef, useEffect } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { Building2, ChevronDown, Check, MapPin } from 'lucide-react';

export function BranchSelector() {
    const { branch, branches, setBranch, isLoading } = useCompany();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
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
            <div className="px-3 py-2">
                <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
            </div>
        );
    }

    if (branches.length <= 1) {
        // Single branch - show but don't allow change
        return (
            <div className="px-3 py-2">
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">الفرع</p>
                        <p className="text-sm font-medium truncate">
                            {branch?.name_ar || branch?.name || 'الفرع الرئيسي'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="px-3 py-2 relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0 text-right">
                    <p className="text-xs text-gray-500">الفرع</p>
                    <p className="text-sm font-medium truncate">
                        {branch?.name_ar || branch?.name || 'اختر الفرع'}
                    </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute left-3 right-3 top-full mt-1 bg-white rounded-lg shadow-lg border z-50 max-h-64 overflow-y-auto">
                    {branches.map((b) => (
                        <button
                            key={b.id}
                            onClick={() => {
                                setBranch(b);
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors ${branch?.id === b.id ? 'bg-green-50' : ''
                                }`}
                        >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${b.is_headquarters ? 'bg-blue-100' : 'bg-gray-100'
                                }`}>
                                {b.is_headquarters ? (
                                    <Building2 className="w-3 h-3 text-blue-600" />
                                ) : (
                                    <MapPin className="w-3 h-3 text-gray-600" />
                                )}
                            </div>
                            <div className="flex-1 text-right">
                                <p className="text-sm font-medium">{b.name_ar || b.name}</p>
                                {b.is_headquarters && (
                                    <p className="text-xs text-blue-600">الفرع الرئيسي</p>
                                )}
                            </div>
                            {branch?.id === b.id && (
                                <Check className="w-4 h-4 text-green-600" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
