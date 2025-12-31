# Test Script - Enhanced Conversions & Attribution
# Prueba completa del sistema con email, nombre y atribución persistente

$ErrorActionPreference = "Continue"

# Configuración
$N8N_URL = "https://whatsapp-admin-panel-production.up.railway.app"
$PROJECT_ID = "test-color-tapetes"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TEST: Enhanced Conversions System" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Cargar datos
$clicksData = Get-Content "test_data/click_test_data.json" | ConvertFrom-Json
$inboundData = Get-Content "test_data/ycloud_enhanced_test_data.json" | ConvertFrom-Json
$outboundData = Get-Content "test_data/ycloud_outbound_enhanced_test_data.json" | ConvertFrom-Json

Write-Host "📊 Datos cargados:" -ForegroundColor Green
Write-Host "  - Clicks: $($clicksData.Count)" -ForegroundColor White
Write-Host "  - Mensajes inbound: $($inboundData.Count)" -ForegroundColor White
Write-Host "  - Mensajes outbound: $($outboundData.Count)" -ForegroundColor White
Write-Host ""

# Función para enviar webhook
function Send-Webhook {
    param(
        [string]$Endpoint,
        [string]$ProjectId,
        [object]$Body,
        [string]$Description
    )
    
    $url = "$N8N_URL/$Endpoint/$ProjectId"
    
    try {
        $response = Invoke-RestMethod -Uri $url -Method Post -Body ($Body | ConvertTo-Json -Depth 10) -ContentType "application/json"
        Write-Host "✓ $Description" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "✗ $Description - Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# ============================================
# FASE 1: Enviar Clicks (solo los que tienen gclid)
# ============================================
Write-Host "🔗 FASE 1: Enviando clicks..." -ForegroundColor Yellow
Write-Host ""

$clicksSent = 0
foreach ($click in $clicksData) {
    if ($click.body.gclid) {
        $sent = Send-Webhook -Endpoint "click" -ProjectId $click.params.project_id -Body $click.body -Description $click.description
        if ($sent) { $clicksSent++ }
        Start-Sleep -Milliseconds 500
    }
}

Write-Host ""
Write-Host "📈 Clicks enviados: $clicksSent" -ForegroundColor Cyan
Write-Host ""
Start-Sleep -Seconds 2

# ============================================
# FASE 2: Enviar Mensajes Inbound
# ============================================
Write-Host "📥 FASE 2: Enviando mensajes inbound..." -ForegroundColor Yellow
Write-Host ""

$inboundSent = 0
foreach ($msg in $inboundData) {
    $sent = Send-Webhook -Endpoint "ycloud" -ProjectId $msg.params.project_id -Body $msg.body -Description $msg.description
    if ($sent) { $inboundSent++ }
    Start-Sleep -Seconds 1  # Delay para evitar rate limit
}

Write-Host ""
Write-Host "📈 Mensajes inbound enviados: $inboundSent" -ForegroundColor Cyan
Write-Host ""
Start-Sleep -Seconds 2

# ============================================
# FASE 3: Enviar Mensajes Outbound
# ============================================
Write-Host "📤 FASE 3: Enviando mensajes outbound..." -ForegroundColor Yellow
Write-Host ""

$outboundSent = 0
foreach ($msg in $outboundData) {
    $sent = Send-Webhook -Endpoint "ycloud" -ProjectId $msg.params.project_id -Body $msg.body -Description $msg.description
    if ($sent) { $outboundSent++ }
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "📈 Mensajes outbound enviados: $outboundSent" -ForegroundColor Cyan
Write-Host ""

# ============================================
# RESUMEN
# ============================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESUMEN DE PRUEBAS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ Clicks enviados: $clicksSent" -ForegroundColor Green
Write-Host "✓ Mensajes inbound: $inboundSent" -ForegroundColor Green
Write-Host "✓ Mensajes outbound: $outboundSent" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Casos de prueba:" -ForegroundColor Yellow
Write-Host "  - C1 (María): Email + Hash + Multi-mensaje (atribución persistente)" -ForegroundColor White
Write-Host "  - C2 (Carlos): Email + Hash + Venta confirmada" -ForegroundColor White
Write-Host "  - C3 (Ana): Email sin hash (orgánico)" -ForegroundColor White
Write-Host "  - C4 (Pedro): Email + Lead calificado" -ForegroundColor White
Write-Host "  - C5 (Laura): Email + Hash + Cache test" -ForegroundColor White
Write-Host "  - C6 (Roberto): Solo nombre (sin email ni hash)" -ForegroundColor White
Write-Host "  - C7 (Sofía): Email + Hash + Queja" -ForegroundColor White
Write-Host "  - C8 (Andrés): Email + Hash + Venta $850K" -ForegroundColor White
Write-Host "  - C9 (Juliana): Email + Consulta simple" -ForegroundColor White
Write-Host "  - C10 (Diego): Email + Lead corporativo" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Verificación:" -ForegroundColor Yellow
Write-Host "  1. Revisar tabla 'events' en PostgreSQL" -ForegroundColor White
Write-Host "  2. Ejecutar Workflow 3 (AI Classification) manualmente" -ForegroundColor White
Write-Host "  3. Verificar 'conversions' con email_sha256/phone_sha256" -ForegroundColor White
Write-Host "  4. Revisar 'lead_attribution' para atribución persistente" -ForegroundColor White
Write-Host "  5. Verificar Google Sheets con nuevas columnas" -ForegroundColor White
Write-Host ""
Write-Host "✅ Test completado!" -ForegroundColor Green
