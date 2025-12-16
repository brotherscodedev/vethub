import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface SignupRequest {
  email: string;
  password: string;
  clinicData: {
    name: string;
    cnpj: string;
    phone?: string;
    city?: string;
  };
  profileData: {
    full_name: string;
    cpf?: string;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { email, password, clinicData, profileData }: SignupRequest = await req.json();

    // Create user with admin client
    const { data: { user }, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (signUpError || !user) {
      throw signUpError || new Error('Failed to create user');
    }

    // Create clinic
    const { data: clinic, error: clinicError } = await supabaseAdmin
      .from('clinics')
      .insert([clinicData])
      .select()
      .single();

    if (clinicError) {
      // Cleanup: delete user if clinic creation fails
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      throw clinicError;
    }

    // Create user profile
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert([{ id: user.id, ...profileData }]);

    if (profileError) {
      // Cleanup
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      throw profileError;
    }

    // Create clinic-user relationship
    const { error: clinicUserError } = await supabaseAdmin
      .from('clinic_users')
      .insert([{ 
        clinic_id: clinic.id, 
        user_id: user.id, 
        role: 'admin', 
        is_active: true 
      }]);

    if (clinicUserError) {
      // Cleanup
      await supabaseAdmin.auth.admin.deleteUser(user.id);
      throw clinicUserError;
    }

    // Generate session for the new user
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email!,
    });

    if (sessionError) {
      throw sessionError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          email: user.email,
        },
        clinic: {
          id: clinic.id,
          name: clinic.name,
        },
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An error occurred during signup',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
