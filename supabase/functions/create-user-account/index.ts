
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function verifyCallerIsAdmin(supabaseAdmin: any, req: Request): Promise<{ authorized: boolean; error?: string }> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { authorized: false, error: 'Missing or invalid Authorization header' }
  }

  const token = authHeader.replace('Bearer ', '')
  
  // Create a client scoped to the caller to verify their identity
  const supabaseCaller = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )
  
  const { data, error } = await supabaseCaller.auth.getClaims(token)
  if (error || !data?.claims) {
    return { authorized: false, error: 'Invalid or expired token' }
  }
  
  const userId = data.claims.sub
  
  // Check caller has admin or super_admin role
  const { data: roles, error: roleError } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)

  if (roleError || !roles?.length) {
    return { authorized: false, error: 'Forbidden: insufficient privileges' }
  }

  const hasPrivilege = roles.some((r: any) => ['admin', 'super_admin'].includes(r.role))
  if (!hasPrivilege) {
    return { authorized: false, error: 'Forbidden: insufficient privileges' }
  }

  return { authorized: true }
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

    // Verify caller is admin or super_admin
    const { authorized, error: authError } = await verifyCallerIsAdmin(supabaseAdmin, req)
    if (!authorized) {
      return new Response(
        JSON.stringify({ error: authError }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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

    // Assign role if specified — prevent non-super_admins from creating super_admin accounts
    if (role) {
      // Get caller's roles to check if they can assign the requested role
      const callerAuth = req.headers.get('Authorization')!.replace('Bearer ', '')
      const supabaseCaller = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: `Bearer ${callerAuth}` } } }
      )
      const { data: claimsData } = await supabaseCaller.auth.getClaims(callerAuth)
      const callerId = claimsData?.claims?.sub

      if (role === 'super_admin') {
        // Only super_admins can create other super_admins
        const { data: callerRoles } = await supabaseAdmin
          .from('user_roles')
          .select('role')
          .eq('user_id', callerId)
        
        const callerIsSuperAdmin = callerRoles?.some((r: any) => r.role === 'super_admin')
        if (!callerIsSuperAdmin) {
          return new Response(
            JSON.stringify({ error: 'Only super admins can assign the super_admin role' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

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
