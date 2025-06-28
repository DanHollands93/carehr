
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

    const { email, redirectTo }: PasswordResetRequest = await req.json();

    // Get the origin from the request headers to build the correct redirect URL
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'http://localhost:3000';
    const resetUrl = redirectTo || `${origin}/reset-password`;

    console.log('Sending password reset email to:', email);
    console.log('Redirect URL:', resetUrl);

    // Generate a password reset token
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: resetUrl
      }
    });

    if (error) {
      console.error('Error generating reset link:', error);
      
      // Log failed email attempt
      await supabaseAdmin.from('email_logs').insert({
        recipient_email: email,
        subject: 'Reset Your Password',
        email_type: 'password_reset',
        status: 'failed',
        email_service: 'resend',
        error_message: error.message
      });

      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Generated reset link:', data.properties.action_link);

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "HR System <noreply@resend.dev>",
      to: [email],
      subject: "Reset Your Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Reset Your Password</h2>
          <p>You've requested to reset your password for your HR System account.</p>
          <p>Click the link below to reset your password:</p>
          <div style="margin: 20px 0;">
            <a href="${data.properties.action_link}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            If you didn't request this password reset, you can safely ignore this email.
            This link will expire in 1 hour.
          </p>
          <p style="color: #666; font-size: 14px;">
            If the button doesn't work, you can copy and paste this link into your browser:<br>
            <span style="word-break: break-all;">${data.properties.action_link}</span>
          </p>
        </div>
      `,
    });

    if (emailResponse.error) {
      console.error('Error sending email:', emailResponse.error);
      
      // Log failed email
      await supabaseAdmin.from('email_logs').insert({
        recipient_email: email,
        subject: 'Reset Your Password',
        email_type: 'password_reset',
        status: 'failed',
        email_service: 'resend',
        error_message: emailResponse.error.message
      });

      return new Response(
        JSON.stringify({ error: 'Failed to send password reset email' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Password reset email sent successfully:', emailResponse);

    // Log successful email
    await supabaseAdmin.from('email_logs').insert({
      recipient_email: email,
      subject: 'Reset Your Password',
      email_type: 'password_reset',
      status: 'sent',
      email_service: 'resend',
      external_id: emailResponse.data?.id
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password reset email sent successfully',
        emailId: emailResponse.data?.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Exception in send-password-reset:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
