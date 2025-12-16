# Perfis de Teste do Sistema de Gestão Veterinária

Este documento contém todos os perfis de teste necessários para testar todas as funcionalidades do sistema.

## 1. Dono da Clínica (Administrador)

**Email:** `admin@vetclinic.com`
**Senha:** `admin123456`
**Papel:** Administrador/Dono da Clínica

**O que pode fazer:**
- Ver dashboard completo com todas as estatísticas
- Gerenciar tutores (criar, editar, excluir)
- Gerenciar animais
- Ver e gerenciar consultas
- Ver e gerenciar prontuários médicos criados pelos veterinários
- Ver prescrições criadas pelos veterinários
- Ver vacinações aplicadas
- Gerenciar veterinários da clínica
- Aprovar/rejeitar solicitações de consulta

**Como testar:**
1. Acesse `/login`
2. Faça login com as credenciais acima
3. Você verá o dashboard com 8 cards de estatísticas
4. Navegue por todas as abas para ver os dados criados pelos veterinários

---

## 2. Veterinário

**Email:** `vet@vetclinic.com`
**Senha:** `vet123456`
**Nome:** Dr. João Silva
**CRMV:** CRMV-SP-12345
**Papel:** Veterinário da Clínica

**O que pode fazer:**
- Ver lista de animais da clínica
- Criar e visualizar prontuários médicos
- Criar e visualizar prescrições
- Criar e visualizar vacinações
- Editar informações dos animais
- Alterar senha do perfil

**Como testar:**
1. Acesse `/veterinarian-login`
2. Faça login com as credenciais acima
3. Navegue pelas abas:
   - **Animais:** Ver lista e editar informações
   - **Prontuários:** Criar novos prontuários médicos
   - **Prescrições:** Criar novas prescrições
   - **Vacinas:** Registrar vacinações
   - **Meu Perfil:** Alterar senha

---

## 3. Tutor (Dono do Pet)

**Email:** `tutor@example.com`
**Senha:** `tutor123456`
**Nome:** Maria Santos
**Papel:** Tutor/Dono de Pet

**O que pode fazer:**
- Ver seus próprios dados
- Ver lista de seus animais
- Solicitar consultas para seus animais
- Ver histórico de consultas
- Ver prontuários médicos de seus animais
- Ver prescrições de seus animais
- Ver histórico de vacinações

**Como testar:**
1. Acesse `/tutor-login`
2. Faça login com as credenciais acima
3. Explore o portal do tutor:
   - Ver informações pessoais
   - Ver lista de pets
   - Solicitar nova consulta
   - Ver histórico médico completo

---

## Fluxo de Teste Completo

### Teste 1: Criar Animal e Consulta (Como Dono da Clínica)
1. Login como `admin@vetclinic.com`
2. Crie um novo tutor em **Tutores**
3. Crie um novo animal vinculado ao tutor
4. Crie uma nova consulta em **Agendamentos**
5. Verifique que o dashboard atualiza as estatísticas

### Teste 2: Criar Prontuário e Prescrição (Como Veterinário)
1. Login como `vet@vetclinic.com`
2. Vá para **Prontuários** e crie um novo prontuário médico
3. Vá para **Prescrições** e crie uma nova prescrição
4. Vá para **Vacinas** e registre uma vacinação
5. Logout e login como admin para verificar que todos os dados estão visíveis

### Teste 3: Solicitar Consulta (Como Tutor)
1. Login como `tutor@example.com`
2. Solicite uma nova consulta
3. Logout e login como admin
4. Aprove a solicitação de consulta
5. Verifique que a consulta foi criada

### Teste 4: Verificar Permissões
1. Login como tutor e tente acessar `/dashboard` (deve redirecionar)
2. Login como veterinário e tente acessar `/dashboard` (deve redirecionar)
3. Cada usuário só deve ver dados da própria clínica

---

## Estrutura de Dados de Teste

### Clínica
- **Nome:** Clínica Veterinária Exemplo
- **ID:** Gerado automaticamente no primeiro login do admin

### Animais de Teste
- **Rex** - Cachorro, Labrador, 5 anos - Tutor: Maria Santos
- **Mimi** - Gato, Siamês, 3 anos - Tutor: Maria Santos

### Prontuários Médicos
- Consultório de rotina para Rex
- Vacinação anual para Mimi

### Prescrições
- Antibiótico para Rex
- Vermífugo para Mimi

### Vacinações
- V10 para Rex
- Antirrábica para Mimi

---

## Credenciais Resumidas

```
ADMIN/DONO DA CLÍNICA:
Email: admin@vetclinic.com
Senha: admin123456
URL: /login

VETERINÁRIO:
Email: vet@vetclinic.com
Senha: vet123456
URL: /veterinarian-login

TUTOR:
Email: tutor@example.com
Senha: tutor123456
URL: /tutor-login
```

---

## Notas Importantes

1. **Segurança:** Todas as senhas devem ser alteradas em produção
2. **RLS:** As políticas RLS garantem que cada usuário só vê dados da própria clínica
3. **Hierarquia:** Admin > Veterinário > Tutor em termos de permissões
4. **Dados Compartilhados:** O admin pode ver TODOS os dados criados pelos veterinários
5. **Isolamento:** Os tutores só veem dados de seus próprios animais

---

## Como Popular o Banco com Dados de Teste

Execute o seguinte SQL no Supabase SQL Editor:

```sql
-- Os dados serão criados automaticamente quando você:
-- 1. Criar a conta do admin em /signup
-- 2. Criar a conta do veterinário usando a página Veterinarians
-- 3. Criar a conta do tutor usando a página Tutores
-- 4. Criar animais, consultas, prontuários, etc. através da interface
```

**Recomendação:** Use a interface do sistema para criar os dados de teste, pois isso garante que todas as validações e permissões funcionem corretamente.
