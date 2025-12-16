import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface VeterinarianData {
  veterinarianId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { veterinarianId }: VeterinarianData = await req.json();

    if (!veterinarianId) {
      return new Response(
        JSON.stringify({ error: 'veterinarianId é obrigatório' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: veterinarian, error: vetError } = await supabase
      .from('veterinarians')
      .select('*')
      .eq('id', veterinarianId)
      .single();

    if (vetError || !veterinarian) {
      return new Response(
        JSON.stringify({ error: 'Veterinário não encontrado' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (veterinarian.user_id) {
      return new Response(
        JSON.stringify({ error: 'Veterinário já tem conta de acesso' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: veterinarian.email,
      password: veterinarian.cpf,
      email_confirm: true,
      user_metadata: {
        full_name: veterinarian.name,
        user_type: 'veterinarian',
      },
    });

    if (authError) {
      return new Response(
        JSON.stringify({ error: 'Erro ao criar conta de acesso', details: authError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { error: updateError } = await supabase
      .from('veterinarians')
      .update({ user_id: authData.user.id })
      .eq('id', veterinarianId);

    if (updateError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: 'Erro ao vincular conta', details: updateError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Conta criada com sucesso',
        userId: authData.user.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});