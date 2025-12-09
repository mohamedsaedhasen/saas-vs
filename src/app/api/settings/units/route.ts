import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: List units of measure
export async function GET(request: NextRequest) {
    try {
        const { supabase, companyId } = await createSupabaseServerClientWithContext();

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get('active') !== 'false';

        let query = supabase
            .from('units_of_measure')
            .select(`
                *,
                base_unit:units_of_measure!base_unit_id(id, code, name, name_ar)
            `)
            .order('is_base_unit', { ascending: false })
            .order('name');

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        const { data: units, error } = await query;

        if (error) {
            console.error('Error fetching units:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ units });
    } catch (error) {
        console.error('Units error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}

// POST: Create new unit
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
            is_base_unit,
            base_unit_id,
            conversion_factor,
        } = body;

        if (!code || !name) {
            return NextResponse.json({ error: 'الكود والاسم مطلوبان' }, { status: 400 });
        }

        const { data: unit, error } = await supabase
            .from('units_of_measure')
            .insert({
                company_id: companyId,
                code,
                name,
                name_ar,
                is_base_unit: is_base_unit || false,
                base_unit_id,
                conversion_factor: conversion_factor || 1,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating unit:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(unit, { status: 201 });
    } catch (error) {
        console.error('Create unit error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
