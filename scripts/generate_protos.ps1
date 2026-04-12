# ============================================================
# VIGIL — Generate Python gRPC stubs from proto definitions (Windows)
# Run from repo root: powershell scripts/generate_protos.ps1
# ============================================================

$ErrorActionPreference = "Stop"

$PROTO_DIR = "proto"
$OUTPUT_DIR = "proto/generated"

Write-Host "==> Cleaning old generated files..."
if (Test-Path $OUTPUT_DIR) {
    Remove-Item -Recurse -Force $OUTPUT_DIR
}
New-Item -ItemType Directory -Force -Path $OUTPUT_DIR | Out-Null

Write-Host "==> Generating Python gRPC stubs from $PROTO_DIR/vigil.proto..."
python -m grpc_tools.protoc `
    -I $PROTO_DIR `
    --python_out="$OUTPUT_DIR" `
    --grpc_python_out="$OUTPUT_DIR" `
    --pyi_out="$OUTPUT_DIR" `
    "$PROTO_DIR/vigil.proto"

# Create __init__.py for the generated package
New-Item -ItemType File -Force -Path "$OUTPUT_DIR/__init__.py" | Out-Null

Write-Host "==> Generated files:"
Get-ChildItem $OUTPUT_DIR
Write-Host "==> Done."
