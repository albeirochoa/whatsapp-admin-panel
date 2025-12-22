-- ============================================
-- Fix: Duplicación de Conversiones
-- Fecha: 2025-12-22
-- ============================================
-- Este script ayuda a limpiar duplicados
-- y validar que el fix funciona correctamente
-- ============================================

-- ============================================
-- PASO 1: ANÁLISIS (Safe - Solo lectura)
-- ============================================

-- 1.1 Ver duplicados actuales por proyecto
SELECT
  project_id,
  phone_e164,
  COUNT(*) as num_conversiones,
  STRING_AGG(conversion_name, ' → ' ORDER BY ai_label) as evolucion,
  STRING_AGG(ai_label::text, ' → ' ORDER BY ai_label) as labels,
  SUM(conversion_value) as valor_total_inflado,
  MAX(conversion_value) as valor_real
FROM conversions
GROUP BY project_id, phone_e164
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC, project_id;

-- 1.2 Estadísticas por proyecto
SELECT
  project_id,
  COUNT(DISTINCT phone_e164) as numeros_unicos,
  COUNT(*) as total_conversiones,
  COUNT(*) - COUNT(DISTINCT phone_e164) as duplicados,
  ROUND(
    100.0 * (COUNT(*) - COUNT(DISTINCT phone_e164)) / COUNT(*),
    2
  ) as porcentaje_duplicados
FROM conversions
GROUP BY project_id
ORDER BY porcentaje_duplicados DESC;

-- 1.3 Ver eventos pendientes de procesamiento
SELECT
  project_id,
  COUNT(*) as eventos_pendientes,
  MIN(ts) as mensaje_mas_antiguo,
  MAX(ts) as mensaje_mas_reciente,
  EXTRACT(EPOCH FROM (NOW() - MIN(ts))) / 3600 as horas_esperando
FROM events
WHERE processed_at IS NULL
  AND event_type IN ('message_in', 'message_out')
GROUP BY project_id
ORDER BY eventos_pendientes DESC;

-- ============================================
-- PASO 2: BACKUP (Safe - Crear copia)
-- ============================================

-- 2.1 Crear backup completo de conversions
CREATE TABLE IF NOT EXISTS conversions_backup_20251222 AS
SELECT * FROM conversions;

-- 2.2 Verificar backup
SELECT
  'Original' as tabla,
  COUNT(*) as filas
FROM conversions
UNION ALL
SELECT
  'Backup' as tabla,
  COUNT(*) as filas
FROM conversions_backup_20251222;

-- ============================================
-- PASO 3: LIMPIEZA (DESTRUCTIVO - Leer antes)
-- ============================================

-- 3.1 PREVIEW: Ver qué se eliminará (NO elimina nada)
WITH ranked_conversions AS (
  SELECT
    conversion_id,
    project_id,
    phone_e164,
    ai_label,
    conversion_name,
    conversion_value,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY project_id, phone_e164
      ORDER BY ai_label DESC, created_at DESC
    ) as rn
  FROM conversions
)
SELECT
  project_id,
  phone_e164,
  ai_label,
  conversion_name,
  conversion_value,
  CASE WHEN rn = 1 THEN '✅ MANTENER' ELSE '❌ ELIMINAR' END as accion
FROM ranked_conversions
WHERE (project_id, phone_e164) IN (
  SELECT project_id, phone_e164
  FROM conversions
  GROUP BY project_id, phone_e164
  HAVING COUNT(*) > 1
)
ORDER BY project_id, phone_e164, ai_label DESC;

-- 3.2 ELIMINAR duplicados (IRREVERSIBLE - ejecutar solo después de revisar 3.1)
-- ADVERTENCIA: Este DELETE es permanente. Asegúrate de haber hecho backup.
--
-- WITH ranked_conversions AS (
--   SELECT
--     conversion_id,
--     project_id,
--     phone_e164,
--     ai_label,
--     ROW_NUMBER() OVER (
--       PARTITION BY project_id, phone_e164
--       ORDER BY ai_label DESC, created_at DESC
--     ) as rn
--   FROM conversions
-- )
-- DELETE FROM conversions
-- WHERE conversion_id IN (
--   SELECT conversion_id
--   FROM ranked_conversions
--   WHERE rn > 1
-- )
-- RETURNING conversion_id, project_id, phone_e164, ai_label;

-- ============================================
-- PASO 4: VALIDACIÓN (Safe - Solo lectura)
-- ============================================

-- 4.1 Verificar que NO hay duplicados nuevos (última hora)
SELECT
  project_id,
  phone_e164,
  COUNT(*) as conversiones,
  STRING_AGG(conversion_name, ', ' ORDER BY ai_label) as nombres
FROM conversions
WHERE created_at > NOW() - INTERVAL '1 hour'
   OR updated_at > NOW() - INTERVAL '1 hour'
GROUP BY project_id, phone_e164
HAVING COUNT(*) > 1;
-- Debe retornar 0 filas ✅

-- 4.2 Verificar evolución de labels (conversiones actualizadas)
SELECT
  project_id,
  phone_e164,
  ai_label,
  conversion_name,
  conversion_value,
  created_at,
  updated_at,
  EXTRACT(EPOCH FROM (updated_at - created_at)) / 60 as minutos_evolucion
FROM conversions
WHERE updated_at > created_at  -- Solo conversiones actualizadas
  AND updated_at > NOW() - INTERVAL '24 hours'
ORDER BY updated_at DESC
LIMIT 20;

-- 4.3 Verificar que eventos se están procesando
SELECT
  project_id,
  COUNT(*) as procesados_ultima_hora
FROM events
WHERE processed_at > NOW() - INTERVAL '1 hour'
  AND event_type IN ('message_in', 'message_out')
GROUP BY project_id
ORDER BY procesados_ultima_hora DESC;

-- 4.4 Verificar conversiones por label
SELECT
  project_id,
  ai_label,
  CASE
    WHEN ai_label = 1 THEN 'No Calificado'
    WHEN ai_label = 2 THEN 'Lead Calificado'
    WHEN ai_label = 3 THEN 'Venta Confirmada'
    ELSE 'Unknown'
  END as label_text,
  COUNT(*) as cantidad,
  SUM(conversion_value) as valor_total,
  ROUND(AVG(conversion_value), 2) as valor_promedio
FROM conversions
GROUP BY project_id, ai_label
ORDER BY project_id, ai_label;

-- ============================================
-- PASO 5: MONITOREO (Safe - Solo lectura)
-- ============================================

-- 5.1 Dashboard de conversiones (últimas 24h)
SELECT
  DATE_TRUNC('hour', created_at) as hora,
  project_id,
  COUNT(*) as conversiones_creadas,
  COUNT(CASE WHEN updated_at > created_at THEN 1 END) as conversiones_actualizadas
FROM conversions
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), project_id
ORDER BY hora DESC, project_id;

-- 5.2 Verificar atribución
SELECT
  attribution_method,
  COUNT(*) as cantidad,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as porcentaje
FROM conversions
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY attribution_method
ORDER BY cantidad DESC;

-- 5.3 Top conversiones por valor
SELECT
  project_id,
  phone_e164,
  conversion_name,
  conversion_value,
  ai_confidence,
  click_id IS NOT NULL as tiene_click,
  created_at,
  updated_at
FROM conversions
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY conversion_value DESC
LIMIT 20;

-- ============================================
-- PASO 6: ROLLBACK (Emergencia)
-- ============================================

-- 6.1 SOLO usar si algo salió mal - Restaurar desde backup
-- ADVERTENCIA: Esto elimina TODAS las conversiones actuales
--              y las reemplaza con el backup
--
-- BEGIN;
--
-- -- Eliminar tabla actual
-- DROP TABLE IF EXISTS conversions_corrupted;
-- ALTER TABLE conversions RENAME TO conversions_corrupted;
--
-- -- Restaurar backup
-- CREATE TABLE conversions AS
-- SELECT * FROM conversions_backup_20251222;
--
-- -- Recrear índices y constraints (ajustar según tu schema)
-- ALTER TABLE conversions ADD PRIMARY KEY (conversion_id);
-- CREATE UNIQUE INDEX idx_conversions_external_attrib ON conversions (external_attrib_id);
--
-- COMMIT;

-- ============================================
-- NOTAS DE USO
-- ============================================
-- 1. Ejecuta PASO 1 (Análisis) primero para ver el estado actual
-- 2. Ejecuta PASO 2 (Backup) ANTES de cualquier eliminación
-- 3. Ejecuta PASO 3.1 (Preview) para ver qué se eliminará
-- 4. Solo entonces ejecuta PASO 3.2 (Limpieza) - DESCOMENTA PRIMERO
-- 5. Ejecuta PASO 4 (Validación) después de la limpieza
-- 6. Usa PASO 5 (Monitoreo) para seguimiento continuo
-- 7. PASO 6 (Rollback) solo en emergencia
-- ============================================
