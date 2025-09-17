-- Esquema base para la tabla de usuarios usada por el backend
-- Ejecuta esto en el SQL Editor de Supabase

create extension if not exists "pgcrypto";

create table if not exists public.usuarios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text not null unique,
  password_hash text,
  rol text not null default 'beneficiario' check (rol in ('admin','tecnico','beneficiario')),
  auth_id uuid, -- si decides relacionarlo con auth.users
  created_at timestamptz not null default now()
);
