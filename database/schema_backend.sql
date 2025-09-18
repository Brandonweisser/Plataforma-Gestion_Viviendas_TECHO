-- Esquema compatible con el backend actual (uid entero y roles en español)
create extension if not exists "pgcrypto";

create table if not exists public.usuarios (
  uid integer primary key,
  nombre text not null,
  email text not null unique,
  password_hash text,
  "contraseña" text, -- columna legacy opcional para migración
  rol text not null check (rol in ('administrador','tecnico','beneficiario')),
  created_at timestamptz not null default now()
);

-- Índices útiles
create index if not exists idx_usuarios_email on public.usuarios (email);
create index if not exists idx_usuarios_rol on public.usuarios (rol);

-- Nota: el backend calcula el próximo uid como (max(uid)+1). Asegúrate de insertar el primer registro con uid=1 si la tabla está vacía.
