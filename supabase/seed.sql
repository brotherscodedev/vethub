/*
  SCRIPT DE SEED PARA DADOS DE TESTE

  IMPORTANTE:
  - Execute este script SOMENTE em ambiente de desenvolvimento
  - Este script cria usuários, clínica e dados de exemplo
  - Adapte os IDs conforme necessário

  NOTA: Para criar usuários no Supabase, você deve usar a interface do sistema
  ou Edge Functions, pois o auth é gerenciado pelo Supabase Auth.

  Este script apenas documenta a estrutura de dados que deve ser criada.
*/

-- ============================================
-- PASSO 1: CRIAR USUÁRIOS
-- ============================================
-- IMPORTANTE: Usuários devem ser criados através da interface ou Edge Functions
-- Não é possível criar usuários diretamente via SQL no Supabase Auth

/*
CRIAR ATRAVÉS DA INTERFACE:

1. ADMIN:
   - Acesse /signup
   - Email: admin@vetclinic.com
   - Senha: admin123456
   - Nome da Clínica: Clínica Veterinária Exemplo

2. VETERINÁRIO:
   - Login como admin
   - Vá para Veterinários > Novo Veterinário
   - Email: vet@vetclinic.com
   - Senha: vet123456
   - Nome: Dr. João Silva
   - CRMV: CRMV-SP-12345
   - Especialidade: Clínica Geral

3. TUTOR:
   - Login como admin
   - Vá para Tutores > Novo Tutor
   - Email: tutor@example.com
   - Senha: tutor123456
   - Nome: Maria Santos
   - CPF: 123.456.789-00
   - Telefone: (11) 98765-4321
   - Endereço: Rua das Flores, 123
*/

-- ============================================
-- PASSO 2: DADOS DE EXEMPLO (APÓS CRIAR USUÁRIOS)
-- ============================================

-- NOTA: Substitua os UUIDs abaixo pelos IDs reais após criar os usuários

-- Exemplo de estrutura que será criada:
-- 1. Clínica (criada automaticamente no signup)
-- 2. Veterinários (criados via interface)
-- 3. Tutores (criados via interface)
-- 4. Animais (criados via interface)
-- 5. Prontuários, Prescrições, Vacinações (criados pelos veterinários)

-- ============================================
-- VERIFICAR DADOS CRIADOS
-- ============================================

-- Ver clínicas criadas
SELECT
  c.id,
  c.name,
  c.email,
  c.phone,
  (SELECT COUNT(*) FROM clinic_users WHERE clinic_id = c.id) as staff_count,
  (SELECT COUNT(*) FROM veterinarians WHERE clinic_id = c.id) as vet_count,
  (SELECT COUNT(*) FROM tutors WHERE clinic_id = c.id) as tutor_count,
  (SELECT COUNT(*) FROM animals WHERE clinic_id = c.id) as animal_count
FROM clinics c;

-- Ver veterinários
SELECT
  v.id,
  v.name,
  v.crmv,
  v.email,
  v.specialization,
  c.name as clinic_name
FROM veterinarians v
JOIN clinics c ON c.id = v.clinic_id;

-- Ver tutores
SELECT
  t.id,
  t.name,
  t.email,
  t.phone,
  c.name as clinic_name,
  (SELECT COUNT(*) FROM animals WHERE tutor_id = t.id) as animal_count
FROM tutors t
JOIN clinics c ON c.id = t.clinic_id;

-- Ver animais
SELECT
  a.id,
  a.name,
  a.species,
  a.breed,
  a.birth_date,
  t.name as tutor_name,
  c.name as clinic_name
FROM animals a
JOIN tutors t ON t.id = a.tutor_id
JOIN clinics c ON c.id = a.clinic_id;

-- Ver prontuários médicos
SELECT
  mr.id,
  mr.date,
  mr.diagnosis,
  a.name as animal_name,
  v.name as veterinarian_name,
  c.name as clinic_name
FROM medical_records mr
JOIN animals a ON a.id = mr.animal_id
JOIN veterinarians v ON v.id = mr.veterinarian_id
JOIN clinics c ON c.id = mr.clinic_id
ORDER BY mr.date DESC;

-- Ver prescrições
SELECT
  p.id,
  p.prescribed_at,
  p.medication,
  p.dosage,
  p.frequency,
  p.duration,
  a.name as animal_name,
  v.name as veterinarian_name,
  c.name as clinic_name
FROM prescriptions p
JOIN animals a ON a.id = p.animal_id
JOIN veterinarians v ON v.id = p.veterinarian_id
JOIN clinics c ON c.id = p.clinic_id
ORDER BY p.prescribed_at DESC;

-- Ver vacinações
SELECT
  v.id,
  v.vaccine_name,
  v.administered_at,
  v.next_dose_date,
  a.name as animal_name,
  vet.name as veterinarian_name,
  c.name as clinic_name
FROM vaccinations v
JOIN animals a ON a.id = v.animal_id
LEFT JOIN veterinarians vet ON vet.id = v.veterinarian_id
JOIN clinics c ON c.id = v.clinic_id
ORDER BY v.administered_at DESC;

-- ============================================
-- ESTATÍSTICAS DO SISTEMA
-- ============================================

-- Dashboard resumido
SELECT
  'Clínicas' as tipo, COUNT(*) as total FROM clinics
UNION ALL
SELECT 'Veterinários', COUNT(*) FROM veterinarians
UNION ALL
SELECT 'Tutores', COUNT(*) FROM tutors
UNION ALL
SELECT 'Animais', COUNT(*) FROM animals
UNION ALL
SELECT 'Prontuários', COUNT(*) FROM medical_records
UNION ALL
SELECT 'Prescrições', COUNT(*) FROM prescriptions
UNION ALL
SELECT 'Vacinações', COUNT(*) FROM vaccinations
UNION ALL
SELECT 'Consultas', COUNT(*) FROM appointments;

-- ============================================
-- LIMPEZA (USE COM CUIDADO!)
-- ============================================

-- ATENÇÃO: Descomente apenas se quiser LIMPAR TODOS OS DADOS
-- Isso é irreversível!

/*
-- Limpar dados de teste (não remove usuários auth)
TRUNCATE TABLE vaccinations CASCADE;
TRUNCATE TABLE prescriptions CASCADE;
TRUNCATE TABLE prescription_items CASCADE;
TRUNCATE TABLE medical_records CASCADE;
TRUNCATE TABLE appointments CASCADE;
TRUNCATE TABLE appointment_requests CASCADE;
TRUNCATE TABLE animals CASCADE;
TRUNCATE TABLE tutors CASCADE;
TRUNCATE TABLE veterinarians CASCADE;
TRUNCATE TABLE clinic_users CASCADE;
TRUNCATE TABLE clinics CASCADE;

-- Nota: Usuários do Supabase Auth devem ser removidos manualmente no painel
*/
