# Fix: Duplicación de Conversiones por Número

## Problema Identificado

### 1. Duplicación de conversiones
**Causa raíz:** El `external_attrib_id` incluye el `ai_label` en su cálculo, permitiendo múltiples conversiones por el mismo número.

**Ubicación:**
- [Workflow 3 - AI Classification (FIXED).json:185](../bakkup-20--12-2025/Workflow 3 - AI Classification (FIXED).json#L185)

**Código actual:**
```javascript
const external_attrib_id = `conv-${convo_data.project_id}-${convo_data.phone_e164}-${ai_result.label}`;
```

**Problema:**
Cuando un lead evoluciona de `1` (no_qualified) → `2` (lead_qualified) → `3` (sale_confirmed), genera 3 IDs diferentes:
- `conv-color-tapetes-+573002000001-1`
- `conv-color-tapetes-+573002000001-2`
- `conv-color-tapetes-+573002000001-3`

El `ON CONFLICT (external_attrib_id) DO UPDATE` solo previene duplicados del **mismo label**, pero permite múltiples conversiones para el mismo número.

### 2. Workflow desactivado
**Ubicación:**
- [Workflow 3 - AI Classification (FIXED).json:565](../bakkup-20--12-2025/Workflow 3 - AI Classification (FIXED).json#L565)

```json
"active": false,
```

**Impacto:**
- 313 eventos pendientes en `color-tapetes`
- 7 eventos pendientes en `konversion-web`
- El schedule no está ejecutando el procesamiento

---

## Solución Implementada

### Cambio 1: external_attrib_id SIN ai_label

**Archivo:** `Workflow 3 - AI Classification (FIXED-DEDUPE).json`

**Antes:**
```javascript
const external_attrib_id = `conv-${convo_data.project_id}-${convo_data.phone_e164}-${ai_result.label}`;
```

**Después:**
```javascript
// ============================================
// FIX: external_attrib_id SIN ai_label
// Esto permite UNA sola conversión por número
// que evoluciona de label 1 → 2 → 3
// ============================================
const external_attrib_id = `conv-${convo_data.project_id}-${convo_data.phone_e164}`;
```

### Cambio 2: ON CONFLICT mejorado

**Antes:**
```sql
ON CONFLICT (external_attrib_id) DO UPDATE SET
  ai_label = EXCLUDED.ai_label,
  ai_confidence = EXCLUDED.ai_confidence,
  ai_reason = EXCLUDED.ai_reason,
  conversion_name = EXCLUDED.conversion_name,
  conversion_value = EXCLUDED.conversion_value,
  aggregated_conversation = EXCLUDED.aggregated_conversation,
  message_count = EXCLUDED.message_count,
  last_message_ts = EXCLUDED.last_message_ts,
  updated_at = NOW()
WHERE conversions.ai_label <= EXCLUDED.ai_label
```

**Después:**
```sql
ON CONFLICT (external_attrib_id) DO UPDATE SET
  ai_label = EXCLUDED.ai_label,
  ai_confidence = EXCLUDED.ai_confidence,
  ai_reason = EXCLUDED.ai_reason,
  conversion_name = EXCLUDED.conversion_name,
  conversion_value = EXCLUDED.conversion_value,
  aggregated_conversation = EXCLUDED.aggregated_conversation,
  message_count = EXCLUDED.message_count,
  last_message_ts = EXCLUDED.last_message_ts,
  conversion_time = EXCLUDED.conversion_time,  -- AGREGADO
  updated_at = NOW()
WHERE conversions.ai_label < EXCLUDED.ai_label  -- Cambio: solo si MENOR (permite evolución)
```

**Mejoras:**
- Se actualiza `conversion_time` en cada evolución
- Cambio de `<=` a `<` en la condición WHERE: solo actualiza si el nuevo label es **estrictamente mayor**
- Esto permite que un lead evolucione de 1→2→3 pero **NO permite retroceder ni duplicar**

---

## Comportamiento Esperado

### Escenario 1: Lead nuevo
1. Usuario envía primer mensaje → AI clasifica como `label: 1` (no_qualified)
2. Se crea conversión:
   - `external_attrib_id = "conv-color-tapetes-+573002000001"`
   - `ai_label = 1`
   - `conversion_name = "no_qualified"`

### Escenario 2: Lead evoluciona a calificado
1. Usuario envía más mensajes → AI clasifica como `label: 2` (lead_qualified)
2. Se **actualiza** la conversión existente:
   - `external_attrib_id = "conv-color-tapetes-+573002000001"` (mismo ID)
   - `ai_label = 2` (actualizado)
   - `conversion_name = "lead_qualified"` (actualizado)
   - `conversion_value = 15000` (actualizado)

### Escenario 3: Lead confirma venta
1. Usuario confirma compra → AI clasifica como `label: 3` (sale_confirmed)
2. Se **actualiza** la conversión existente:
   - `external_attrib_id = "conv-color-tapetes-+573002000001"` (mismo ID)
   - `ai_label = 3` (actualizado)
   - `conversion_name = "sale_confirmed"` (actualizado)
   - `conversion_value = 85000` (actualizado)

### Escenario 4: Intento de retroceso (NO permitido)
1. Usuario envía mensaje sin interés → AI clasifica como `label: 1`
2. NO se actualiza porque `WHERE conversions.ai_label < EXCLUDED.ai_label` falla:
   - `3 < 1` es `false`
   - La conversión permanece en `label: 3` (sale_confirmed)

---

## Pasos de Implementación

### 1. Importar workflow corregido en n8n

1. Ir a n8n → Workflows
2. Desactivar "Workflow 3 - AI Classification (FIXED)"
3. Importar `Workflow 3 - AI Classification (FIXED-DEDUPE).json`
4. Verificar credenciales:
   - Postgres account
   - OpenAi_Leadsignal
   - Google Sheets account
5. **ACTIVAR** el workflow

### 2. Limpiar duplicados existentes (OPCIONAL)

Si quieres limpiar los duplicados históricos en la BD:

```sql
-- Ver duplicados actuales
SELECT
  project_id,
  phone_e164,
  COUNT(*) as conversiones,
  STRING_AGG(conversion_name, ', ' ORDER BY ai_label) as labels
FROM conversions
GROUP BY project_id, phone_e164
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- Estrategia de limpieza: Mantener solo la conversión con el ai_label MÁS ALTO
WITH ranked_conversions AS (
  SELECT
    conversion_id,
    project_id,
    phone_e164,
    ai_label,
    ROW_NUMBER() OVER (
      PARTITION BY project_id, phone_e164
      ORDER BY ai_label DESC, created_at DESC
    ) as rn
  FROM conversions
)
DELETE FROM conversions
WHERE conversion_id IN (
  SELECT conversion_id
  FROM ranked_conversions
  WHERE rn > 1
)
RETURNING conversion_id, phone_e164, ai_label;
```

**Importante:** Este DELETE es **irreversible**. Recomiendo hacer un backup antes:

```sql
-- Backup de duplicados antes de eliminar
CREATE TABLE conversions_backup_20251222 AS
SELECT * FROM conversions;
```

### 3. Procesar eventos pendientes

Una vez activado el workflow corregido:

1. Esperar 5 minutos (schedule automático)
2. O ejecutar manualmente desde n8n:
   - Click en "Test workflow" → "Execute Workflow"
   - Verificar en logs que procesa los 313 eventos de color-tapetes

3. Monitorear progreso en PostgreSQL:

```sql
-- Ver eventos pendientes por proyecto
SELECT
  project_id,
  COUNT(*) as pendientes
FROM events
WHERE processed_at IS NULL
  AND event_type IN ('message_in', 'message_out')
GROUP BY project_id;

-- Ver conversiones creadas/actualizadas hoy
SELECT
  project_id,
  phone_e164,
  ai_label,
  conversion_name,
  conversion_value,
  created_at,
  updated_at
FROM conversions
WHERE DATE(created_at) = CURRENT_DATE
   OR DATE(updated_at) = CURRENT_DATE
ORDER BY updated_at DESC;
```

---

## Validación Final

### Test 1: Verificar que no hay duplicados nuevos

```sql
-- Debe retornar 0 filas si no hay duplicados
SELECT
  project_id,
  phone_e164,
  COUNT(*) as conversiones
FROM conversions
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY project_id, phone_e164
HAVING COUNT(*) > 1;
```

### Test 2: Verificar evolución de labels

```sql
-- Ver historial de actualizaciones
SELECT
  phone_e164,
  ai_label,
  conversion_name,
  conversion_value,
  created_at,
  updated_at,
  (updated_at - created_at) as tiempo_evolucion
FROM conversions
WHERE updated_at > created_at  -- Solo conversiones actualizadas
ORDER BY updated_at DESC
LIMIT 20;
```

### Test 3: Verificar eventos procesados

```sql
-- No debe haber eventos viejos sin procesar
SELECT
  project_id,
  COUNT(*) as pendientes,
  MIN(ts) as mensaje_mas_antiguo
FROM events
WHERE processed_at IS NULL
  AND event_type IN ('message_in', 'message_out')
  AND ts < NOW() - INTERVAL '1 hour'
GROUP BY project_id;
```

---

## Impacto en Google Ads

### Antes (con duplicados)
```csv
gclid,conversion_name,conversion_time,conversion_value
CjwKCAiA...,no_qualified,2025-12-20 10:00:00,0
CjwKCAiA...,lead_qualified,2025-12-20 11:30:00,15000
CjwKCAiA...,sale_confirmed,2025-12-20 14:00:00,85000
```
→ Google Ads cuenta **3 conversiones** por el mismo usuario ($100,000 total inflado)

### Después (sin duplicados)
```csv
gclid,conversion_name,conversion_time,conversion_value
CjwKCAiA...,sale_confirmed,2025-12-20 14:00:00,85000
```
→ Google Ads cuenta **1 conversión** por usuario ($85,000 correcto)

**Nota:** El `conversion_name` cambia según la evolución, pero Google Ads puede configurarse para que solo importe el valor final si usas el mismo "Conversion Action" para todos los labels.

---

## Alternativa: Múltiples conversiones por tipo

Si en el futuro quieres permitir que un usuario tenga **múltiples conversiones de diferentes tipos** (ej: un usuario puede ser `lead_qualified` Y `sale_confirmed` simultáneamente), puedes volver al esquema anterior con `conversion_name` en el ID:

```javascript
const external_attrib_id = `conv-${convo_data.project_id}-${convo_data.phone_e164}-${conversion_config.name}`;
```

Y cambiar el UPDATE a:
```sql
ON CONFLICT (external_attrib_id) DO NOTHING
```

Esto permitiría:
- `conv-color-tapetes-+573002000001-lead_qualified`
- `conv-color-tapetes-+573002000001-sale_confirmed`

Pero asegúrate de que los `conversion_config` no se solapen (ej: label 1→no_qualified, label 2→lead_qualified, label 3→sale_confirmed deben tener nombres únicos).

---

## Resumen de Cambios

| Aspecto | Antes | Después |
|---------|-------|---------|
| **external_attrib_id** | `conv-{project}-{phone}-{label}` | `conv-{project}-{phone}` |
| **Duplicados por número** | Sí (uno por label) | No (uno por número) |
| **Evolución de label** | Crea nueva fila | Actualiza fila existente |
| **Condición UPDATE** | `ai_label <= EXCLUDED` | `ai_label < EXCLUDED` |
| **Retroceso de label** | Permitido | Bloqueado |
| **Workflow activo** | ❌ `false` | ✅ Debes activarlo manualmente |

---

## Checklist

- [ ] Importar `Workflow 3 - AI Classification (FIXED-DEDUPE).json` en n8n
- [ ] Verificar credenciales (Postgres, OpenAI, Google Sheets)
- [ ] **ACTIVAR** el workflow
- [ ] (Opcional) Backup de tabla `conversions`
- [ ] (Opcional) Ejecutar script de limpieza de duplicados
- [ ] Ejecutar workflow manualmente o esperar 5 min
- [ ] Verificar que los 313 eventos se procesan
- [ ] Ejecutar queries de validación (Test 1, 2, 3)
- [ ] Monitorear logs de n8n por errores
- [ ] Actualizar [ARQUITECTURA.md](../whatsapp-admin-panel/ARQUITECTURA.md) con estos cambios

---

## Próximos Pasos

1. **Workflow 0 (Sync Panel → n8n):** Crear el webhook para sincronizar configuración desde Firebase Admin Panel hacia PostgreSQL `clients_config`.

2. **Monitoring:** Agregar alertas en n8n si el workflow falla o si hay eventos sin procesar por más de 1 hora.

3. **Google Ads Integration:** Script para exportar conversiones a CSV y importar a Google Ads Offline Conversions.
