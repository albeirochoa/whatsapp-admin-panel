# Guía de Pruebas Enhanced - Sistema WhatsApp Admin Panel

## 🎯 Objetivo

Probar el sistema completo con las nuevas funcionalidades:
- ✅ Extracción de email desde mensajes
- ✅ Captura de nombre desde yCloud (fromName, profileName, contact.name, profile.name)
- ✅ Cálculo de SHA-256 para Enhanced Conversions (Google Ads)
- ✅ Atribución persistente con tabla `lead_attribution`
- ✅ Cache de clasificaciones para evitar re-procesar

---

## 📦 Archivos de Prueba

### Nuevos (Enhanced)
- **`ycloud_enhanced_test_data.json`**: 14 mensajes inbound con emails y nombres
- **`ycloud_outbound_enhanced_test_data.json`**: 14 respuestas del agente
- **`test_enhanced.ps1`**: Script de ejecución automatizada

### Originales (Básicos)
- **`click_test_data.json`**: 10 eventos de click
- **`ycloud_inbound_test_data.json`**: 10 mensajes básicos
- **`ycloud_outbound_test_data.json`**: 10 respuestas básicas
- **`test_workflows.ps1`**: Script original

---

## 🚀 Ejecución de Pruebas

### Opción 1: Test Enhanced (Recomendado)

```powershell
cd n8n/test_data
powershell -ExecutionPolicy Bypass -File test_enhanced.ps1
```

**Casos de prueba incluidos:**

| Cliente | Teléfono | Email | Nombre | Hash | Tipo | Esperado |
|---------|----------|-------|--------|------|------|----------|
| C1 | +573002000001 | maria.gonzalez@gmail.com | María González | #AAA01 | Multi-mensaje | Atribución persistente |
| C2 | +573002000002 | carlos.ruiz@hotmail.com | Carlos Ruiz | #BBB02 | Venta | Sale Confirmed |
| C3 | +573002000003 | ana.martinez@yahoo.com | Ana Martínez | - | Orgánico | Organic attribution |
| C4 | +573002000004 | pedro.lopez@empresa.com.co | Pedro López | - | Lead | Lead Qualified |
| C5 | +573002000005 | laura.sanchez@outlook.com | Laura Sánchez | #CCC05 | Cache test | Reutilizar clasificación |
| C6 | +573002000006 | - | Roberto Díaz | - | Solo nombre | No email SHA-256 |
| C7 | +573002000007 | sofia.ramirez@gmail.com | Sofía Ramírez | #DDD07 | Queja | No Qualified |
| C8 | +573002000008 | andres.torres@company.co | Andrés Torres | #EEE08 | Venta $850K | Sale Confirmed |
| C9 | +573002000009 | juliana.castro@mail.com | Juliana Castro | - | Consulta | No Qualified |
| C10 | +573002000010 | diego.morales@corp.com | Diego Morales | - | Corporativo | Lead Qualified |

### Opción 2: Test Básico

```powershell
cd n8n
powershell -ExecutionPolicy Bypass -File test_workflows.ps1
```

---

## 🔍 Verificación de Resultados

### 1. Verificar Extracción de Email/Nombre

```sql
-- Ver emails y nombres extraídos
SELECT 
  phone_e164,
  payload_raw->>'extracted_email' as email,
  payload_raw->>'extracted_name' as nombre,
  message_text,
  created_at
FROM events
WHERE project_id = 'test-color-tapetes'
  AND event_type = 'message_in'
  AND created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC;
```

**Resultado esperado:** 10 filas con emails y nombres extraídos

### 2. Verificar Atribución Persistente

```sql
-- Ver tabla lead_attribution
SELECT 
  phone_e164,
  click_id_hash,
  first_click_ts,
  last_message_ts,
  expires_at
FROM lead_attribution
WHERE project_id = 'test-color-tapetes'
ORDER BY last_message_ts DESC;
```

**Resultado esperado:** 
- C1 (+573002000001): Hash AAA01 persistido
- C2 (+573002000002): Hash BBB02 persistido
- C5 (+573002000005): Hash CCC05 persistido
- C7 (+573002000007): Hash DDD07 persistido
- C8 (+573002000008): Hash EEE08 persistido

### 3. Ejecutar Workflow 3 (AI Classification)

**Opción A: Manual en n8n UI**
1. Ir a n8n → Workflow 3
2. Click en "Execute Workflow"
3. Esperar ~30-60 segundos

**Opción B: Esperar cron (5 minutos)**

### 4. Verificar Conversiones con SHA-256

```sql
-- Ver conversiones con Enhanced Conversions
SELECT 
  phone_e164,
  lead_email,
  lead_name,
  email_sha256,
  phone_sha256,
  conversion_name,
  conversion_value,
  attribution_method,
  ai_confidence
FROM conversions
WHERE project_id = 'test-color-tapetes'
  AND created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC;
```

**Verificar:**
- ✅ `email_sha256` calculado para clientes con email
- ✅ `phone_sha256` calculado para todos
- ✅ `lead_email` y `lead_name` poblados
- ✅ `attribution_method` = 'click_id_hash_match' para C1, C2, C5, C7, C8
- ✅ `attribution_method` = 'organic' para C3, C4, C6, C9, C10

### 5. Verificar Cache de Clasificaciones

```sql
-- Buscar conversiones duplicadas (mismo phone + last_message_ts + message_count)
SELECT 
  phone_e164,
  last_message_ts,
  message_count,
  COUNT(*) as veces_clasificado
FROM conversions
WHERE project_id = 'test-color-tapetes'
GROUP BY phone_e164, last_message_ts, message_count
HAVING COUNT(*) > 1;
```

**Resultado esperado:** 0 filas (cache funciona, no re-clasifica)

### 6. Verificar Google Sheets

**Sheet: `conversions`**

Verificar que existan estas columnas:
- `lead_name`
- `email_sha256`
- `phone_sha256`

Y que contengan datos para los 10 clientes.

---

## 🧪 Casos de Prueba Específicos

### Test 1: Atribución Persistente (C1 - María)

**Flujo:**
1. Click con hash AAA01
2. Mensaje 1: "Ref: #AAA01" (hash en texto)
3. Mensaje 2: "¿Cuánto cuesta envío?" (SIN hash)

**Verificar:**
```sql
SELECT 
  e.message_text,
  e.click_id_hash,
  la.click_id_hash as stored_hash
FROM events e
LEFT JOIN lead_attribution la ON e.project_id = la.project_id AND e.phone_e164 = la.phone_e164
WHERE e.phone_e164 = '+573002000001'
  AND e.event_type = 'message_in'
ORDER BY e.ts;
```

**Esperado:**
- Mensaje 1: `click_id_hash = 'AAA01'` (del texto)
- Mensaje 2: `click_id_hash = NULL` (no en texto), pero `stored_hash = 'AAA01'`

### Test 2: Cache de Clasificaciones (C5 - Laura)

**Flujo:**
1. Mensaje 1: "Oferta #CCC05 disponible?"
2. Respuesta agente
3. Mensaje 2: "Gracias por la info!"
4. Respuesta agente

**Ejecutar Workflow 3 DOS VECES**

**Verificar:**
```sql
SELECT 
  phone_e164,
  message_count,
  last_message_ts,
  ai_label,
  created_at
FROM conversions
WHERE phone_e164 = '+573002000005'
ORDER BY created_at;
```

**Esperado:** 
- Solo 1 fila por combinación (phone + message_count + last_message_ts)
- Segunda ejecución reutiliza cache (no crea nueva fila)

### Test 3: Enhanced Conversions SHA-256

**Verificar cálculo correcto:**

```sql
SELECT 
  lead_email,
  email_sha256,
  phone_e164,
  phone_sha256
FROM conversions
WHERE lead_email = 'maria.gonzalez@gmail.com';
```

**Calcular manualmente (Python):**
```python
import hashlib
email = "maria.gonzalez@gmail.com"
phone = "+573002000001"
print("Email SHA-256:", hashlib.sha256(email.encode()).hexdigest())
print("Phone SHA-256:", hashlib.sha256(phone.encode()).hexdigest())
```

**Comparar:** Los hashes deben coincidir exactamente.

---

## ⚠️ Troubleshooting

### Problema: No se extraen emails

**Causa:** Regex no coincide con formato del email

**Verificar:**
```sql
SELECT 
  message_text,
  payload_raw->>'extracted_email' as email
FROM events
WHERE message_text LIKE '%@%'
  AND event_type = 'message_in';
```

**Solución:** Revisar regex en Workflow 2, línea 70-78

### Problema: No se captura nombre

**Causa:** yCloud no envía el campo esperado

**Verificar:**
```sql
SELECT 
  payload_raw::jsonb->'whatsappInboundMessage' as payload
FROM events
WHERE phone_e164 = '+573002000001'
LIMIT 1;
```

**Buscar:** `fromName`, `profileName`, `contact.name`, `profile.name`

### Problema: lead_attribution vacía

**Causa:** Workflow 3 no se ejecutó o hash no viene del mensaje

**Verificar:**
```sql
SELECT COUNT(*) FROM events WHERE click_id_hash IS NOT NULL;
```

**Solución:** Ejecutar Workflow 3 manualmente

---

## 📊 Métricas Esperadas

Después de ejecutar test_enhanced.ps1 y Workflow 3:

| Métrica | Valor Esperado |
|---------|----------------|
| Clicks en DB | 5 (solo los que tienen gclid) |
| Mensajes inbound | 14 |
| Mensajes outbound | 14 |
| Emails extraídos | 10 |
| Nombres extraídos | 10 |
| lead_attribution rows | 5 (solo con hash) |
| Conversiones | 10 |
| email_sha256 poblados | 10 |
| phone_sha256 poblados | 10 |

---

## 🎓 Lecciones de Testing

1. **Delay entre requests**: 1 segundo para evitar rate limit de Google Sheets
2. **Status outbound**: SIEMPRE usar `"delivered"` o se ignoran
3. **Formato email**: Debe coincidir con regex `/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i`
4. **Hash format**: Exactamente 5 caracteres alfanuméricos: `#[A-Z0-9]{5}`
5. **Timestamps**: Usar ISO 8601 con zona horaria (Z)
6. **Phone E.164**: Formato `+573XXXXXXXXX` (Colombia)

---

## 📝 Notas Importantes

- Los datos de prueba usan el rango `+5730020000XX` para no interferir con datos reales
- El proyecto `test-color-tapetes` debe estar configurado en `clients_config`
- Los workflows deben estar **activos** en n8n
- La primera ejecución de Workflow 3 puede tardar más (sin cache)
- Google Sheets debe tener las columnas `lead_name`, `email_sha256`, `phone_sha256`

---

✅ **Sistema listo para producción con Enhanced Conversions**
