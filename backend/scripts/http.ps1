# Helper HTTP script for testing the backend from PowerShell
# Usage:
#   . .\backend\scripts\http.ps1            # dot-source to load functions
#   Set-BaseUrl "http://localhost:3001"
#   Login -Email "usuario@example.com" -Password "Secret123"
#   Me | ConvertTo-Json -Depth 6
#   Vivienda | ConvertTo-Json -Depth 6

$script:BaseUrl = "http://localhost:3001"
$script:Headers = @{}

function Set-BaseUrl {
  param([Parameter(Mandatory=$true)][string]$Url)
  $script:BaseUrl = $Url
}

function Set-AuthToken {
  param([Parameter(Mandatory=$true)][string]$Token)
  $script:Headers = @{ Authorization = "Bearer $Token" }
}

function Register-User {
  param(
    [Parameter(Mandatory=$true)][string]$Nombre,
    [Parameter(Mandatory=$true)][string]$Email,
    [Parameter(Mandatory=$true)][string]$Password,
    [string]$Rol = "beneficiario"
  )
  $body = @{ nombre = $Nombre; email = $Email; password = $Password; rol = $Rol } | ConvertTo-Json
  return Invoke-RestMethod -Method POST -Uri "$script:BaseUrl/api/register" -ContentType "application/json" -Body $body
}

function Login {
  param(
    [Parameter(Mandatory=$true)][string]$Email,
    [Parameter(Mandatory=$true)][string]$Password
  )
  $body = @{ email = $Email; password = $Password } | ConvertTo-Json
  $resp = Invoke-RestMethod -Method POST -Uri "$script:BaseUrl/api/login" -ContentType "application/json" -Body $body
  if ($resp.success -and $resp.token) {
    Set-AuthToken -Token $resp.token
    Write-Host "Login OK. Token configurado en el encabezado Authorization." -ForegroundColor Green
  }
  return $resp
}

function Me { return Invoke-RestMethod -Method GET -Uri "$script:BaseUrl/api/me" -Headers $script:Headers }
function Salud { return Invoke-RestMethod -Method GET -Uri "$script:BaseUrl/api/health" }

# Beneficiario
function Benef-Health { return Invoke-RestMethod -Method GET -Uri "$script:BaseUrl/api/beneficiario/health" -Headers $script:Headers }
function Vivienda { return Invoke-RestMethod -Method GET -Uri "$script:BaseUrl/api/beneficiario/vivienda" -Headers $script:Headers }
function Recepcion-Resumen { return Invoke-RestMethod -Method GET -Uri "$script:BaseUrl/api/beneficiario/recepcion" -Headers $script:Headers }
function Recepcion-Items { return Invoke-RestMethod -Method GET -Uri "$script:BaseUrl/api/beneficiario/recepcion/items" -Headers $script:Headers }

function Recepcion-Crear {
  return Invoke-RestMethod -Method POST -Uri "$script:BaseUrl/api/beneficiario/recepcion" -Headers $script:Headers -ContentType "application/json" -Body ("{}")
}

function Recepcion-GuardarItems {
  param([Parameter(Mandatory=$true)][Array]$Items)
  $body = @{ items = $Items } | ConvertTo-Json -Depth 6
  return Invoke-RestMethod -Method POST -Uri "$script:BaseUrl/api/beneficiario/recepcion/items" -Headers $script:Headers -ContentType "application/json" -Body $body
}

function Recepcion-Enviar {
  return Invoke-RestMethod -Method POST -Uri "$script:BaseUrl/api/beneficiario/recepcion/enviar" -Headers $script:Headers -ContentType "application/json" -Body ("{}")
}

function Incidencias-List {
  param([int]$Limit = 50)
  return Invoke-RestMethod -Method GET -Uri "$script:BaseUrl/api/beneficiario/incidencias?limit=$Limit" -Headers $script:Headers
}

function Incidencias-Crear {
  param(
    [Parameter(Mandatory=$true)][string]$Descripcion,
    [string]$Categoria,
    [string]$Prioridad
  )
  $body = @{ descripcion = $Descripcion; categoria = $Categoria; prioridad = $Prioridad } | ConvertTo-Json
  return Invoke-RestMethod -Method POST -Uri "$script:BaseUrl/api/beneficiario/incidencias" -Headers $script:Headers -ContentType "application/json" -Body $body
}

# Técnico: marcar recepción como revisada
function Tec-Recepcion-Revisar {
  param(
    [Parameter(Mandatory=$true)][int]$Id
  )
  return Invoke-RestMethod -Method POST -Uri "$script:BaseUrl/api/tecnico/recepcion/$Id/revisar" -Headers $script:Headers -ContentType "application/json" -Body ("{}")
}
