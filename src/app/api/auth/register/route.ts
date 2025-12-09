import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

// Simple password hash (for development)
function hashPassword(password: string): string {
    return 'hashed_' + password;
}

// Generate a slug from company name
function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[\u0600-\u06FF]/g, '') // Remove Arabic
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        || 'company-' + Date.now();
}

// POST: Register new user with trial
export async function POST(request: NextRequest) {
    try {
        // Use admin client to bypass RLS for registration
        const supabase = createSupabaseAdminClient();
        const body = await request.json();

        const { name, email, phone, password, companyName, industry } = body;

        // Validate required fields
        if (!name || !email || !password || !companyName) {
            return NextResponse.json(
                { error: 'جميع الحقول مطلوبة' },
                { status: 400 }
            );
        }

        // Check if email already exists
        const { data: existingUser } = await supabase
            .from('app_users')
            .select('id')
            .eq('email', email.toLowerCase())
            .single();

        if (existingUser) {
            return NextResponse.json(
                { error: 'البريد الإلكتروني مسجل مسبقاً' },
                { status: 400 }
            );
        }

        // Hash password
        const passwordHash = hashPassword(password);

        // Calculate trial end date (14 days)
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 14);

        // Create user first
        const { data: newUser, error: userError } = await supabase
            .from('app_users')
            .insert({
                name,
                name_ar: name,
                email: email.toLowerCase(),
                phone: phone || null,
                password_hash: passwordHash,
                status: 'active',
                is_active: true,
            })
            .select()
            .single();

        if (userError) {
            console.error('User creation error:', userError);
            return NextResponse.json(
                { error: 'خطأ في إنشاء الحساب', details: userError.message },
                { status: 400 }
            );
        }

        // Create company - compatible with different schemas
        const slug = generateSlug(companyName);
        const companyCode = 'CO-' + Date.now().toString().slice(-6);

        const { data: newCompany, error: companyError } = await supabase
            .from('companies')
            .insert({
                code: companyCode,
                slug: slug,
                name: companyName,
                name_ar: companyName,
                email: email.toLowerCase(),
                phone: phone || null,
                currency: 'EGP',
                timezone: 'Africa/Cairo',
                is_active: true,
                // Optional fields that might not exist
                settings: {
                    currency_symbol: 'ج.م',
                    vat_enabled: false,
                    vat_rate: 14,
                    language: 'ar',
                    industry: industry || 'other',
                },
            })
            .select()
            .single();

        if (companyError) {
            console.error('Company creation error:', companyError);
            // Delete user if company creation failed
            await supabase.from('app_users').delete().eq('id', newUser.id);
            return NextResponse.json(
                { error: 'خطأ في إنشاء الشركة', details: companyError.message },
                { status: 400 }
            );
        }

        // Create default branch
        const { data: defaultBranch, error: branchError } = await supabase
            .from('branches')
            .insert({
                company_id: newCompany.id,
                code: 'HQ',
                name: 'Headquarters',
                name_ar: 'المقر الرئيسي',
                city: 'Cairo',
                is_headquarters: true,
                is_active: true,
            })
            .select()
            .single();

        if (branchError) {
            console.error('Branch creation error:', branchError);
        }

        // Create admin role
        const { data: adminRole, error: roleError } = await supabase
            .from('roles')
            .insert({
                company_id: newCompany.id,
                code: 'ADMIN',
                name: 'Admin',
                name_ar: 'مدير',
                is_system: true,
                is_super_admin: true,
            })
            .select()
            .single();

        if (roleError) {
            console.error('Role creation error:', roleError);
        }

        // Link user to company
        const { error: linkError } = await supabase.from('app_user_companies').insert({
            user_id: newUser.id,
            company_id: newCompany.id,
            role_id: adminRole?.id || null,
            is_owner: true,
            is_primary: true,
            status: 'active',
        });

        if (linkError) {
            console.error('Link user error:', linkError);
        }

        // Create branch access if branch was created
        if (defaultBranch) {
            try {
                await supabase.from('user_branch_access').insert({
                    user_id: newUser.id,
                    company_id: newCompany.id,
                    branch_id: defaultBranch.id,
                    can_view: true,
                    can_edit: true,
                    can_delete: true,
                    is_default: true,
                });
            } catch (e) {
                console.log('Branch access creation skipped:', e);
            }
        }

        // Create default warehouse (optional)
        try {
            await supabase.from('warehouses').insert({
                company_id: newCompany.id,
                branch_id: defaultBranch?.id,
                code: 'WH-01',
                name: 'Main Warehouse',
                name_ar: 'المخزن الرئيسي',
                is_default: true,
                is_active: true,
            });
        } catch (e) {
            console.log('Warehouse creation skipped:', e);
        }

        // Create default vault (optional)
        try {
            await supabase.from('vaults').insert({
                company_id: newCompany.id,
                branch_id: defaultBranch?.id,
                code: 'CASH-01',
                name: 'Main Cash',
                name_ar: 'الخزينة الرئيسية',
                vault_type: 'cash',
                currency: 'EGP',
                balance: 0,
                is_default: true,
            });
        } catch (e) {
            console.log('Vault creation skipped:', e);
        }

        // Number sequences (optional)
        const sequences = [
            { document_type: 'sales_invoice', prefix: 'INV-' },
            { document_type: 'purchase_invoice', prefix: 'PUR-' },
            { document_type: 'receipt', prefix: 'REC-' },
            { document_type: 'payment', prefix: 'PAY-' },
        ];

        for (const seq of sequences) {
            try {
                await supabase.from('number_sequences').insert({
                    company_id: newCompany.id,
                    document_type: seq.document_type,
                    prefix: seq.prefix,
                    next_number: 1,
                    padding: 5,
                });
            } catch {
                // Sequence creation optional
            }
        }

        // Try to create chart of accounts (optional)
        try {
            await supabase.rpc('create_chart_of_accounts', { p_company_id: newCompany.id });
        } catch (e) {
            console.log('Chart of accounts creation skipped');
        }

        // Return success (exclude password_hash)
        const { password_hash, ...safeUser } = newUser;

        return NextResponse.json({
            message: 'تم إنشاء الحساب بنجاح',
            user: safeUser,
            company: newCompany,
            branch: defaultBranch,
            trial_ends_at: trialEndsAt.toISOString(),
        });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'خطأ في الخادم' },
            { status: 500 }
        );
    }
}
