import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

// GET: Verify invitation token
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;
        const supabase = await createSupabaseServerClient();

        const { data: invitation, error } = await supabase
            .from('user_invitations')
            .select(`
                id, email, status, expires_at,
                company:companies (id, name),
                role:roles (id, name_ar)
            `)
            .eq('token', token)
            .single();

        if (error || !invitation) {
            return NextResponse.json(
                { error: 'دعوة غير صالحة' },
                { status: 404 }
            );
        }

        // Check if expired
        if (new Date(invitation.expires_at) < new Date()) {
            return NextResponse.json(
                { error: 'انتهت صلاحية الدعوة', status: 'expired' },
                { status: 400 }
            );
        }

        // Check if already accepted
        if (invitation.status === 'accepted') {
            return NextResponse.json(
                { error: 'تم قبول هذه الدعوة مسبقاً', status: 'accepted' },
                { status: 400 }
            );
        }

        return NextResponse.json(invitation);
    } catch (error) {
        console.error('Verify invitation error:', error);
        return NextResponse.json(
            { error: 'خطأ في الخادم' },
            { status: 500 }
        );
    }
}
