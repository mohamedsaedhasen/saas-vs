import { createSupabaseServerClientWithContext } from './supabase-server';

interface UsageLimitResult {
    allowed: boolean;
    current: number;
    limit: number;
    message?: string;
}

export async function checkUsageLimit(
    metricType: 'invoices' | 'users' | 'products' | 'branches',
    increment: number = 1
): Promise<UsageLimitResult> {
    try {
        const { supabase, companyId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return { allowed: true, current: 0, limit: -1 };
        }

        // Get company subscription
        const { data: subscription } = await supabase
            .from('company_subscriptions')
            .select(`
                status,
                plan:subscription_plans(
                    max_users,
                    max_branches,
                    max_invoices_monthly,
                    max_products
                )
            `)
            .eq('company_id', companyId)
            .eq('status', 'active')
            .single();

        if (!subscription || !subscription.plan) {
            // No active subscription = trial limits
            return checkTrialLimits(metricType, increment, companyId, supabase);
        }

        const plan = subscription.plan as unknown as {
            max_users: number;
            max_branches: number;
            max_invoices_monthly: number;
            max_products: number;
        };

        // Get limit based on metric type
        let limit: number;
        switch (metricType) {
            case 'users':
                limit = plan.max_users;
                break;
            case 'branches':
                limit = plan.max_branches;
                break;
            case 'invoices':
                limit = plan.max_invoices_monthly;
                break;
            case 'products':
                limit = plan.max_products;
                break;
            default:
                limit = -1;
        }

        // -1 means unlimited
        if (limit === -1) {
            return { allowed: true, current: 0, limit: -1 };
        }

        // Get current usage
        const current = await getCurrentUsage(metricType, companyId, supabase);

        const allowed = (current + increment) <= limit;

        return {
            allowed,
            current,
            limit,
            message: allowed ? undefined : getErrorMessage(metricType, current, limit),
        };
    } catch (error) {
        console.error('Usage limit check error:', error);
        // Allow on error to not block operations
        return { allowed: true, current: 0, limit: -1 };
    }
}

async function checkTrialLimits(
    metricType: string,
    increment: number,
    companyId: string,
    supabase: any
): Promise<UsageLimitResult> {
    // Trial limits
    const trialLimits: Record<string, number> = {
        invoices: 50,
        users: 1,
        products: 50,
        branches: 1,
    };

    const limit = trialLimits[metricType] || 10;
    const current = await getCurrentUsage(metricType as 'invoices' | 'users' | 'products' | 'branches', companyId, supabase);
    const allowed = (current + increment) <= limit;

    return {
        allowed,
        current,
        limit,
        message: allowed ? undefined : `تجاوزت حد التجربة (${limit}). يرجى الترقية.`,
    };
}

async function getCurrentUsage(
    metricType: 'invoices' | 'users' | 'products' | 'branches',
    companyId: string,
    supabase: any
): Promise<number> {
    let count = 0;

    switch (metricType) {
        case 'invoices':
            // Get current month invoices
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const { count: invoiceCount } = await supabase
                .from('sales_invoices')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', startOfMonth.toISOString());
            count = invoiceCount || 0;
            break;

        case 'users':
            const { count: userCount } = await supabase
                .from('app_user_companies')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', companyId);
            count = userCount || 0;
            break;

        case 'products':
            const { count: productCount } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);
            count = productCount || 0;
            break;

        case 'branches':
            const { count: branchCount } = await supabase
                .from('branches')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);
            count = branchCount || 0;
            break;
    }

    return count;
}

function getErrorMessage(metricType: string, current: number, limit: number): string {
    const typeNames: Record<string, string> = {
        invoices: 'الفواتير الشهرية',
        users: 'المستخدمين',
        products: 'المنتجات',
        branches: 'الفروع',
    };

    const typeName = typeNames[metricType] || metricType;
    return `لقد وصلت للحد الأقصى من ${typeName} (${current}/${limit}). يرجى الترقية لخطة أعلى.`;
}

// Increment usage counter (call after successful creation)
export async function incrementUsage(metricType: string): Promise<void> {
    try {
        const { supabase, companyId } = await createSupabaseServerClientWithContext();

        if (!companyId) return;

        const now = new Date();
        const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        await supabase
            .from('usage_tracking')
            .upsert({
                company_id: companyId,
                metric_type: metricType,
                period_start: periodStart.toISOString().split('T')[0],
                period_end: periodEnd.toISOString().split('T')[0],
                usage_count: 1,
            }, {
                onConflict: 'company_id,metric_type,period_start',
            });

        // Then increment
        await supabase.rpc('increment_usage', {
            p_company_id: companyId,
            p_metric_type: metricType,
            p_increment: 1,
        });
    } catch (error) {
        console.error('Increment usage error:', error);
    }
}
