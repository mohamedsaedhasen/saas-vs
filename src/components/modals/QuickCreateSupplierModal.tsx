'use client';

import { useState } from 'react';
import { X, Building2, Save } from 'lucide-react';

interface QuickCreateSupplierModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (supplier: { id: string; name: string; phone: string }) => void;
    initialName?: string;
}

export default function QuickCreateSupplierModal({
    isOpen,
    onClose,
    onCreate,
    initialName = '',
}: QuickCreateSupplierModalProps) {
    const [name, setName] = useState(initialName);
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [city, setCity] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !phone.trim()) return;

        setIsLoading(true);
        try {
            const response = await fetch('/api/suppliers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone, email, city }),
            });

            if (response.ok) {
                const supplier = await response.json();
                onCreate(supplier);
                onClose();
            }
        } catch (error) {
            console.error('Error creating supplier:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            <div className="relative bg-card rounded-xl border border-border shadow-xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <Building2 size={18} className="text-orange-600" />
                        <h2 className="font-semibold">إنشاء مورد جديد</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-muted rounded">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            الاسم <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                            required
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            الهاتف <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">المدينة</label>
                        <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                        />
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !name.trim() || !phone.trim()}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                        >
                            <Save size={16} />
                            {isLoading ? 'جاري الحفظ...' : 'حفظ'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
