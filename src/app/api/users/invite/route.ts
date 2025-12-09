import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { sendInvitationEmail } from '@/lib/email';

// POST: Send invitation to a new user
export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();
        const cookieStore = await cookies();
        const inviterId = cookieStore.get('user_id')?.value;

        const body = await request.json();
        const { company_id, email, role_id } = body;

        if (!company_id || !email || !role_id) {
            return NextResponse.json(
                { error: 'جميع الحقول مطلوبة' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('app_users')
            .select('id')
            .eq('email', email.toLowerCase())
            .single();

        if (existingUser) {
            // Check if user is already in this company
            const { data: existingLink } = await supabase
                .from('app_user_companies')
                .select('id')
                .eq('user_id', existingUser.id)
                .eq('company_id', company_id)
                .single();

            if (existingLink) {
                return NextResponse.json(
                    { error: 'المستخدم موجود بالفعل في هذه الشركة' },
                    { status: 400 }
                );
            }
        }

        // Check for existing pending invitation
        const { data: existingInvite } = await supabase
            .from('user_invitations')
            .select('id')
            .eq('email', email.toLowerCase())
            .eq('company_id', company_id)
            .eq('status', 'pending')
            .single();

        if (existingInvite) {
            return NextResponse.json(
                { error: 'توجد دعوة معلقة لهذا البريد الإلكتروني' },
                { status: 400 }
            );
        }

        // Get inviter info
        let inviterName = 'مدير النظام';
        if (inviterId) {
            const { data: inviter } = await supabase
                .from('app_users')
                .select('name')
                .eq('id', inviterId)
                .single();
            if (inviter) inviterName = inviter.name;
        }

        // Get company info
        const { data: company } = await supabase
            .from('companies')
            .select('name')
            .eq('id', company_id)
            .single();

        // Get role info
        const { data: role } = await supabase
            .from('roles')
            .select('name_ar')
            .eq('id', role_id)
            .single();

        // Generate invitation token
        const token = uuidv4();

        // Set expiry to 7 days
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Create invitation
        const { data: invitation, error } = await supabase
            .from('user_invitations')
            .insert({
                company_id,
                email: email.toLowerCase(),
                role_id,
                token,
                invited_by: inviterId,
                expires_at: expiresAt.toISOString(),
                status: 'pending',
            })
            .select()
            .single();

        if (error) {
            console.error('Invitation error:', error);
            return NextResponse.json(
                { error: 'فشل إنشاء الدعوة' },
                { status: 400 }
            );
        }

        // Generate invite link
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${token}`;

        // Send email
        const emailResult = await sendInvitationEmail({
            to: email,
            inviterName,
            companyName: company?.name || 'الشركة',
            roleName: role?.name_ar || 'عضو',
            inviteLink,
        });

        return NextResponse.json({
            message: emailResult.success
                ? 'تم إرسال الدعوة بنجاح'
                : 'تم إنشاء الدعوة (لم يتم إرسال البريد)',
            invitation,
            inviteLink,
            emailSent: emailResult.success,
        });
    } catch (error) {
        console.error('Invite error:', error);
        return NextResponse.json(
            { error: 'خطأ في الخادم' },
            { status: 500 }
        );
    }
}
