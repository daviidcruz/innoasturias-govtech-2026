-- Radar del Ecosistema — el reto/solución ya no va ligado al perfil.
-- Pega esto entero en Supabase → SQL Editor → Run, en el proyecto GovTech
-- (slqydpopqayafilmdwjh). Es idempotente igual que las anteriores.
--
-- Antes "Administración = reto, todo lo demás = solución" era una regla
-- fija por perfil. Una empresa también puede tener un problema que
-- resolver, así que ahora es la propia persona quien elige, en un paso
-- aparte del formulario ("Busco una solución" / "Tengo una solución"), y
-- eso es lo que decide el lado de cada respuesta — no su perfil.

alter table radar_respuestas add column if not exists tipo text;

-- Backfill de las filas que ya existan (creadas antes de este cambio):
-- se asume la regla vieja, que es la mejor suposición posible sin volver a
-- preguntarle a nadie.
update radar_respuestas
set tipo = case when perfil = 'administracion' then 'reto' else 'solucion' end
where tipo is null;

alter table radar_respuestas alter column tipo set not null;

alter table radar_respuestas drop constraint if exists radar_respuestas_tipo_valores;
alter table radar_respuestas add constraint radar_respuestas_tipo_valores
  check (tipo in ('reto', 'solucion'));
