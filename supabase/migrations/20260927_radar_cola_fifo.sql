-- Radar del Ecosistema — cola FIFO con un único trabajador a la vez.
-- Pega esto entero en Supabase → SQL Editor → Run, en el proyecto GovTech
-- (slqydpopqayafilmdwjh). Es idempotente igual que las anteriores.
--
-- Antes, cada envío disparaba su propia llamada a Groq en paralelo con
-- todas las demás — probado en directo: con 70 envíos casi a la vez,
-- muchas llamadas competían por el mismo cupo de tokens/minuto y se
-- quedaban sin cupo pese a reintentar varias veces. Se descartó la idea de
-- un "plan B" por palabras clave (no puede explicar el porqué del match,
-- y la presentadora del evento necesita esa frase). En su lugar: cada
-- envío se limita a APUNTARSE en la cola (marcando `procesado_en`), y solo
-- un proceso a la vez llama a Groq, en estricto orden de llegada — así
-- nunca hay dos llamadas compitiendo por el mismo cupo, y mientras se
-- resuelve una, las siguientes esperan su turno sin problema.

alter table radar_respuestas add column if not exists procesado_en timestamptz;

-- Las respuestas que ya existieran antes de este cambio se dan por
-- procesadas (se gestionaron con el sistema anterior) para que la cola
-- nueva no intente reevaluarlas.
update radar_respuestas set procesado_en = creado_en where procesado_en is null;

-- Turno único: solo puede haber un "trabajador" llamando a Groq a la vez.
-- Una sola fila hace de testigo — quien consigue marcarla como ocupada es
-- quien tiene el turno; el resto de invocaciones concurrentes salen sin
-- hacer nada, confiando en que quien tiene el turno vaciará la cola.
create table if not exists radar_turno (
  id int primary key default 1,
  ocupado_en timestamptz,
  check (id = 1)
);
insert into radar_turno (id, ocupado_en) values (1, null)
  on conflict (id) do nothing;

-- Coge el turno si está libre, o si lleva "atascado" más de 3 minutos (por
-- si una invocación anterior murió a medias sin liberarlo) — sin ese
-- margen, un fallo dejaría la cola bloqueada para siempre.
create or replace function radar_tomar_turno()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  conseguido boolean;
begin
  update radar_turno
  set ocupado_en = now()
  where id = 1
    and (ocupado_en is null or ocupado_en < now() - interval '3 minutes')
  returning true into conseguido;

  return coalesce(conseguido, false);
end;
$$;

create or replace function radar_liberar_turno()
returns void
language sql
security definer
set search_path = public
as $$
  update radar_turno set ocupado_en = null where id = 1;
$$;

-- Reclama la respuesta más antigua sin procesar (orden real de llegada) de
-- forma atómica — "for update skip locked" evita que dos llamadas se
-- lleven la misma fila si coincidieran.
create or replace function radar_reclamar_siguiente()
returns radar_respuestas
language plpgsql
security definer
set search_path = public
as $$
declare
  fila radar_respuestas;
begin
  select r.* into fila
  from radar_respuestas r
  where r.procesado_en is null
  order by r.creado_en asc
  limit 1
  for update skip locked;

  if fila.id is not null then
    update radar_respuestas set procesado_en = now() where id = fila.id;
  end if;

  return fila;
end;
$$;

grant execute on function radar_tomar_turno() to service_role, anon, authenticated;
grant execute on function radar_liberar_turno() to service_role, anon, authenticated;
grant execute on function radar_reclamar_siguiente() to service_role, anon, authenticated;

-- Red de seguridad: si nadie más envía nada, la cola no debería quedarse
-- con respuestas sin procesar esperando a que llegue una nueva para
-- "despertarla" — un aviso cada minuto la vacía igualmente, aunque tarde
-- algo más que si hubiera envíos seguidos.
create extension if not exists pg_cron;

select cron.schedule(
  'radar-cola-tick',
  '* * * * *',
  $$
    select net.http_post(
      url := 'https://slqydpopqayafilmdwjh.supabase.co/functions/v1/radar-match',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    );
  $$
);
