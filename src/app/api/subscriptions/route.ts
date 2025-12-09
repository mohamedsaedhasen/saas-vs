import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: Get current company subscription
export async function GET(request: NextRequest) {
    try {
        const { supabase, companyId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const { data: subscription, error } = await supabase
            .from('company_subscriptions')
            .select(`
                *,
                plan:subscription_plans(*)
            `)
            .eq('company_id', companyId)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching subscription:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Get usage stats
        const currentMonth = new Date();
        const periodStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
            .toISOString().split('T')[0];

        const { data: usage } = await supabase
            .from('usage_tracking')
            .select('*')
            .eq('company_id', companyId)
            .eq('period_start', periodStart);

        // Get actual counts
        const [invoiceCount, userCount, productCount, branchCount] = await Promise.all([
            supabase.from('sales_invoices').select('id', { count: 'exact', head: true }),
            supabase.from('app_user_companies').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
            supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
            supabase.from('branches').select('id', { count: 'exact', head: true }).eq('is_active', true),
        ]);

        return NextResponse.json({
            subscription: subscription || null,
            usage: {
                invoices: {
                    used: usage?.find(u => u.metric_type === 'invoices')?.usage_count || 0,
                    limit: subscription?.plan?.max_invoices_monthly || 0,
                },
                users: {
                    used: userCount.count || 0,
                    limit: subscription?.plan?.max_users || 0,
                },
                products: {
                    used: productCount.count || 0,
                    limit: subscription?.plan?.max_products || 0,
                },
                branches: {
                    used: branchCount.count || 0,
                    limit: subscription?.plan?.max_branches || 0,
                },
            },
        });
    } catch (error) {
        console.error('Subscription error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// POST: Subscribe to a plan
export async function POST(request: NextRequest) {
    try {
        const { supabase, companyId, userId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const body = await request.json();
        const { plan_id, billing_cycle } = body;

        if (!plan_id) {
            return NextResponse.json({ error: 'الخطة مطلوبة' }, { status: 400 });
        }

        // Get plan details
        const { data: plan, error: planError } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('id', plan_id)
            .single();

        if (planError || !plan) {
            return NextResponse.json({ error: 'الخطة غير موجودة' }, { status: 404 });
        }

        const now = new Date();
        const periodEnd = new Date();
        if (billing_cycle === 'yearly') {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        // Create or update subscription
        const { data: subscription, error } = await supabase
            .from('company_subscriptions')
            .upsert({
                company_id: companyId,
                plan_id,
                status: 'active',
                billing_cycle: billing_cycle || 'monthly',
                current_period_start: now.toISOString(),
                current_period_end: periodEnd.toISOString(),
                updated_at: now.toISOString(),
            }, {
                onConflict: 'company_id',
            })
            .select(`
                *,
                plan:subscription_plans(*)
            `)
            .single();

        if (error) {
            console.error('Error creating subscription:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Update company subscription plan
        await supabase
            .from('companies')
            .update({
                subscription_plan: plan.code,
                subscription_ends_at: periodEnd.toISOString(),
            })
            .eq('id', companyId);

        return NextResponse.json({
            subscription,
            message: 'تم الاشتراك بنجاح'
        }, { status: 201 });
    } catch (error) {
        console.error('Subscribe error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// DELETE: Cancel subscription
export async function DELETE(request: NextRequest) {
    try {
        const { supabase, companyId, userId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const body = await request.json();
        const { cancel_reason } = body;

        const { data: subscription, error } = await supabase
            .from('company_subscriptions')
            .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString(),
                cancel_reason,
                updated_at: new Date().toISOString(),
            })
            .eq('company_id', companyId)
            .select()
            .single();

        if (error) {
            console.error('Error cancelling subscription:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({
            subscription,
            message: 'تم إلغاء الاشتراك'
        });
    } catch (error) {
        console.error('Cancel subscription error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
