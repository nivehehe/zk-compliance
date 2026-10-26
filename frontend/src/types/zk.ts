export interface Groth16Proof {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: string;
  curve: string;
}

export type PublicSignals = [
  isEligible: string,
  identityCommitment: string,
  ageThreshold: string
];

export interface ZKComplianceInput {
  age: number;
  idNumber: string | number;
  ageThreshold: number;
}

export interface ProofResult {
  proof: Groth16Proof;
  publicSignals: string[];
  calldata: {
    a: string[];
    b: string[][];
    c: string[];
    input: string[];
    rawString: string;
  };
  generationTimeMs: number;
}

export interface ComplianceRecord {
  isVerified: boolean;
  identityCommitment: string;
  verifiedAt: number;
  expiresAt: number;
  ageThreshold: number;
  txHash?: string;
  walletAddress: string;
}

export type ProverStatus = 'idle' | 'preparing' | 'witness' | 'proving' | 'verifying' | 'success' | 'error';
