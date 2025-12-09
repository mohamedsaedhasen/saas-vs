import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

// POST: Accept invitation and create user
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;
        const supabase = await createSupabaseServerClient();
        const body = await request.json();

        const { name, phone, password } = body;

        if (!name || !password) {
            return NextResponse.json(
                { error: 'الاسم وكلمة المرور مطلوبان' },
                { status: 400 }
            );
        }

        // Get invitation
        const { data: invitation, error: inviteError } = await supabase
            .from('user_invitations')
            .select('id, email, company_id, role_id, status, expires_at')
            .eq('token', token)
            .single();

        if (inviteError || !invitation) {
            return NextResponse.json(
                { error: 'دعوة غير صالحة' },
                { status: 404 }
            );
        }

        // Check expiry
        if (new Date(invitation.expires_at) < new Date()) {
            return NextResponse.json(
                { error: 'انتهت صلاحية الدعوة' },
                { status: 400 }
            );
        }

        // Check if already accepted
        if (invitation.status === 'accepted') {
            return NextResponse.json(
                { error: 'تم قبول هذه الدعوة مسبقاً' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('app_users')
            .select('id')
            .eq('email', invitation.email)
            .single();

        let userId: string;

        if (existingUser) {
            // User exists, just link to company
            userId = existingUser.id;
        } else {
            // Create new user
            const { data: newUser, error: userError } = await supabase
                .from('app_users')
                .insert({
                    name,
                    email: invitation.email,
                    phone,
                    password_hash: 'hashed_' + password, // Simple hash for dev
                    role_id: invitation.role_id,
                    status: 'active',
                    plan: 'team',
                })
                .select()
                .single();

            if (userError) {
                console.error('User creation error:', userError);
                return NextResponse.json(
                    { error: 'فشل إنشاء الحساب' },
                    { status: 400 }
                );
            }

            userId = newUser.id;
        }

        // Link user to company
        await supabase.from('app_user_companies').insert({
            user_id: userId,
            company_id: invitation.company_id,
            role: 'member',
            is_primary: false,
        });

        // Mark invitation as accepted
        await supabase
            .from('user_invitations')
            .update({
                status: 'accepted',
                accepted_at: new Date().toISOString(),
            })
            .eq('id', invitation.id);

        // Get user data
        const { data: user } = await supabase
            .from('app_users')
            .select('id, name, email')
            .eq('id', userId)
            .single();

        return NextResponse.json({
            message: 'تم قبول الدعوة بنجاح',
            user,
            company_id: invitation.company_id,
        });
    } catch (error) {
        console.error('Accept invitation error:', error);
        return NextResponse.json(
            { error: 'خطأ في الخادم' },
            { status: 500 }
        );
    }
}
