import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

// POST: Toggle device restriction for a user
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;
        const supabase = await createSupabaseServerClient();
        const body = await request.json();

        const { enabled } = body;

        const { error } = await supabase
            .from('app_users')
            .update({ device_restriction_enabled: enabled })
            .eq('id', userId);

        if (error) {
            console.error('Error updating device restriction:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            message: enabled ? 'تم تفعيل تقييد الجهاز' : 'تم إلغاء تقييد الجهاز',
        });
    } catch (error) {
        console.error('Device restriction error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
