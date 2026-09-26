-- Radar del Ecosistema — matches decididos por IA, con explicación.
-- Pega esto entero en Supabase → SQL Editor → Run, en el proyecto GovTech
-- (slqydpopqayafilmdwjh). Va después de radar_respuestas y radar_vistos,
-- y es idempotente igual que aquellas.
--
-- Por qué una tabla aparte y no calcular el match en el navegador: antes
-- se emparejaba por área compartida (checkbox del formulario), sin mirar
-- el texto — así un "obtener datos" y un "despliegue de IA" quedaban
-- unidos solo por llevar los dos la etiqueta "IA y datos", tuvieran o no
-- relación real. Ahora una función en el servidor (Edge Function
-- `radar-match`, disparada por el trigger de más abajo) le pasa el texto
-- de las dos respuestas a un modelo de lenguaje y solo se guarda aquí si
-- de verdad encajan — con una frase explicando por qué. Sin esto no habría
-- forma de que "protección de datos" y "anonimizar documentos" se lean
-- como una relación real y no como una coincidencia de casilla.

create table if not exists radar_matches (
  reto_id uuid primary key references radar_respuestas(id) on delete cascade,
  solucion_id uuid not null unique references radar_respuestas(id) on delete cascade,
  explicacion text not null,
  creado_en timestamptz default now()
);

alter table radar_matches enable row level security;

-- Solo lectura pública — quien escribe aquí es la Edge Function, con la
-- service role key (que salta el RLS), nunca el navegador de un asistente.
drop policy if exists "leer_publico" on radar_matches;
create policy "leer_publico" on radar_matches
  for select to anon using (true);

alter publication supabase_realtime add table radar_matches;

-- El disparador: cada INSERT en radar_respuestas llama a la Edge Function
-- por HTTP (vía pg_net), pasándole la fila nueva. La función decide sola
-- si hay alguna candidata del lado contrario con la que de verdad encaje.
create extension if not exists pg_net;

create or replace function radar_disparar_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://slqydpopqayafilmdwjh.supabase.co/functions/v1/radar-match',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object('record', row_to_json(new))
  );
  return new;
end;
$$;

drop trigger if exists radar_respuestas_match_trigger on radar_respuestas;
create trigger radar_respuestas_match_trigger
  after insert on radar_respuestas
  for each row execute function radar_disparar_match();
