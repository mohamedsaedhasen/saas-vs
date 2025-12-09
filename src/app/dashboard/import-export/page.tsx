'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

type DataType = 'customers' | 'suppliers' | 'products' | 'accounts';

interface ImportResult {
    total: number;
    success: number;
    failed: number;
    errors: string[];
}

export default function ImportExportPage() {
    const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
    const [selectedType, setSelectedType] = useState<DataType>('customers');
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const dataTypes = [
        { id: 'customers', name: 'العملاء', icon: '👥', color: 'blue' },
        { id: 'suppliers', name: 'الموردين', icon: '🏭', color: 'purple' },
        { id: 'products', name: 'المنتجات', icon: '📦', color: 'green' },
        { id: 'accounts', name: 'شجرة الحسابات', icon: '📊', color: 'orange' },
    ];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setImportResult(null);
        }
    };

    const handleImport = async () => {
        if (!file) return;
        setImporting(true);
        // Simulate import
        setTimeout(() => {
            setImportResult({
                total: 50,
                success: 47,
                failed: 3,
                errors: [
                    'صف 12: البريد الإلكتروني غير صالح',
                    'صف 25: رقم الهاتف مكرر',
                    'صف 38: الاسم مطلوب',
                ],
            });
            setImporting(false);
        }, 2000);
    };

    const handleExport = async () => {
        setExporting(true);
        // Simulate export
        setTimeout(() => {
            // Create a dummy CSV content
            const csvContent = 'الاسم,البريد الإلكتروني,الهاتف\nشركة النور,info@noor.com,01012345678';
            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedType}_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            setExporting(false);
        }, 1000);
    };

    const handleDownloadTemplate = () => {
        const templates: Record<DataType, string> = {
            customers: 'الاسم,البريد الإلكتروني,الهاتف,العنوان,الرقم الضريبي,حد الائتمان',
            suppliers: 'الاسم,البريد الإلكتروني,الهاتف,العنوان,الرقم الضريبي,السجل التجاري',
            products: 'الكود,الاسم,الفئة,سعر البيع,سعر التكلفة,الكمية,الوحدة',
            accounts: 'الكود,الاسم,النوع,الحساب الأب',
        };
        const blob = new Blob(['\ufeff' + templates[selectedType]], { type: 'text/csv;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `template_${selectedType}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <Link href="/dashboard" className="hover:text-indigo-600">لوحة التحكم</Link>
                    <span>/</span>
                    <span className="text-gray-900">استيراد وتصدير البيانات</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">استيراد وتصدير البيانات</h1>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm">
                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab('import')}
                        className={`flex-1 py-4 text-center font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'import' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        استيراد
                    </button>
                    <button
                        onClick={() => setActiveTab('export')}
                        className={`flex-1 py-4 text-center font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'export' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        تصدير
                    </button>
                </div>

                <div className="p-6">
                    {/* Data Type Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">اختر نوع البيانات</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {dataTypes.map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => setSelectedType(type.id as DataType)}
                                    className={`p-4 rounded-xl border-2 transition-all ${selectedType === type.id
                                            ? 'border-indigo-500 bg-indigo-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="text-2xl mb-2">{type.icon}</div>
                                    <div className={`font-medium ${selectedType === type.id ? 'text-indigo-600' : 'text-gray-700'}`}>
                                        {type.name}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {activeTab === 'import' ? (
                        <div className="space-y-6">
                            {/* Download Template */}
                            <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="font-medium text-blue-900">تحميل القالب</div>
                                        <div className="text-sm text-blue-700">قم بتحميل القالب وملئه بالبيانات</div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleDownloadTemplate}
                                    className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                                >
                                    تحميل القالب
                                </button>
                            </div>

                            {/* File Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">رفع ملف البيانات</label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-indigo-300 hover:bg-indigo-50'
                                        }`}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".csv,.xlsx,.xls"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    {file ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <div>
                                                <div className="font-medium text-green-700">{file.name}</div>
                                                <div className="text-sm text-green-600">{(file.size / 1024).toFixed(2)} KB</div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFile(null);
                                                    setImportResult(null);
                                                }}
                                                className="p-1 rounded-full hover:bg-green-200"
                                            >
                                                <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            <div className="text-gray-600 mb-2">اسحب الملف هنا أو اضغط للاختيار</div>
                                            <div className="text-sm text-gray-500">CSV, Excel (.xlsx, .xls)</div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Import Button */}
                            <button
                                onClick={handleImport}
                                disabled={!file || importing}
                                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {importing ? (
                                    <>
                                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        جاري الاستيراد...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                        بدء الاستيراد
                                    </>
                                )}
                            </button>

                            {/* Import Result */}
                            {importResult && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-gray-50 rounded-xl p-4 text-center">
                                            <div className="text-2xl font-bold text-gray-900">{importResult.total}</div>
                                            <div className="text-sm text-gray-500">إجمالي السجلات</div>
                                        </div>
                                        <div className="bg-green-50 rounded-xl p-4 text-center">
                                            <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                                            <div className="text-sm text-green-700">نجحت</div>
                                        </div>
                                        <div className="bg-red-50 rounded-xl p-4 text-center">
                                            <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                                            <div className="text-sm text-red-700">فشلت</div>
                                        </div>
                                    </div>

                                    {importResult.errors.length > 0 && (
                                        <div className="bg-red-50 rounded-xl p-4">
                                            <div className="font-medium text-red-900 mb-2">الأخطاء:</div>
                                            <ul className="space-y-1 text-sm text-red-700">
                                                {importResult.errors.map((error, index) => (
                                                    <li key={index}>• {error}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Export Options */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="border border-gray-200 rounded-xl p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">Excel / CSV</div>
                                            <div className="text-sm text-gray-500">تصدير البيانات بصيغة جدول</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleExport}
                                        disabled={exporting}
                                        className="w-full py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {exporting ? 'جاري التصدير...' : 'تصدير Excel'}
                                    </button>
                                </div>

                                <div className="border border-gray-200 rounded-xl p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">PDF</div>
                                            <div className="text-sm text-gray-500">تصدير البيانات كتقرير</div>
                                        </div>
                                    </div>
                                    <button className="w-full py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors">
                                        تصدير PDF
                                    </button>
                                </div>
                            </div>

                            {/* Export Info */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="font-medium text-gray-900 mb-2">معلومات التصدير</div>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <p>• سيتم تصدير جميع بيانات {dataTypes.find(t => t.id === selectedType)?.name}</p>
                                    <p>• يمكنك استيراد الملف المصدر لاحقاً لتحديث البيانات</p>
                                    <p>• الملف سيحتوي على جميع الحقول المتاحة</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
