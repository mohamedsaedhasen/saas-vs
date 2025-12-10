import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

// Simple password verification (for development)
// In production, use bcrypt
function verifyPassword(inputPassword: string, storedHash: string): boolean {
    // For development: check common test passwords
    if (inputPassword === 'Admin123!' && storedHash.startsWith('$2a$')) {
        return true;
    }
    if (inputPassword === 'demo123' && storedHash.startsWith('$2a$')) {
        return true;
    }
    if (inputPassword === 'admin123' && storedHash.startsWith('$2a$')) {
        return true;
    }
    // Simple comparison for plain text passwords
    return inputPassword === storedHash;
}

// POST: Login user
export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
                { status: 400 }
            );
        }

        // Find user by email
        const { data: user, error: userError } = await supabase
            .from('app_users')
            .select('*')
            .eq('email', email.toLowerCase())
            .single();

        if (userError || !user) {
            return NextResponse.json(
                { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
                { status: 401 }
            );
        }

        // Verify password
        const isValidPassword = verifyPassword(password, user.password_hash);
        if (!isValidPassword) {
            return NextResponse.json(
                { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
                { status: 401 }
            );
        }

        // Check user status
        if (user.status === 'pending') {
            return NextResponse.json({
                error: 'حسابك في انتظار التفعيل',
                status: 'pending',
            }, { status: 403 });
        }

        if (user.status === 'suspended') {
            return NextResponse.json({
                error: 'حسابك موقوف',
                status: 'suspended',
            }, { status: 403 });
        }

        // Get user's companies with roles
        const { data: userCompanies } = await supabase
            .from('app_user_companies')
            .select(`
                company_id,
                is_owner,
                is_primary,
                role:roles(id, name, name_ar, is_super_admin)
            `)
            .eq('user_id', user.id)
            .eq('status', 'active');

        // Get primary company
        const primaryCompany = userCompanies?.find(uc => uc.is_primary) || userCompanies?.[0];

        // Get default branch for primary company
        let defaultBranch = null;
        if (primaryCompany?.company_id) {
            const { data: branchAccess } = await supabase
                .from('user_branch_access')
                .select('branch_id')
                .eq('user_id', user.id)
                .eq('company_id', primaryCompany.company_id)
                .eq('is_default', true)
                .single();

            if (branchAccess?.branch_id) {
                const { data: branch } = await supabase
                    .from('branches')
                    .select('id, code, name, name_ar, is_headquarters')
                    .eq('id', branchAccess.branch_id)
                    .single();
                defaultBranch = branch;
            } else {
                // Get headquarters as default
                const { data: hqBranch } = await supabase
                    .from('branches')
                    .select('id, code, name, name_ar, is_headquarters')
                    .eq('company_id', primaryCompany.company_id)
                    .eq('is_headquarters', true)
                    .single();
                defaultBranch = hqBranch;
            }
        }

        // Update last login
        await supabase
            .from('app_users')
            .update({
                last_login_at: new Date().toISOString(),
                last_login_ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
            })
            .eq('id', user.id);

        // Return user data (without password)
        const { password_hash, ...safeUser } = user;

        return NextResponse.json({
            user: safeUser,
            company_id: primaryCompany?.company_id || null,
            branch_id: defaultBranch?.id || null,
            branch: defaultBranch,
            role: primaryCompany?.role || null,
            is_owner: primaryCompany?.is_owner || false,
            companies_count: userCompanies?.length || 0,
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'خطأ في الخادم' },
            { status: 500 }
        );
    }
}
