import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface InvitationEmailParams {
    to: string;
    inviterName: string;
    companyName: string;
    roleName: string;
    inviteLink: string;
}

export async function sendInvitationEmail(params: InvitationEmailParams) {
    const { to, inviterName, companyName, roleName, inviteLink } = params;

    try {
        const { data, error } = await resend.emails.send({
            from: 'ERP SaaS <noreply@resend.dev>', // Use your verified domain in production
            to: [to],
            subject: `دعوة للانضمام إلى ${companyName}`,
            html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🎉 دعوة للانضمام</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px;">
            <p style="font-size: 16px; color: #374151; line-height: 1.8;">
                مرحباً،
            </p>
            <p style="font-size: 16px; color: #374151; line-height: 1.8;">
                تمت دعوتك من قبل <strong>${inviterName}</strong> للانضمام إلى 
                <strong style="color: #6366f1;">${companyName}</strong> 
                كـ <strong>${roleName}</strong>.
            </p>
            
            <!-- Button -->
            <div style="text-align: center; margin: 32px 0;">
                <a href="${inviteLink}" 
                   style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: bold;">
                    قبول الدعوة
                </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
                أو انسخ هذا الرابط:
            </p>
            <p style="font-size: 12px; color: #6366f1; word-break: break-all; background: #f3f4f6; padding: 12px; border-radius: 6px;">
                ${inviteLink}
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
                هذه الدعوة صالحة لمدة 7 أيام.
                <br>
                إذا لم تطلب هذه الدعوة، يمكنك تجاهل هذا البريد.
            </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px; text-align: center;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                © ${new Date().getFullYear()} ERP SaaS. جميع الحقوق محفوظة.
            </p>
        </div>
    </div>
</body>
</html>
            `,
        });

        if (error) {
            console.error('Resend error:', error);
            return { success: false, error: error.message };
        }

        console.log('Email sent successfully:', data);
        return { success: true, data };
    } catch (error) {
        console.error('Email sending error:', error);
        return { success: false, error: 'Failed to send email' };
    }
}
