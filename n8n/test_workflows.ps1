# ============================================
# TEST WORKFLOWS - n8n Color Tapetes
# ============================================
# Este script prueba los 3 workflows con datos de prueba
# Empresa: +573123725256 | Cliente: +573103069696
# ============================================

# Configuración
$baseUrl = "https://primary-production-3fcd.up.railway.app/webhook"
$projectId = "test-color-tapetes"

# Rutas de archivos
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$clickFile = Join-Path $scriptPath "test_data\click_test_data.json"
$ycloudInboundFile = Join-Path $scriptPath "test_data\ycloud_inbound_test_data.json"
$ycloudOutboundFile = Join-Path $scriptPath "test_data\ycloud_outbound_test_data.json"

function Send-TestRequest {
    param (
        [string]$Url,
        [string]$Name,
        [string]$FilePath
    )

    Write-Host "`n----------------------------------------"
    Write-Host "Probando: $Name" -ForegroundColor Cyan

    if (-not (Test-Path $FilePath)) {
        Write-Host "Error: Archivo no encontrado: $FilePath" -ForegroundColor Red
        return
    }

    try {
        # Leer el archivo y tomar el primer elemento del array de prueba
        $jsonContent = Get-Content -Raw -Path $FilePath | ConvertFrom-Json
        $payload = $jsonContent[0].body | ConvertTo-Json -Depth 10 -Compress

        Write-Host "URL: $Url" -ForegroundColor Gray
        Write-Host "Enviando payload..." -ForegroundColor Gray

        $response = Invoke-RestMethod -Uri $Url -Method Post -ContentType "application/json" -Body $payload

        Write-Host "Exito! Respuesta:" -ForegroundColor Green
        $response | ConvertTo-Json -Depth 5
    }
    catch {
        Write-Host "Error al enviar la solicitud:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader $_.Exception.Response.GetResponseStream()
            $responseBody = $reader.ReadToEnd()
            Write-Host "Detalles del servidor: $responseBody" -ForegroundColor Yellow
        }
    }
}

# ============================================
# EJECUCIÓN DE PRUEBAS - BUCLE
# ============================================

Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "   TEST WORKFLOWS - Color Tapetes (20 Clients)" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# UUIDs reales de los webhooks
$clickWebhookPath = "click-webhook-uuid"
$ycloudWebhookPath = "ycloud-webhook-uuid"

# Leer datos completos
$clickData = Get-Content -Raw -Path $clickFile | ConvertFrom-Json
$inboundData = Get-Content -Raw -Path $ycloudInboundFile | ConvertFrom-Json
$outboundData = Get-Content -Raw -Path $ycloudOutboundFile | ConvertFrom-Json

Write-Host "Cargados: $($clickData.Count) Clicks, $($inboundData.Count) Inbound, $($outboundData.Count) Outbound" -ForegroundColor Gray

# Loop por cliente (asumiendo que los arrays están sincronizados por índice)
for ($i = 0; $i -lt $clickData.Count; $i++) {
    $clientNum = $i + 1
    Write-Host "`n----------------------------------------"
    Write-Host "PROCESANDO CLIENTE #$clientNum" -ForegroundColor Cyan
    Write-Host "----------------------------------------"

    # 1. Click Ingest
    $cF = $clickData[$i]
    Write-Host "1. Enviando Click ($($cF.description))..." -ForegroundColor Yellow
    try {
        $body = $cF.body | ConvertTo-Json -Depth 10 -Compress
        Invoke-RestMethod -Uri "$baseUrl/$clickWebhookPath/click/$projectId" -Method Post -ContentType "application/json" -Body $body | Out-Null
        Write-Host "   OK" -ForegroundColor Green
    }
    catch {
        Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }

    Start-Sleep -Seconds 3

    # 2. Inbound Message
    $iF = $inboundData[$i]
    Write-Host "2. Enviando Inbound ($($iF.description))..." -ForegroundColor Yellow
    try {
        $body = $iF.body | ConvertTo-Json -Depth 10 -Compress
        Invoke-RestMethod -Uri "$baseUrl/$ycloudWebhookPath/ycloud/$projectId" -Method Post -ContentType "application/json" -Body $body | Out-Null
        Write-Host "   OK" -ForegroundColor Green
    }
    catch {
        Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }

    Start-Sleep -Seconds 3

    # 3. Outbound Message
    $oF = $outboundData[$i]
    Write-Host "3. Enviando Outbound ($($oF.description))..." -ForegroundColor Yellow
    try {
        $body = $oF.body | ConvertTo-Json -Depth 10 -Compress
        Invoke-RestMethod -Uri "$baseUrl/$ycloudWebhookPath/ycloud/$projectId" -Method Post -ContentType "application/json" -Body $body | Out-Null
        Write-Host "   OK" -ForegroundColor Green
    }
    catch {
        Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }

    Start-Sleep -Milliseconds 500
}

Write-Host "`n=============================================" -ForegroundColor Green
Write-Host "   TESTS COMPLETADOS" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

Write-Host "`nProximos pasos:" -ForegroundColor Cyan
Write-Host "1. Verifica en n8n que los workflows se ejecutaron sin errores" -ForegroundColor White
Write-Host "2. Revisa en Postgres:" -ForegroundColor White
Write-Host "   SELECT * FROM events WHERE project_id = 'test-color-tapetes' ORDER BY created_at DESC LIMIT 10;" -ForegroundColor Gray
Write-Host "3. Revisa en Google Sheets la hoja 'chats_raw'" -ForegroundColor White
Write-Host "4. Para ejecutar Workflow 3 manualmente en n8n o espera 5 minutos" -ForegroundColor White
Write-Host ""
