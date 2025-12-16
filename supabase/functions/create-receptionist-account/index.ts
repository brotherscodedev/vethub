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
  // Tratamento de CORS (Preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Configuração do cliente Supabase com Service Role (Privilegiado)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Verificar Autenticação do Usuário (Quem está chamando a função?)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Token de autorização não fornecido');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    // 2. Parse do corpo da requisição
    const receptionistData: ReceptionistData = await req.json();

    console.log(`[Create Receptionist] Iniciando criação por User: ${user.id} para Clínica: ${receptionistData.clinic_id}`);

    // 3. VALIDAÇÃO DE PERMISSÃO (CORRIGIDA)
    // Usamos maybeSingle() para não lançar exceção se não encontrar registro
    const { data: clinicUser, error: roleError } = await supabase
      .from('clinic_users')
      .select('clinic_id, role')
      .eq('user_id', user.id)
      .eq('clinic_id', receptionistData.clinic_id)
      .eq('is_active', true)
      .maybeSingle();

    if (roleError) {
      console.error('[Erro DB] Falha ao verificar permissões:', roleError);
      throw new Error('Erro interno ao verificar permissões.');
    }

    // Lista de roles que podem criar recepcionistas
    const allowedRoles = ['admin', 'super_admin'];

    // Se não achou vínculo na clínica OU a role não está na lista permitida
    if (!clinicUser || !allowedRoles.includes(clinicUser.role)) {
      console.warn(`[Acesso Negado] User ${user.id} tentou criar recepcionista sem permissão. Role encontrada: ${clinicUser?.role}`);
      throw new Error('Permissão negada. Apenas administradores podem criar recepcionistas nesta clínica.');
    }

    // 4. Criação do Usuário no Auth (Supabase Auth)
    const cpfOnly = receptionistData.cpf.replace(/\D/g, ''); // Remove caracteres não numéricos

    const { data: authData, error: createUserError } = await supabase.auth.admin.createUser({
      email: receptionistData.email,
      password: cpfOnly, // Senha temporária é o CPF
      email_confirm: true,
      user_metadata: {
        full_name: receptionistData.name, // Ajustado para full_name para padronizar com user_profiles geralmente
        name: receptionistData.name,
        role: 'receptionist',
      },
    });

    if (createUserError || !authData.user) {
      // Tratamento específico para usuário já existente
      if (createUserError?.message?.includes('already registered')) {
        throw new Error('Este e-mail já está cadastrado no sistema.');
      }
      throw new Error(`Erro ao criar conta de acesso: ${createUserError?.message}`);
    }

    // 5. Inserção na tabela 'receptionists' (Dados do negócio)
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

    // ROLLBACK: Se falhar ao salvar no banco, deletamos o usuário do Auth para não ficar "órfão"
    if (receptionistError) {
      console.error('[Erro Insert] Falha ao salvar recepcionista, revertendo Auth:', receptionistError);
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Erro ao salvar dados do recepcionista: ${receptionistError.message}`);
    }

    // 6. Resposta de Sucesso
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
    console.error('[Erro Geral]', error.message);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro interno ao processar solicitação',
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