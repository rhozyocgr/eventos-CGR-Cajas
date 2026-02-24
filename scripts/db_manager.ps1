param (
    [Parameter(Mandatory=$true)]
    [ValidateSet("backup", "restore")]
    [string]$Action,

    [Parameter(Mandatory=$false)]
    [string]$File
)

# Obtener la ruta raíz del proyecto
$rootDir = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $rootDir ".env"

# Cargar variables del archivo .env
$config = @{}
if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        $line = $_.Trim()
        if ($line -match "^(?<name>[A-Za-z0-9_]+)\s*=\s*(?<value>.*)$") {
            $name = $Matches['name']
            $value = $Matches['value'].Trim().Trim("'").Trim('"')
            $config[$name] = $value
        }
    }
}

$DB_NAME = $config["DB_NAME"]
$DB_USER = $config["DB_USER"]
$DB_PASSWORD = $config["DB_PASSWORD"]
$CONTAINER_NAME = "event-db"

if (-not $DB_NAME) {
    Write-Host "Error: No se pudo cargar la configuración de .env o DB_NAME no está definido." -ForegroundColor Red
    exit 1
}

function Do-Backup {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupDir = Join-Path $rootDir "backups"
    if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir | Out-Null }
    
    $backupFile = Join-Path $backupDir "backup_$($DB_NAME)_$timestamp.sql"
    
    Write-Host "Iniciando backup de '$DB_NAME'..." -ForegroundColor Cyan
    
    # Usamos cmd /c para la redirección, que es mucho más fiable que el pipeline de PowerShell para streams de texto puro
    $command = "docker exec $CONTAINER_NAME mariadb-dump -u$DB_USER -p$DB_PASSWORD $DB_NAME > `"$backupFile`""
    cmd /c $command
    
    if (Test-Path $backupFile) {
        $size = (Get-Item $backupFile).Length
        if ($size -gt 1500) {
            Write-Host "Backup completado exitosamente ($($size) bytes) en: $backupFile" -ForegroundColor Green
        } else {
            Write-Warning "El backup se completó pero el archivo es muy pequeño ($($size) bytes). Es posible que la base de datos esté vacía."
        }
    } else {
        Write-Host "Error al realizar el backup." -ForegroundColor Red
    }
}

function Do-Restore {
    param($restoreFile)
    
    if (-not $restoreFile) {
        Write-Host "Error: Debe especificar un archivo con el parámetro -File" -ForegroundColor Red
        exit 1
    }
    
    $fullPath = $restoreFile
    if (-not (Test-Path $fullPath)) {
        $fullPath = Join-Path $rootDir $restoreFile
        if (-not (Test-Path $fullPath)) {
            $fullPath = Join-Path (Join-Path $rootDir "backups") $restoreFile
        }
    }
    
    if (-not (Test-Path $fullPath)) {
        Write-Host "Error: Archivo no encontrado: $restoreFile" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Restaurando base de datos '$DB_NAME' desde '$fullPath'..." -ForegroundColor Cyan
    
    # Redirección de entrada usando cmd /c
    $command = "docker exec -i $CONTAINER_NAME mariadb -u$DB_USER -p$DB_PASSWORD $DB_NAME < `"$fullPath`""
    cmd /c $command
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Restauración completada con éxito." -ForegroundColor Green
    } else {
        Write-Host "Error durante la restauración." -ForegroundColor Red
    }
}

if ($Action -eq "backup") {
    Do-Backup
} elseif ($Action -eq "restore") {
    Do-Restore $File
}
