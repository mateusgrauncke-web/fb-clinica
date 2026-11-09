-- FB Clínica — tabela de profissionais
-- Execute somente após conferir no Supabase se não existe uma tabela equivalente.
-- RLS é ativado sem policies permissivas: acesso permanece bloqueado até definirmos
-- as regras com base na estrutura real de perfis e funções administrativas.

create table if not exists public.profissionais (
  id uuid primary key default gen_random_uuid(),
  nome_completo text not null,
  registro_profissional text,
  especialidades text[] not null default '{}',
  telefone text,
  email text,
  observacoes text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profissionais_ativo
  on public.profissionais (ativo);

alter table public.profissionais enable row level security;
