-- Radar del Ecosistema — áreas múltiples y catálogo ampliado.
-- Pega esto entero en Supabase → SQL Editor → Run, en el proyecto
-- slqydpopqayafilmdwjh. Va DESPUÉS de 20260904_radar_respuestas.sql, y es
-- idempotente igual que aquella: se puede volver a ejecutar sin miedo.
--
-- Qué cambia: `area` (una sola, texto) pasa a ser `areas` (varias, array de
-- texto) — el formulario ahora deja marcar más de un área por respuesta, y
-- el catálogo crece de 6 a 9 valores. Las filas que ya existan con `area`
-- se migran solas a `areas` con ese único valor dentro.

alter table radar_respuestas add column if not exists areas text[];

update radar_respuestas
set areas = array[area]
where areas is null and area is not null;

alter table radar_respuestas alter column areas set default '{}';
update radar_respuestas set areas = '{}' where areas is null;
alter table radar_respuestas alter column areas set not null;

alter table radar_respuestas drop constraint if exists radar_respuestas_area_check;
alter table radar_respuestas drop column if exists area;

alter table radar_respuestas drop constraint if exists radar_respuestas_areas_valores;
alter table radar_respuestas add constraint radar_respuestas_areas_valores
  check (areas <@ array[
    'ia_datos', 'atencion_ciudadana', 'movilidad', 'ciberseguridad',
    'tramites_administrativos', 'sostenibilidad', 'educacion',
    'transparencia', 'otros'
  ]::text[]);

alter table radar_respuestas drop constraint if exists radar_respuestas_areas_no_vacio;
alter table radar_respuestas add constraint radar_respuestas_areas_no_vacio
  check (array_length(areas, 1) > 0);
