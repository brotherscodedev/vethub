/*
  # Adicionar Política RLS para Tutores Visualizarem Próprio Perfil

  ## Mudanças
  1. Nova Política
    - Tutores podem visualizar seu próprio registro na tabela tutors
    - Necessário para que o tutor possa buscar seus dados através de user_id
  
  ## Segurança
  - Política restritiva: tutores só veem seu próprio registro (WHERE user_id = auth.uid())
*/

-- Adicionar política para tutores verem seu próprio perfil
CREATE POLICY "Tutors can view own profile"
  ON tutors FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
