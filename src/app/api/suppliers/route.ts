import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: Get all suppliers for the current company
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
            .from('suppliers')
            .select('*', { count: 'exact' })
            .eq('is_active', true)
            .order('name', { ascending: true })
            .range(offset, offset + limit - 1);

        if (search) {
            query = query.or(`name.ilike.%${search}%,name_ar.ilike.%${search}%,phone.ilike.%${search}%,code.ilike.%${search}%`);
        }

        const { data: suppliers, error, count } = await query;

        if (error) {
            console.error('Error fetching suppliers:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Get stats
        const { data: stats } = await supabase
            .from('suppliers')
            .select('balance')
            .eq('is_active', true);

        return NextResponse.json({
            suppliers: suppliers || [],
            stats: {
                total: stats?.length || 0,
                totalBalance: stats?.reduce((sum, s) => sum + (s.balance || 0), 0) || 0,
            },
            pagination: {
                page,
                limit,
                total: count || 0,
                pages: Math.ceil((count || 0) / limit),
            }
        });
    } catch (error) {
        console.error('Get suppliers error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// POST: Create a new supplier
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
            notes,
        } = body;

        if (!name) {
            return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 });
        }

        // Generate code if not provided
        let supplierCode = code;
        if (!supplierCode) {
            const { data: lastSupplier } = await supabase
                .from('suppliers')
                .select('code')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (lastSupplier?.code) {
                const num = parseInt(lastSupplier.code.replace(/\D/g, '')) + 1;
                supplierCode = `SUP-${String(num).padStart(4, '0')}`;
            } else {
                supplierCode = 'SUP-0001';
            }
        }

        const { data: supplier, error } = await supabase
            .from('suppliers')
            .insert({
                company_id: companyId,
                branch_id: branchId || null,
                code: supplierCode,
                name,
                name_ar,
                phone,
                phone2,
                email,
                address,
                city,
                tax_number,
                balance: 0,
                notes,
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating supplier:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(supplier, { status: 201 });
    } catch (error) {
        console.error('Create supplier error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
