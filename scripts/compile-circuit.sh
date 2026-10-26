#!/usr/bin/env bash
set -e

echo "=========================================="
echo "    ZK-Compliance Circuit Build Pipeline   "
echo "=========================================="

mkdir -p build frontend/public

echo "1. Compiling Circom circuit to R1CS and WASM..."
circom circuits/compliance.circom --r1cs --wasm --sym -o build/

echo "2. Running Powers of Tau & Groth16 Ceremony..."
npx snarkjs powersoftau new bn128 10 build/pot10_0000.ptau -v
npx snarkjs powersoftau contribute build/pot10_0000.ptau build/pot10_0001.ptau --name="ZK-Compliance Setup" -v -e="ZKEntropy$(date +%s)"
npx snarkjs powersoftau prepare phase2 build/pot10_0001.ptau build/pot10_final.ptau -v

npx snarkjs groth16 setup build/compliance.r1cs build/pot10_final.ptau build/compliance_0000.zkey
npx snarkjs zkey contribute build/compliance_0000.zkey build/compliance.zkey --name="ZK-Compliance Contributor" -v -e="ZKEntropy2$(date +%s)"

echo "3. Exporting Verification Key & Solidity Verifier..."
npx snarkjs zkey export verificationkey build/compliance.zkey build/verification_key.json
npx snarkjs zkey export solidityverifier build/compliance.zkey contracts/Verifier.sol

echo "4. Copying client-side assets to frontend/public/..."
cp build/compliance_js/compliance.wasm frontend/public/compliance.wasm
cp build/compliance.zkey frontend/public/compliance.zkey
cp build/verification_key.json frontend/public/verification_key.json

# Cleanup intermediate files
rm -f build/pot10_*.ptau build/compliance_0000.zkey

echo " Circuit pipeline completed successfully!"
