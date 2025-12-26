import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface Payload {
  veterinarianId: string;
  email?: string;
  password?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRole);

    const { veterinarianId, email, password }: Payload = await req.json();

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

    if (!veterinarian.user_id) {
      return new Response(
        JSON.stringify({ error: 'Veterinário não tem usuário vinculado' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Build update payload
    const updatePayload: Record<string, any> = {};
    if (email) updatePayload.email = email;
    if (password) updatePayload.password = password;
    if (Object.keys(updatePayload).length > 0) {
      const { data: updatedUser, error: updateError } =
        await supabase.auth.admin.updateUserById(
          veterinarian.user_id,
          updatePayload
        );

      if (updateError) {
        return new Response(
          JSON.stringify({
            error: 'Erro ao atualizar usuário',
            details: updateError.message,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // If email changed, update veterinarians table to keep in sync
    if (email && email !== veterinarian.email) {
      const { error: updateVetError } = await supabase
        .from('veterinarians')
        .update({ email })
        .eq('id', veterinarianId);

      if (updateVetError) {
        return new Response(
          JSON.stringify({
            error: 'Erro ao atualizar email no veterinário',
            details: updateVetError.message,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: 'Erro interno do servidor',
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
