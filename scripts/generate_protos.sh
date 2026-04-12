#!/usr/bin/env bash
# ============================================================
# VIGIL — Generate Python gRPC stubs from proto definitions
# Run from repo root: bash scripts/generate_protos.sh
# ============================================================

set -euo pipefail

PROTO_DIR="proto"
OUTPUT_DIR="proto/generated"

echo "==> Cleaning old generated files..."
rm -rf "${OUTPUT_DIR}"
mkdir -p "${OUTPUT_DIR}"

echo "==> Generating Python gRPC stubs from ${PROTO_DIR}/vigil.proto..."
python -m grpc_tools.protoc \
    -I "${PROTO_DIR}" \
    --python_out="${OUTPUT_DIR}" \
    --grpc_python_out="${OUTPUT_DIR}" \
    --pyi_out="${OUTPUT_DIR}" \
    "${PROTO_DIR}/vigil.proto"

# Create __init__.py for the generated package
touch "${OUTPUT_DIR}/__init__.py"

echo "==> Generated files:"
ls -la "${OUTPUT_DIR}"
echo "==> Done."
