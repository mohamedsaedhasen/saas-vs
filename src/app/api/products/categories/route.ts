import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: List product categories
export async function GET(request: NextRequest) {
    try {
        const { supabase, companyId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const parentId = searchParams.get('parent_id');
        const activeOnly = searchParams.get('active') !== 'false';

        let query = supabase
            .from('product_categories')
            .select('*')
            .order('sort_order')
            .order('name');

        if (parentId) {
            query = query.eq('parent_id', parentId);
        }

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        const { data: categories, error } = await query;

        if (error) {
            console.error('Error fetching categories:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Build tree structure
        interface CategoryWithChildren {
            id: string;
            parent_id: string | null;
            name: string;
            name_ar: string;
            children?: CategoryWithChildren[];
        }

        const buildTree = (items: CategoryWithChildren[], parentId: string | null = null): CategoryWithChildren[] => {
            return items
                .filter(item => item.parent_id === parentId)
                .map(item => ({
                    ...item,
                    children: buildTree(items, item.id),
                }));
        };

        const tree = buildTree(categories || []);

        return NextResponse.json({
            categories,
            tree,
        });
    } catch (error) {
        console.error('Categories error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// POST: Create new category
export async function POST(request: NextRequest) {
    try {
        const { supabase, companyId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const body = await request.json();
        const {
            code,
            name,
            name_ar,
            parent_id,
            description,
            image_url,
            sort_order,
        } = body;

        if (!name) {
            return NextResponse.json({ error: 'الاسم مطلوب' }, { status: 400 });
        }

        const { data: category, error } = await supabase
            .from('product_categories')
            .insert({
                company_id: companyId,
                code,
                name,
                name_ar,
                parent_id,
                description,
                image_url,
                sort_order: sort_order || 0,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating category:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        console.error('Create category error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
