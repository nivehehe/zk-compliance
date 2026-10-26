import { describe, it, before, after } from 'node:test';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import * as snarkjs from 'snarkjs';

const WASM_PATH = path.resolve('build/compliance.wasm');
const ZKEY_PATH = path.resolve('build/compliance.zkey');
const VKEY_PATH = path.resolve('build/verification_key.json');

describe('ZK-Compliance Circuit & Cryptographic Verification Tests', { timeout: 20000 }, () => {

  let vKey;

  before(() => {
    assert(fs.existsSync(WASM_PATH), 'WASM circuit file should exist');
    assert(fs.existsSync(ZKEY_PATH), 'ZKEY proving key should exist');
    assert(fs.existsSync(VKEY_PATH), 'Verification key should exist');
    vKey = JSON.parse(fs.readFileSync(VKEY_PATH, 'utf8'));
  });

  it('1. Successfully generates and verifies proof for compliant user (Age 24 >= 18)', async () => {
    const input = {
      age: 24,
      idNumber: 987654321,
      ageThreshold: 18
    };

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      WASM_PATH,
      ZKEY_PATH
    );

    assert(proof, 'Proof must be generated');
    assert.strictEqual(publicSignals.length, 3, 'Circuit outputs exactly 3 public signals');
    assert.strictEqual(publicSignals[0], '1', 'Public signal [0] isEligible must equal 1');
    assert.strictEqual(publicSignals[2], '18', 'Public signal [2] ageThreshold must equal 18');
    assert(BigInt(publicSignals[1]) > 0n, 'Identity commitment must be a non-zero field element');

    // Verify proof
    const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);
    assert.strictEqual(isValid, true, 'Cryptographic proof must verify successfully');
  });

  it('2. Successfully generates proof for boundary condition (Age exactly 18 == 18)', async () => {
    const input = {
      age: 18,
      idNumber: 1122334455,
      ageThreshold: 18
    };

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      WASM_PATH,
      ZKEY_PATH
    );

    assert.strictEqual(publicSignals[0], '1');
    const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);
    assert.strictEqual(isValid, true, 'Boundary age 18 should be valid');
  });

  it('3. Rejects proof generation when user is underage (Age 17 < 18)', async () => {
    const input = {
      age: 17,
      idNumber: 5544332211,
      ageThreshold: 18
    };

    let failed = false;
    try {
      await snarkjs.groth16.fullProve(input, WASM_PATH, ZKEY_PATH);
    } catch (err) {
      failed = true;
      assert(err.message.includes('Assert Failed') || err.toString().includes('Error'), 'Circuit assertion should fail');
    }
    assert.strictEqual(failed, true, 'Circuit must reject underage participant');
  });

  it('4. Rejects tampered public signals (Tamper attack resistance)', async () => {
    const input = {
      age: 25,
      idNumber: 777888999,
      ageThreshold: 18
    };

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      WASM_PATH,
      ZKEY_PATH
    );

    // Attacker tampers with the identity commitment
    const tamperedSignals = [...publicSignals];
    tamperedSignals[1] = '12345678901234567890';

    const isValid = await snarkjs.groth16.verify(vKey, tamperedSignals, proof);
    assert.strictEqual(isValid, false, 'Tampered public signal must fail verification');
  });

  it('5. Exports valid Solidity calldata parameters', async () => {
    const input = {
      age: 30,
      idNumber: 123456789,
      ageThreshold: 21
    };

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      WASM_PATH,
      ZKEY_PATH
    );

    const calldataStr = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
    assert(calldataStr.startsWith('['), 'Calldata string should be valid JSON-like array');
    const parsed = JSON.parse(`[${calldataStr}]`);
    assert.strictEqual(parsed.length, 4, 'Calldata contains [a, b, c, input]');
  });

  after(() => {
    setTimeout(() => process.exit(0), 100);
  });
});
