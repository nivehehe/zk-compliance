# zkCompliance: Zero-Knowledge Regulatory & Identity Verification Protocol

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Circom](https://img.shields.io/badge/Circom-2.0-orange.svg)](https://docs.circom.io/)
[![SnarkJS](https://img.shields.io/badge/SnarkJS-Groth16-green.svg)](https://github.com/iden3/snarkjs)
[![Curve](https://img.shields.io/badge/Curve-BN128-purple.svg)]()
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.0-lightgrey.svg)]()

A self-sovereign, privacy-preserving compliance protocol powered by Groth16 zero-knowledge SNARKs. It proves regulatory eligibility (such as age &ge; threshold and valid identity commitment) client-side in the browser, without exposing Personally Identifiable Information (PII) to servers or public blockchains.

---

## 1. Executive Summary & Problem Formulation

Decentralized finance (DeFi) protocols face an inherent tension between regulatory compliance and user privacy:
1. **The Traditional KYC Vulnerability**: Centralized databases containing birthdates, passport records, and biometric data represent persistent targets for data breaches and identity theft.
2. **The Public Ledger Privacy Conflict**: Recording identity claims directly on a public blockchain links user wallet activity to real-world identities in perpetuity, violating privacy standards such as the GDPR Right to be Forgotten.
3. **The Zero-Knowledge Approach**:
   - The prover synthesizes a Groth16 zk-SNARK proof client-side inside WebAssembly.
   - The proof verifies that the prover satisfies the constraint: `age >= ageThreshold` and computes a cryptographic commitment `Poseidon(idNumber)`.
   - The verifier smart contract validates the proof on-chain in ~240,000 gas, issuing an attestation record that unlocks permissioned protocols without storing any plaintext personal attributes.

---

## 2. Cryptographic Architecture

### Rank-1 Constraint System (R1CS)
Circom compiles the circuit definition into quadratic arithmetic constraints over the scalar field $\mathbb{F}_p$ ($p \approx 2^{254}$):
$$(A \cdot s) \times (B \cdot s) - (C \cdot s) = 0$$

Where $s \in \mathbb{F}_p^m$ represents the witness vector comprising private inputs (`age`, `idNumber`), public inputs (`ageThreshold`), public outputs (`isEligible`, `identityCommitment`), and internal wires.
Total system complexity: **429 constraints** over the **BN128** curve.

### Poseidon Algebraic Hash Function
Standard cryptographic hash algorithms (SHA-256, Keccak-256) utilize bitwise rotations and additions that consume over 25,000 constraints per block inside a SNARK. `zkCompliance` utilizes **Poseidon**, an algebraic sponge hash whose S-box rounds ($x^5 \pmod p$) require only **~240 constraints**, making client-side in-browser witness generation practical.

### Groth16 Bilinear Pairings Verification
On-chain verification evaluates proof coordinates $\pi_A \in \mathbb{G}_1$, $\pi_B \in \mathbb{G}_2$, and $\pi_C \in \mathbb{G}_1$ using the Groth16 pairing equation:

$$e(\pi_A, \pi_B) = e(\alpha, \beta) \cdot e(x \cdot \gamma, \delta) \cdot e(\pi_C, \delta)$$

Where:
- $\alpha, \beta, \gamma, \delta$ are parameters from the Structured Reference String (SRS).
- $x = (x_0, x_1, x_2)$ are public inputs: `[isEligible, identityCommitment, ageThreshold]`.
- $e: \mathbb{G}_1 \times \mathbb{G}_2 \rightarrow \mathbb{G}_T$ is the optimal Ate pairing on BN128, executed via Ethereum precompile `0x08` (`ecPairing`).

---

## 3. System Architecture

```
+-------------------------------------------------------------+
|                        CLIENT BROWSER                       |
|                                                             |
|   [Private: age]                 [Private: idNumber]        |
|          |                               │                  |
|          v                               v                  |
|   GreaterEqThan(8)                  Poseidon(1)             |
|          |                               │                  |
|   (age >= threshold)                     |                  |
|          |                               v                  |
|    isEligible === 1              identityCommitment         |
|          |                               │                  |
|          +───────────────┬───────────────+                  |
|                          |                                  |
|                          v                                  |
|               compliance.wasm (Witness)                     |
|                          |                                  |
|                          v                                  |
|               compliance.zkey (Groth16)                     |
|                          |                                  |
|                          v                                  |
|               Proof & Calldata Synthesis                    |
+--------------------------┬----------------------------------+
                           | registerCompliance(a, b, c, input)
                           v
+-------------------------------------------------------------+
|                        EVM EXECUTION                        |
|                                                             |
|                  +-----------------------+                  |
|                  |     Verifier.sol      |                  |
|                  | (ecPairing precompile)|                  |
|                  +-----------┬-----------+                  |
|                              | isValid == true              |
|                              v                              |
|               +----------------------------+                |
|               |  ZKComplianceRegistry.sol  |                |
|               | (Sybil Check & Attestation)|                |
|               +--------------┬-------------+                |
|                              | isUserCompliant() == true    |
|                              v                              |
|               +----------------------------+                |
|               |     CompliantVault.sol     |                |
|               |  (Gated Institutional Pool)|                |
|               +----------------------------+                |
+-------------------------------------------------------------+
```

---

## 4. Repository Structure

```
zk-compliance/
├── circuits/
│   └── compliance.circom         # Circom 2.0 ZK-SNARK circuit definition
├── contracts/
│   ├── Verifier.sol              # Generated Groth16 Solidity verifier
│   ├── ZKComplianceRegistry.sol  # On-chain registry & attestation issuer
│   └── CompliantVault.sol        # Gated institutional yield vault
├── build/                        # Compiled circuit artifacts
│   ├── compliance.wasm           # WebAssembly witness calculator
│   ├── compliance.zkey           # Groth16 proving key (BN128)
│   ├── compliance.r1cs           # Rank-1 constraint system
│   └── verification_key.json     # Public verification key
├── frontend/                     # React 18, TypeScript, Tailwind application
│   ├── public/                   # Static cryptographic assets
│   │   ├── compliance.wasm
│   │   ├── compliance.zkey
│   │   ├── snarkjs.min.js
│   │   └── verification_key.json
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx        # Navigation header & wallet simulator
│   │   │   ├── ProverTab.tsx     # Client-side ZK prover interface
│   │   │   ├── DefiVaultTab.tsx  # Gated DeFi vault interface
│   │   │   ├── AuditorTab.tsx    # Independent proof verifier for regulators
│   │   │   ├── VisualizerTab.tsx # Interactive R1CS & Groth16 visualizer
│   │   │   ├── ContractsTab.tsx  # Smart contract code inspector
│   │   │   ├── ProofModal.tsx    # Cryptographic proof point inspector
│   │   │   └── ComplianceBadge.tsx # Attestation record viewer
│   │   ├── lib/
│   │   │   ├── zkProver.ts       # Browser snarkjs wrapper
│   │   │   └── mockBlockchain.ts # Simulated on-chain EVM state
│   │   ├── App.tsx
│   │   └── index.css
│   └── package.json
├── test/
│   └── compliance.test.mjs       # Cryptographic test suite (Node.js runner)
├── scripts/
│   └── compile-circuit.sh        # Circuit compilation & trusted setup pipeline
├── package.json                  # Root npm scripts
└── README.md
```

---

## 5. Setup and Execution

### Prerequisites
- Node.js `v18+` or `v20+` (tested on v26)
- Circom `2.0+` (optional; compiled artifacts are included in `build/`)

### 1. Installation
```bash
npm install
npm --prefix frontend install
```

### 2. Running Cryptographic Tests
```bash
npm test
```
The test suite validates:
1. Valid age (&ge; 18) generates a verified proof.
2. Boundary age (exactly 18 == 18) satisfies constraints.
3. Underage applicant (16 < 18) fails circuit assertion at line 21.
4. Tampered public signals fail bilinear pairing checks.
5. Calldata formatting matches EVM `uint[2] a`, `uint[2][2] b`, `uint[2] c`, `uint[3] input`.

### 3. Running the Frontend
```bash
npm run dev
```
Access the application at `http://localhost:5173`.

---

## 6. Security Analysis & Threat Model

| Threat / Attack Vector | Defense Mechanism |
| :--- | :--- |
| **Underage Proof Forgery** | Circuit enforces `isEligible === 1` via `GreaterEqThan(8)` bit decomposition. If age &lt; threshold, no satisfying witness polynomial exists. |
| **Public Signal Tampering** | Changing `isEligible` to 1 or altering the commitment without valid inputs invalidates the bilinear pairing equality $e(A,B) = e(\alpha,\beta)\cdot\dots$ |
| **Sybil & Multi-Wallet Abuse** | `ZKComplianceRegistry.sol` tracks unique commitments in `commitmentToOwner[commitment]`. One identity commitment cannot register multiple wallets. |
| **Replay & Front-Running** | Attestation records bind to `msg.sender`, preventing transaction front-running on proof submission. |
| **Data Leakage / Doxxing** | Inputs are processed strictly inside client-side WASM memory. Zero plaintext identity data is transmitted over the network or stored in contract storage. |

---

## 7. License
MIT License. Circom and SnarkJS are maintained by iden3 and the 0KIMS association.
