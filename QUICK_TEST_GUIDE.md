# Guia Rápido de Teste

## Credenciais de Acesso

### 1. Administrador da Clínica
```
URL: http://localhost:5173/login
Email: admin@vetclinic.com
Senha: admin123456
```

**Funcionalidades:**
- Dashboard completo com 8 estatísticas
- Gerenciar tutores e animais
- Ver TODOS os dados criados pelos veterinários
- Aprovar solicitações de consulta
- Gerenciar veterinários

---

### 2. Veterinário
```
URL: http://localhost:5173/veterinarian-login
Email: vet@vetclinic.com
Senha: vet123456
```

**Funcionalidades:**
- Ver lista de animais
- Criar prontuários médicos
- Criar prescrições
- Registrar vacinações
- Editar informações dos animais

---

### 3. Tutor (Dono do Pet)
```
URL: http://localhost:5173/tutor-login
Email: tutor@example.com
Senha: tutor123456
```

**Funcionalidades:**
- Ver seus animais
- Solicitar consultas
- Ver histórico médico dos pets
- Ver prescrições e vacinações

---

## Teste Rápido em 5 Minutos

### Passo 1: Login como Veterinário (2 min)
1. Acesse `/veterinarian-login`
2. Login: `vet@vetclinic.com` / `vet123456`
3. Clique em **"Nova Prescrição"** na aba Prescrições
4. Preencha e salve
5. Clique em **"Novo Prontuário"** na aba Prontuários
6. Preencha e salve
7. Faça logout

### Passo 2: Login como Admin (2 min)
1. Acesse `/login`
2. Login: `admin@vetclinic.com` / `admin123456`
3. Veja o dashboard - deve mostrar:
   - Número de veterinários
   - Número de prontuários (criados pelo vet)
   - Número de prescrições (criadas pelo vet)
   - Número de vacinações
4. Clique em **Prontuários** - veja os dados do veterinário
5. Clique em **Prescrições** - veja as prescrições criadas

### Passo 3: Login como Tutor (1 min)
1. Acesse `/tutor-login`
2. Login: `tutor@example.com` / `tutor123456`
3. Veja seus animais e histórico médico
4. Solicite uma nova consulta

---

## Verificação de Segurança

### Teste de Isolamento de Dados
- ✅ Admin vê TODOS os dados da clínica
- ✅ Veterinário vê apenas animais e pode criar dados médicos
- ✅ Tutor vê apenas SEUS animais e dados
- ✅ Ninguém vê dados de outras clínicas

### Teste de Permissões
- ❌ Veterinário NÃO acessa `/dashboard`
- ❌ Tutor NÃO acessa `/dashboard`
- ❌ Tutor NÃO cria prescrições
- ✅ Apenas veterinários criam prescrições
- ✅ Apenas admin gerencia veterinários

---

## Primeira Vez?

### Criar Contas Manualmente

**1. Criar Admin:**
1. Acesse `/signup`
2. Email: `admin@vetclinic.com`
3. Senha: `admin123456`
4. Nome da clínica: `Clínica Veterinária Exemplo`

**2. Criar Veterinário:**
1. Login como admin
2. Vá para **Veterinários**
3. Clique **"Novo Veterinário"**
4. Email: `vet@vetclinic.com`
5. Senha: `vet123456`
6. Nome: Dr. João Silva
7. CRMV: CRMV-SP-12345

**3. Criar Tutor:**
1. Login como admin
2. Vá para **Tutores**
3. Clique **"Novo Tutor"**
4. Email: `tutor@example.com`
5. Senha: `tutor123456`
6. Nome: Maria Santos

**4. Criar Animal:**
1. Ainda como admin
2. Vá para **Recepção** ou qualquer aba
3. Clique **"Novo Animal"**
4. Nome: Rex
5. Espécie: Cachorro
6. Raça: Labrador
7. Idade: 5 anos
8. Selecione o tutor: Maria Santos

---

## URLs Importantes

```
Admin:        /login
Veterinário:  /veterinarian-login
Tutor:        /tutor-login
Signup:       /signup
Dashboard:    /dashboard (apenas admin)
Portal Vet:   /veterinarian-portal
Portal Tutor: /tutor-portal
```

---

## Troubleshooting

**Problema:** "Não encontrei os dados"
- ✅ Certifique-se de estar logado com a conta correta
- ✅ Verifique se está na clínica certa

**Problema:** "Access denied"
- ✅ Cada tipo de usuário tem URLs específicas
- ✅ Use a URL correta para cada perfil

**Problema:** "Veterinário não consegue criar prescrição"
- ✅ Verifique se há animais cadastrados
- ✅ Verifique se o veterinário está vinculado à clínica

---

## Resumo Visual

```
┌─────────────────────────────────────────────────┐
│              ADMIN DA CLÍNICA                    │
│  ✓ Dashboard completo                           │
│  ✓ Gerenciar tudo                               │
│  ✓ Ver dados de veterinários                    │
│  ✓ Aprovar consultas                            │
└─────────────────────────────────────────────────┘
                    │
                    ├──> Cria e gerencia
                    │
┌─────────────────────────────────────────────────┐
│              VETERINÁRIO                         │
│  ✓ Ver animais da clínica                       │
│  ✓ Criar prontuários                            │
│  ✓ Criar prescrições                            │
│  ✓ Registrar vacinações                         │
└─────────────────────────────────────────────────┘
                    │
                    ├──> Cria dados para
                    │
┌─────────────────────────────────────────────────┐
│              TUTOR                               │
│  ✓ Ver seus animais                             │
│  ✓ Ver histórico médico                         │
│  ✓ Solicitar consultas                          │
│  ✓ Ver prescrições/vacinas                      │
└─────────────────────────────────────────────────┘
```
