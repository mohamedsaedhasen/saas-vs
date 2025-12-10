# دليل تثبيت قاعدة البيانات V3

## نظرة عامة

هذا الإصدار الثالث من قاعدة البيانات مع هيكل منظم وجودة عالية.

## الملفات

| # | الملف | الوصف |
|---|-------|------|
| 1 | `00_reset.sql` | حذف كل الجداول والدوال (⚠️ يحذف البيانات) |
| 2 | `01_extensions.sql` | الإضافات ودوال tenant_context |
| 3 | `02_core.sql` | الشركات، الفروع، المستخدمين، الصلاحيات |
| 4 | `03_accounting.sql` | الحسابات، القيود، الخزائن |
| 5 | `04_inventory.sql` | المنتجات، المخازن، الحركات |
| 6 | `05_customers_suppliers.sql` | العملاء والموردين |
| 7 | `06_sales.sql` | المبيعات (عروض، طلبات، فواتير، مرتجعات) |
| 8 | `07_purchases.sql` | المشتريات (طلبات، فواتير، مرتجعات) |
| 9 | `08_payments.sql` | المقبوضات، المدفوعات، المصروفات |
| 10 | `09_saas.sql` | خطط الاشتراك والـ SaaS |
| 11 | `10_rls_policies.sql` | سياسات أمان الصفوف |
| 12 | `11_initial_data.sql` | البيانات الأولية |
| 13 | `12_sample_data.sql` | البيانات التجريبية (اختياري) |

## التثبيت

### الخطوة 1: افتح Supabase SQL Editor

### الخطوة 2: شغّل الملفات بالترتيب

```
⚠️ مهم: شغّل كل ملف على حدة بالترتيب!
```

1. شغّل `00_reset.sql` (إذا كنت تريد البدء من جديد)
2. شغّل `01_extensions.sql`
3. شغّل `02_core.sql`
4. شغّل `03_accounting.sql`
5. ... وهكذا حتى آخر ملف

### الخطوة 3: تحديث Schema Cache

```sql
NOTIFY pgrst, 'reload schema';
```

## التحقق

بعد التثبيت، تحقق من:

```sql
-- عدد الجداول
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';

-- الدوال
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public';

-- اختبار tenant_context
SELECT set_tenant_context(null, null, null);
```

## ملاحظات

- **Super Admin**: admin@system.local / admin123
- **كل شركة جديدة** تحصل تلقائياً على:
  - شجرة حسابات أساسية
  - خزينة رئيسية + بنك
  - عميل نقدي + مورد نقدي
