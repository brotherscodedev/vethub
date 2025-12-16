import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ReceptionistData {
  name: string;
  email: string;
  cpf: string;
  phone?: string;
  clinic_id: string;
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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Não autorizado');
    }

    const receptionistData: ReceptionistData = await req.json();

    const { data: clinicUser } = await supabase
      .from('clinic_users')
      .select('clinic_id, role')
      .eq('user_id', user.id)
      .eq('clinic_id', receptionistData.clinic_id)
      .eq('is_active', true)
      .single();

    if (!clinicUser || clinicUser.role !== 'owner') {
      throw new Error('Apenas donos da clínica podem criar recepcionistas');
    }

    const cpfOnly = receptionistData.cpf.replace(/\D/g, '');

    const { data: authData, error: createUserError } = await supabase.auth.admin.createUser({
      email: receptionistData.email,
      password: cpfOnly,
      email_confirm: true,
      user_metadata: {
        name: receptionistData.name,
        role: 'receptionist',
      },
    });

    if (createUserError || !authData.user) {
      throw new Error(`Erro ao criar usuário: ${createUserError?.message}`);
    }

    const { error: receptionistError } = await supabase
      .from('receptionists')
      .insert({
        user_id: authData.user.id,
        clinic_id: receptionistData.clinic_id,
        name: receptionistData.name,
        email: receptionistData.email,
        cpf: receptionistData.cpf,
        phone: receptionistData.phone || null,
        is_active: true,
      });

    if (receptionistError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Erro ao criar recepcionista: ${receptionistError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Recepcionista criado com sucesso',
        data: {
          id: authData.user.id,
          email: receptionistData.email,
          temporary_password: cpfOnly,
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
        error: error.message || 'Erro ao criar recepcionista',
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