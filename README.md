# Sistema de Gestão Veterinária - VetHub

Sistema completo de gestão para clínicas veterinárias com três níveis de acesso: Administrador, Veterinário e Tutor.

## Funcionalidades Principais

### Para Administradores (Donos de Clínica)
- Dashboard completo com estatísticas em tempo real
- Gerenciamento de veterinários
- Gerenciamento de tutores e animais
- Visualização de todos os dados médicos (prontuários, prescrições, vacinações)
- Aprovação de solicitações de consulta
- Gestão completa da clínica

### Para Veterinários
- Visualização de animais da clínica
- Criação de prontuários médicos
- Emissão de prescrições
- Registro de vacinações
- Edição de informações dos animais

### Para Tutores
- Visualização de seus animais
- Solicitação de consultas
- Acesso ao histórico médico completo dos pets
- Visualização de prescrições e vacinações

## Tecnologias

- **Frontend:** React 18 + TypeScript + Vite
- **Estilização:** Tailwind CSS
- **Banco de Dados:** Supabase (PostgreSQL)
- **Autenticação:** Supabase Auth
- **Ícones:** Lucide React

## Como Executar

### Pré-requisitos
- Node.js 18+
- Conta no Supabase

### Instalação

1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd <nome-do-projeto>
```

2. Instale as dependências
```bash
npm install
```

3. Configure as variáveis de ambiente
```bash
# Renomeie .env.example para .env e preencha:
VITE_SUPABASE_URL=sua-url-do-supabase
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

4. Execute as migrações do banco de dados
- Acesse o Supabase SQL Editor
- Execute todos os arquivos em `supabase/migrations/` em ordem

5. Inicie o servidor de desenvolvimento
```bash
npm run dev
```

6. Acesse `http://localhost:5173`

## Perfis de Teste

Consulte os arquivos para instruções detalhadas:
- **QUICK_TEST_GUIDE.md** - Guia rápido de teste em 5 minutos
- **PERFIS_DE_TESTE.md** - Documentação completa dos perfis

### Credenciais Rápidas

```
ADMIN:
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

## Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── layouts/        # Layouts (AuthenticatedLayout, PublicLayout)
│   └── [modais]        # Modais de formulários
├── contexts/           # Context API (AuthContext)
├── lib/                # Configurações (Supabase)
├── pages/              # Páginas da aplicação
├── types/              # TypeScript types
└── main.tsx           # Entry point

supabase/
├── functions/          # Edge Functions
└── migrations/         # Migrações do banco de dados
```

## Segurança

O sistema implementa Row Level Security (RLS) em todas as tabelas:
- Isolamento completo entre clínicas
- Veterinários só veem dados da própria clínica
- Tutores só veem dados dos próprios animais
- Administradores têm acesso completo aos dados da clínica

## Build para Produção

```bash
npm run build
npm run preview
```

## Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run preview      # Preview do build
npm run lint         # Linter
npm run typecheck    # Verificação de tipos
```

## Arquitetura de Dados

### Principais Entidades
- **Clinics:** Clínicas veterinárias
- **Veterinarians:** Veterinários vinculados às clínicas
- **Tutors:** Tutores/donos dos animais
- **Animals:** Animais cadastrados
- **Medical Records:** Prontuários médicos
- **Prescriptions:** Prescrições médicas
- **Vaccinations:** Registro de vacinações
- **Appointments:** Agendamentos de consultas

### Fluxo de Dados
1. Admin cria a clínica ao fazer signup
2. Admin adiciona veterinários à clínica
3. Admin ou veterinários adicionam tutores e animais
4. Veterinários criam prontuários, prescrições e vacinações
5. Admin vê TODOS os dados criados
6. Tutores veem apenas dados de seus animais

## Suporte

Para questões e suporte, consulte a documentação nos arquivos:
- **QUICK_TEST_GUIDE.md** - Guia rápido
- **PERFIS_DE_TESTE.md** - Documentação completa
- **supabase/seed.sql** - Queries úteis para verificação

## Licença

MIT
