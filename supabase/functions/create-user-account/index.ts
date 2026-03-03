
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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
    )

    const { email, firstName, lastName, employeeId, companyId, role, password } = await req.json()

    // Create user account with optional password
    const createUserParams: any = {
      email,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName
      }
    }

    if (password) {
      createUserParams.password = password
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser(createUserParams)

    if (userError) {
      console.error('Error creating user:', userError)
      return new Response(
        JSON.stringify({ error: userError.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const userId = userData.user.id

    // Update the profile with company_id and optional employee link
    const profileUpdate: any = {}
    if (companyId) profileUpdate.company_id = companyId
    if (employeeId) profileUpdate.employee_id = employeeId
    if (firstName) profileUpdate.first_name = firstName
    if (lastName) profileUpdate.last_name = lastName

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdate)
        .eq('id', userId)

      if (profileError) {
        console.error('Error updating profile:', profileError)
      }
    }

    // Assign role if specified
    if (role) {
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: userId, role })

      if (roleError) {
        console.error('Error assigning role:', roleError)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: userData.user,
        message: 'User account created successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Exception in create-user-account:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
