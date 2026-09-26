-- Radar del Ecosistema — marcador de "ya comentado en directo".
-- Pega esto entero en Supabase → SQL Editor → Run, en el proyecto
-- slqydpopqayafilmdwjh. Va DESPUÉS de las migraciones de radar_respuestas,
-- y es idempotente igual que aquellas: se puede volver a ejecutar sin miedo.
--
-- Qué es: una tabla aparte, no una columna en `radar_respuestas` — esa
-- tabla se dejó explícitamente sin permiso de UPDATE/DELETE para que nadie
-- pueda alterar una respuesta ya enviada (ver 20260904_radar_respuestas.sql).
-- Este marcador vive en su propia tabla, solo con INSERT y SELECT públicos:
-- marcar una tarjeta como "ya comentada" es añadir una fila aquí, nunca
-- tocar la original. Con eso basta para que sea persistente (sobrevive a
-- recargar la pantalla) y compartido entre pantallas si hay más de una
-- abierta a la vez.

create table if not exists radar_vistos (
  respuesta_id uuid primary key references radar_respuestas(id) on delete cascade,
  marcado_en timestamptz default now()
);

alter table radar_vistos enable row level security;

drop policy if exists "insertar_publico" on radar_vistos;
create policy "insertar_publico" on radar_vistos
  for insert to anon with check (true);

drop policy if exists "leer_publico" on radar_vistos;
create policy "leer_publico" on radar_vistos
  for select to anon using (true);

-- Sin esto, si hay dos pantallas abiertas a la vez, una no se entera de que
-- la otra ya marcó una tarjeta como comentada hasta que se recarga.
alter publication supabase_realtime add table radar_vistos;
