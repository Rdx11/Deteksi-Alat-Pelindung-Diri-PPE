# Script untuk download model YOLO dari GitHub
# Repository: snehilsanyal/Construction-Site-Safety-PPE-Detection

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Download PPE Detection Model" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$modelUrl = "https://github.com/snehilsanyal/Construction-Site-Safety-PPE-Detection/raw/main/models/best.pt"
$modelPath = "backend/ml_models/ppe_yolo.pt"

# Create directory if not exists
if (!(Test-Path "backend/ml_models")) {
    New-Item -ItemType Directory -Force -Path "backend/ml_models" | Out-Null
    Write-Host "✓ Created ml_models directory" -ForegroundColor Green
}

Write-Host "Downloading model from GitHub..." -ForegroundColor Yellow
Write-Host "Source: $modelUrl" -ForegroundColor Gray
Write-Host ""

try {
    # Download dengan progress bar
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $modelUrl -OutFile $modelPath -UseBasicParsing
    
    if (Test-Path $modelPath) {
        $fileSize = (Get-Item $modelPath).Length / 1MB
        Write-Host "✓ Model downloaded successfully!" -ForegroundColor Green
        Write-Host "  File: $modelPath" -ForegroundColor White
        Write-Host "  Size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor White
        Write-Host ""
        Write-Host "Model siap digunakan!" -ForegroundColor Green
    } else {
        throw "File tidak ditemukan setelah download"
    }
} catch {
    Write-Host "✗ Error downloading model: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternatif: Download manual" -ForegroundColor Yellow
    Write-Host "1. Buka: https://github.com/snehilsanyal/Construction-Site-Safety-PPE-Detection" -ForegroundColor White
    Write-Host "2. Download file 'models/best.pt'" -ForegroundColor White
    Write-Host "3. Simpan ke: backend/ml_models/ppe_yolo.pt" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Next Steps" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Model sudah siap! Sekarang jalankan:" -ForegroundColor Yellow
Write-Host "  .\start.ps1" -ForegroundColor Cyan
Write-Host ""
