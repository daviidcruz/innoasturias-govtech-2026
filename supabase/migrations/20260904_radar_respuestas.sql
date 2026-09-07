-- Radar del Ecosistema GovTech Asturias
-- Pega esto entero en Supabase → SQL Editor → Run, en el proyecto
-- slqydpopqayafilmdwjh. Es idempotente: si algo ya existe, lo salta en vez
-- de fallar, así que se puede volver a ejecutar sin miedo.

create extension if not exists "pgcrypto";

create table if not exists radar_respuestas (
  id uuid primary key default gen_random_uuid(),
  creado_en timestamptz default now(),
  perfil text not null check (perfil in ('administracion', 'empresa', 'startup', 'universidad')),
  organizacion text,
  visible boolean not null default false,
  necesidad_oferta text not null,
  area text not null check (area in (
    'ia_datos', 'atencion_ciudadana', 'movilidad',
    'ciberseguridad', 'tramites_administrativos', 'otros'
  ))
);

alter table radar_respuestas enable row level security;

drop policy if exists "insertar_publico" on radar_respuestas;
create policy "insertar_publico" on radar_respuestas
  for insert to anon with check (true);

drop policy if exists "leer_publico" on radar_respuestas;
create policy "leer_publico" on radar_respuestas
  for select to anon using (true);

-- Sin esto, /radar/pantalla no recibe los INSERT en vivo: Realtime sólo
-- empuja cambios de las tablas que están explícitamente en esta publicación.
alter publication supabase_realtime add table radar_respuestas;
