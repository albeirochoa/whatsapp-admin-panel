# Checklist de Implementación - Fix Duplicados

## Pre-requisitos

- [ ] Acceso a n8n (https://n8n.railway.app o tu instancia)
- [ ] Acceso a PostgreSQL (Railway o tu BD)
- [ ] Backup de la BD antes de cualquier cambio
- [ ] Revisar [FIX-DUPLICACION-CONVERSIONES.md](./FIX-DUPLICACION-CONVERSIONES.md) completo

---

## Fase 1: Análisis (10 min) ⚠️

### 1.1 Verificar duplicados existentes

```sql
-- Conectar a PostgreSQL y ejecutar:
SELECT
  project_id,
  phone_e164,
  COUNT(*) as num_conversiones,
  STRING_AGG(conversion_name, ' → ' ORDER BY ai_label) as evolucion
FROM conversions
GROUP BY project_id, phone_e164
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;
```

- [ ] Ejecutado
- [ ] Duplicados confirmados

### 1.2 Verificar eventos pendientes

```sql
SELECT
  project_id,
  COUNT(*) as eventos_pendientes,
  MIN(ts) as mensaje_mas_antiguo
FROM events
WHERE processed_at IS NULL
  AND event_type IN ('message_in', 'message_out')
GROUP BY project_id;
```

- [ ] Ejecutado
- [ ] Eventos pendientes registrados

---

## Fase 2: Backup (5 min) 🔒

```sql
CREATE TABLE conversions_backup_20251222 AS
SELECT * FROM conversions;

-- Verificar
SELECT COUNT(*) as filas_backup FROM conversions_backup_20251222;
```

- [ ] Backup creado

---

## Fase 3: Implementación (10 min) ✅

1. Desactivar workflow antiguo en n8n
2. Importar `Workflow 3 - AI Classification (FIXED-DEDUPE).json`
3. Verificar credenciales (Postgres, OpenAI, Google Sheets)
4. **ACTIVAR** workflow

- [ ] Workflow activado

---

## Fase 4: Validación (10 min) ✔️

```sql
-- Verificar NO hay duplicados nuevos
SELECT
  project_id,
  phone_e164,
  COUNT(*) as conversiones
FROM conversions
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY project_id, phone_e164
HAVING COUNT(*) > 1;
```

- [ ] ✅ 0 duplicados nuevos
