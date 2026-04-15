-- Tabla para códigos/tokens de reautenticación (multi-instancia safe)
-- Reemplaza los Maps en memoria de reauthentication.ts que no son serverless-safe.
create table if not exists reauth_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  code        text,           -- código numérico de 6 dígitos (verifyReauthCode)
  token       text,           -- UUID de un solo uso (performSensitiveAction)
  action      text,           -- contexto de la acción sensible
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

create index if not exists reauth_sessions_code_idx on reauth_sessions(code) where code is not null;
create index if not exists reauth_sessions_token_idx on reauth_sessions(token) where token is not null;

-- Solo service role puede acceder; los server actions usan el cliente admin
alter table reauth_sessions enable row level security;
