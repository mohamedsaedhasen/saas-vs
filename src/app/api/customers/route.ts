import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: Get all customers for the current company
export async function GET(request: NextRequest) {
    try {
        const { supabase, companyId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = (page - 1) * limit;

        // RLS automatically filters by company_id
        let query = supabase
            .from('customers')
            .select('*', { count: 'exact' })
            .eq('is_active', true)
            .order('name', { ascending: true })
            .range(offset, offset + limit - 1);

        if (search) {
            query = query.or(`name.ilike.%${search}%,name_ar.ilike.%${search}%,phone.ilike.%${search}%,code.ilike.%${search}%`);
        }

        const { data: customers, error, count } = await query;

        if (error) {
            console.error('Error fetching customers:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Get stats
        const { data: stats } = await supabase
            .from('customers')
            .select('balance')
            .eq('is_active', true);

        return NextResponse.json({
            customers: customers || [],
            stats: {
                total: stats?.length || 0,
                totalBalance: stats?.reduce((sum, c) => sum + (c.balance || 0), 0) || 0,
            },
            pagination: {
                page,
                limit,
                total: count || 0,
                pages: Math.ceil((count || 0) / limit),
            }
        });
    } catch (error) {
        console.error('Get customers error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// POST: Create a new customer
export async function POST(request: NextRequest) {
    try {
        const { supabase, companyId, branchId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const body = await request.json();
        const {
            code,
            name,
            name_ar,
            phone,
            phone2,
            email,
            address,
            city,
            tax_number,
            credit_limit,
            notes,
        } = body;

        if (!name) {
            return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
        }

        // Generate code if not provided
        let customerCode = code;
        if (!customerCode) {
            const { data: lastCustomer } = await supabase
                .from('customers')
                .select('code')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (lastCustomer?.code) {
                const num = parseInt(lastCustomer.code.replace(/\D/g, '')) + 1;
                customerCode = `CUST-${String(num).padStart(4, '0')}`;
            } else {
                customerCode = 'CUST-0001';
            }
        }

        const { data: customer, error } = await supabase
            .from('customers')
            .insert({
                company_id: companyId,
                branch_id: branchId || null,
                code: customerCode,
                name,
                name_ar,
                phone,
                phone2,
                email,
                address,
                city,
                tax_number,
                credit_limit: credit_limit || 0,
                balance: 0,
                notes,
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating customer:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(customer, { status: 201 });
    } catch (error) {
        console.error('Create customer error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
