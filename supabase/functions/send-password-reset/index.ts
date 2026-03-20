import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PasswordResetRequest {
  email: string;
  redirectTo?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify caller identity and role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseCaller = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: caller }, error: callerError } = await supabaseCaller.auth.getUser();
    if (callerError || !caller) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check caller has admin or super_admin role
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id);

    const hasPrivilege = roles?.some((r: any) => ['admin', 'super_admin'].includes(r.role));
    if (!hasPrivilege) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: insufficient privileges' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, redirectTo }: PasswordResetRequest = await req.json();

    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'http://localhost:3000';
    const resetUrl = redirectTo || `${origin}/reset-password`;

    console.log('Sending password reset email to:', email);
    console.log('Redirect URL:', resetUrl);

    // Generate the recovery link using the admin API
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: resetUrl
      }
    });

    if (error) {
      console.error('Error generating reset link:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resetLink = data.properties.action_link;
    console.log('Generated reset link successfully');

    // Render the email HTML
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Reset Your Password</h2>
        <p>You've received a request to reset your password for your CareHR account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="margin: 24px 0;">
          <a href="${resetLink}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          If you didn't request this password reset, you can safely ignore this email.
          This link will expire in 1 hour.
        </p>
        <p style="color: #666; font-size: 14px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <span style="word-break: break-all;">${resetLink}</span>
        </p>
      </div>
    `;

    // Enqueue via the email queue for reliable delivery
    const runId = crypto.randomUUID();
    const messageId = crypto.randomUUID();
    const { data: msgId, error: enqueueError } = await supabaseAdmin.rpc('enqueue_email', {
      queue_name: 'transactional_emails',
      payload: {
        run_id: runId,
        message_id: messageId,
        to: email,
        from: 'carehr <noreply@notify.demo.carehr.app>',
        sender_domain: 'notify.demo.carehr.app',
        subject: 'Reset Your Password',
        html: emailHtml,
        text: `Reset your password by visiting: ${resetLink}`,
        purpose: 'transactional',
        label: 'password-reset',
        queued_at: new Date().toISOString(),
      }
    });

    if (enqueueError) {
      console.error('Error enqueuing email:', enqueueError);
      return new Response(
        JSON.stringify({ error: 'Failed to queue password reset email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Password reset email enqueued successfully, msgId:', msgId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password reset email sent successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Exception in send-password-reset:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
