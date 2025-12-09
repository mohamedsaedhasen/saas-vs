import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClientWithContext } from '@/lib/supabase-server';

// GET: Get current user info with role for specific company
export async function GET(request: NextRequest) {
    try {
        const { supabase, userId, companyId } = await createSupabaseServerClientWithContext();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user data
        const { data: user, error: userError } = await supabase
            .from('app_users')
            .select('id, email, name, name_ar, phone, avatar_url, status')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
        }

        // If company_id provided, get role for that company
        let role = null;
        let isOwner = false;
        let permissions: string[] = [];

        if (companyId) {
            const { data: userCompany } = await supabase
                .from('app_user_companies')
                .select(`
                    is_owner,
                    role:roles(id, name, name_ar, is_super_admin)
                `)
                .eq('user_id', userId)
                .eq('company_id', companyId)
                .single();

            if (userCompany) {
                role = userCompany.role;
                isOwner = userCompany.is_owner || false;

                // Get permissions
                if (role?.is_super_admin || isOwner) {
                    permissions = ['*']; // All permissions
                } else if (role?.id) {
                    const { data: rolePerms } = await supabase
                        .from('role_permissions')
                        .select(`
                            permission:permissions(
                                action,
                                module:modules(code)
                            )
                        `)
                        .eq('role_id', role.id);

                    permissions = rolePerms?.map(rp =>
                        `${rp.permission?.module?.code}:${rp.permission?.action}`
                    ).filter(Boolean) as string[] || [];
                }
            }
        }

        return NextResponse.json({
            user,
            role,
            is_owner: isOwner,
            permissions,
        });
    } catch (error) {
        console.error('Get me error:', error);
        return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
    }
}
