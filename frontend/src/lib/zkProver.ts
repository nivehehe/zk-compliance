import { Groth16Proof, ProofResult, ZKComplianceInput } from '../types/zk';

declare global {
  interface Window {
    snarkjs?: any;
  }
}

// Cached circuit buffers to make repeated proofs instantaneous
let cachedWasm: ArrayBuffer | null = null;
let cachedZkey: ArrayBuffer | null = null;
let cachedVKey: any = null;

export async function preloadCircuitAssets(): Promise<void> {
  try {
    const [wasmRes, zkeyRes, vkeyRes] = await Promise.all([
      fetch('/compliance.wasm'),
      fetch('/compliance.zkey'),
      fetch('/verification_key.json'),
    ]);

    if (wasmRes.ok && !cachedWasm) cachedWasm = await wasmRes.arrayBuffer();
    if (zkeyRes.ok && !cachedZkey) cachedZkey = await zkeyRes.arrayBuffer();
    if (vkeyRes.ok && !cachedVKey) cachedVKey = await vkeyRes.json();
  } catch (err) {
    console.warn('Circuit asset preloading error:', err);
  }
}

export async function generateComplianceProof(
  input: ZKComplianceInput,
  onStepChange?: (step: string) => void
): Promise<ProofResult> {
  const snarkjs = window.snarkjs;
  if (!snarkjs) {
    throw new Error('SnarkJS engine not detected. Please verify that snarkjs.min.js loaded correctly.');
  }

  const startTime = performance.now();

  // Step 1: Prepare assets
  onStepChange?.('Preparing private identity signals and Poseidon parameters...');
  if (!cachedWasm) {
    const res = await fetch('/compliance.wasm');
    if (!res.ok) throw new Error('Failed to load compliance.wasm');
    cachedWasm = await res.arrayBuffer();
  }
  if (!cachedZkey) {
    const res = await fetch('/compliance.zkey');
    if (!res.ok) throw new Error('Failed to load compliance.zkey');
    cachedZkey = await res.arrayBuffer();
  }

  // Step 2: Witness calculation & R1CS constraint solving
  onStepChange?.('Solving R1CS constraint system & computing wire witnesses in WASM...');
  const wasmUint8 = new Uint8Array(cachedWasm);
  const zkeyUint8 = new Uint8Array(cachedZkey);

  let fullProveResult: { proof: Groth16Proof; publicSignals: string[] };

  try {
    fullProveResult = await snarkjs.groth16.fullProve(
      {
        age: Number(input.age),
        idNumber: String(input.idNumber),
        ageThreshold: Number(input.ageThreshold),
      },
      wasmUint8,
      zkeyUint8
    );
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (msg.includes('Assert Failed') || msg.includes('line: 21') || msg.includes('isEligible')) {
      throw new Error(
        `Proof generation failed: Underage participant. The circuit constraint 'isEligible === 1' failed because age (${input.age}) is less than threshold (${input.ageThreshold}).`
      );
    }
    throw new Error(`Zero-knowledge proof synthesis error: ${msg}`);
  }

  // Step 3: Groth16 curve pairings
  onStepChange?.('Synthesizing Groth16 BN128 elliptic curve pairing proof...');
  const { proof, publicSignals } = fullProveResult;

  // Step 4: Calldata formatting for Solidity
  onStepChange?.('Formatting EVM calldata for on-chain Groth16 verifier contract...');
  const calldataStr = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
  const parsedCalldata = JSON.parse(`[${calldataStr}]`);

  const calldata = {
    a: parsedCalldata[0] as string[],
    b: parsedCalldata[1] as string[][],
    c: parsedCalldata[2] as string[],
    input: parsedCalldata[3] as string[],
    rawString: calldataStr,
  };

  const endTime = performance.now();

  return {
    proof,
    publicSignals,
    calldata,
    generationTimeMs: Math.round(endTime - startTime),
  };
}

export async function verifyComplianceProof(
  proof: Groth16Proof,
  publicSignals: string[]
): Promise<boolean> {
  const snarkjs = window.snarkjs;
  if (!snarkjs) {
    throw new Error('SnarkJS engine not detected');
  }

  if (!cachedVKey) {
    const res = await fetch('/verification_key.json');
    if (!res.ok) throw new Error('Failed to load verification_key.json');
    cachedVKey = await res.json();
  }

  return await snarkjs.groth16.verify(cachedVKey, publicSignals, proof);
}
