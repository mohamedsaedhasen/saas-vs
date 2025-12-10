import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import { initializeCompanyDefaults } from '@/lib/company-initializer';

// GET: Fetch companies for the logged-in user
export async function GET(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        // Get user_id from cookie (custom auth)
        const cookieStore = await cookies();
        const userId = cookieStore.get('user_id')?.value;

        // If no user logged in, return empty array (for public access)
        if (!userId) {
            // Return all companies for now (development mode)
            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('GET /api/companies error:', error);
                return NextResponse.json({ error: error.message }, { status: 400 });
            }

            return NextResponse.json(data || []);
        }

        // Get companies linked to this user
        const { data: userCompanies } = await supabase
            .from('app_user_companies')
            .select('company_id')
            .eq('user_id', userId);

        if (userCompanies && userCompanies.length > 0) {
            const companyIds = userCompanies.map(uc => uc.company_id);
            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .in('id', companyIds)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('GET /api/companies error:', error);
                return NextResponse.json({ error: error.message }, { status: 400 });
            }

            return NextResponse.json(data || []);
        }

        // No companies linked, return empty
        return NextResponse.json([]);
    } catch (error) {
        console.error('GET /api/companies exception:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Create new company
export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const body = await request.json();

        // Get user_id from cookie
        const cookieStore = await cookies();
        const userId = cookieStore.get('user_id')?.value;

        console.log('POST /api/companies - Creating company:', body.name, 'for user:', userId);

        // Validate required fields
        if (!body.name) {
            return NextResponse.json({ error: 'اسم الشركة مطلوب' }, { status: 400 });
        }

        // Prepare settings with currency
        const settings = {
            currency: body.currency || 'EGP',
            currency_symbol: getCurrencySymbol(body.currency || 'EGP'),
            vat_enabled: body.vat_enabled || false,
            vat_rate: body.vat_rate || 14,
            invoice_prefix: body.invoice_prefix || 'INV',
            invoice_start_number: body.invoice_start_number || 1,
            language: body.language || 'ar',
            timezone: body.timezone || 'Africa/Cairo',
        };

        const insertData = {
            name: body.name,
            name_en: body.name_en || null,
            legal_name: body.legal_name || null,
            tax_number: body.tax_number || null,
            commercial_register: body.commercial_register || null,
            address: body.address || null,
            city: body.city || null,
            country: body.country || 'مصر',
            phone: body.phone || null,
            email: body.email || null,
            website: body.website || null,
            logo_url: body.logo_url || null,
            settings: settings,
            is_default: false,
            is_active: true,
        };

        // Create the company
        const { data, error } = await supabase
            .from('companies')
            .insert(insertData)
            .select()
            .single();

        if (error) {
            console.error('POST /api/companies - Supabase error:', error);
            return NextResponse.json({
                error: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            }, { status: 400 });
        }

        // Link company to user if user is logged in
        if (userId && data) {
            await supabase
                .from('app_user_companies')
                .insert({
                    user_id: userId,
                    company_id: data.id,
                    role: 'admin',
                    is_primary: true,
                });
        }

        // Initialize default accounting entities
        if (data) {
            const initResult = await initializeCompanyDefaults(supabase, data.id);
            if (!initResult.success) {
                console.warn('Warning: Failed to initialize company defaults:', initResult.error);
            }
        }

        console.log('Company created successfully:', data.id);

        return NextResponse.json(data);
    } catch (error) {
        console.error('POST /api/companies exception:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// Helper function to get currency symbol
function getCurrencySymbol(currency: string): string {
    const symbols: Record<string, string> = {
        'EGP': 'ج.م',
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'SAR': 'ر.س',
        'AED': 'د.إ',
        'KWD': 'د.ك',
        'QAR': 'ر.ق',
        'BHD': 'د.ب',
        'OMR': 'ر.ع',
        'JOD': 'د.أ',
        'LBP': 'ل.ل',
        'SDG': 'ج.س',
        'LYD': 'د.ل',
        'MAD': 'د.م',
        'TND': 'د.ت',
        'DZD': 'د.ج',
        'IQD': 'د.ع',
        'YER': 'ر.ي',
        'SYP': 'ل.س',
    };
    return symbols[currency] || currency;
}
