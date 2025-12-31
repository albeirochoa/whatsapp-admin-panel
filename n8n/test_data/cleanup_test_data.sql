-- ============================================
-- LIMPIAR DATOS DE PRUEBA
-- ============================================
-- Este script elimina todos los datos de prueba
-- para empezar con un slate limpio
-- ============================================

-- Mostrar cuántos registros se van a borrar
SELECT 'Eventos a borrar:' as tipo, COUNT(*) as cantidad
FROM events WHERE project_id = 'test-color-tapetes'
UNION ALL
SELECT 'Conversiones a borrar:', COUNT(*)
FROM conversions WHERE project_id = 'test-color-tapetes';

-- Borrar conversiones de prueba
DELETE FROM conversions
WHERE project_id = 'test-color-tapetes';

-- Borrar eventos de prueba
DELETE FROM events
WHERE project_id = 'test-color-tapetes';

-- Verificar que se borraron
SELECT 'Eventos restantes:' as tipo, COUNT(*) as cantidad
FROM events WHERE project_id = 'test-color-tapetes'
UNION ALL
SELECT 'Conversiones restantes:', COUNT(*)
FROM conversions WHERE project_id = 'test-color-tapetes';

-- Nota: La configuración del cliente (clients_config) NO se borra
-- para que puedas seguir haciendo pruebas
