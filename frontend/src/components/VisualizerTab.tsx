import React, { useState } from 'react';
import {
  Binary,
  Layers,
  Cpu,
  CheckCircle2,
  XCircle,
  Zap,
  Lock,
} from 'lucide-react';

export const VisualizerTab: React.FC = () => {
  const [testAge, setTestAge] = useState<number>(20);
  const [testThreshold, setTestThreshold] = useState<number>(18);
  const [testId, setTestId] = useState<number>(123456789);

  const isEligible = testAge >= testThreshold;
  const isConstraintSatisfied = isEligible;

  return (
    <div className="space-y-8 pb-12">
      {/* Title & Introduction */}
      <div className="space-y-2 border-b border-zinc-800 pb-5">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
            Cryptographic Architecture
          </span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
          ZK Circuit & Mathematical Architecture
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
          Analysis of the Circom arithmetic constraint system, Poseidon algebraic hashing over finite fields, and Groth16 bilinear pairings.
        </p>
      </div>

      {/* Interactive Constraint Simulator */}
      <div className="bg-[#111114] p-5 sm:p-6 rounded-xl border border-zinc-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800 gap-2">
          <div>
            <h3 className="font-semibold text-sm text-zinc-200 flex items-center space-x-2">
              <Zap className="w-4 h-4 text-zinc-400" />
              <span>R1CS Constraint Evaluation Simulator</span>
            </h3>
            <p className="text-xs text-zinc-500">
              Interactive visualization of wire valuations across the constraint system.
            </p>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#16161a] border border-zinc-800 text-zinc-400">
            429 Total Constraints
          </span>
        </div>

        {/* Sliders & Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400 font-medium">Private Input: age</span>
              <span className="font-mono text-zinc-200">{testAge} years</span>
            </div>
            <input
              type="range"
              min="10"
              max="80"
              value={testAge}
              onChange={(e) => setTestAge(parseInt(e.target.value))}
              className="w-full accent-zinc-300 bg-zinc-800 rounded-lg cursor-pointer"
            />
            <div className="text-[11px] text-zinc-500">
              Evaluated as an 8-bit unsigned integer via GreaterEqThan(8)
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400 font-medium">Public Input: ageThreshold</span>
              <span className="font-mono text-zinc-200">{testThreshold} years</span>
            </div>
            <div className="flex gap-2">
              {[18, 21, 65].map((th) => (
                <button
                  key={th}
                  onClick={() => setTestThreshold(th)}
                  className={`flex-1 py-1 rounded text-xs font-mono border transition-colors ${
                    testThreshold === th
                      ? 'bg-zinc-800 text-zinc-100 border-zinc-600'
                      : 'bg-[#0c0c0e] text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {th}+
                </button>
              ))}
            </div>
            <div className="text-[11px] text-zinc-500">
              Public constraint parameter verified on-chain
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400 font-medium">Private Input: idNumber</span>
              <span className="font-mono text-zinc-300">{testId}</span>
            </div>
            <input
              type="number"
              value={testId}
              onChange={(e) => setTestId(parseInt(e.target.value) || 0)}
              className="w-full bg-[#0c0c0e] border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-500"
            />
            <div className="text-[11px] text-zinc-500">
              Evaluated through Poseidon(1) S-box rounds
            </div>
          </div>
        </div>

        {/* Live Wire States */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-zinc-800 text-xs">
          <div className="p-3.5 rounded-lg bg-[#0c0c0e] border border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="font-medium">GreaterEqThan(8) Wire</span>
              <span className="font-mono text-[10px]">Wire #24</span>
            </div>
            <div className="font-mono text-sm text-zinc-200 font-medium">
              greaterEq.out = {isEligible ? '1' : '0'}
            </div>
            <div className="text-[11px] text-zinc-500">
              Condition: {testAge} &ge; {testThreshold}
            </div>
          </div>

          <div
            className={`p-3.5 rounded-lg border space-y-1.5 transition-all ${
              isConstraintSatisfied
                ? 'bg-emerald-950/15 border-emerald-900/50 text-emerald-400'
                : 'bg-red-950/15 border-red-900/50 text-red-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">Assert Equality Check</span>
              <span className="font-mono text-[10px]">Line 21</span>
            </div>
            <div className="font-mono text-sm font-medium flex items-center space-x-1.5">
              {isConstraintSatisfied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>isEligible === 1 (Satisfied)</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                  <span>isEligible === 1 (Violated)</span>
                </>
              )}
            </div>
            <div className="text-[11px] opacity-80">
              {isConstraintSatisfied
                ? 'Valid witness can be synthesized'
                : 'Witness calculation fails; proof cannot be forged'}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0c0c0e] border border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="font-medium">Poseidon Commitment</span>
              <span className="font-mono text-[10px]">Wire #429</span>
            </div>
            <div className="font-mono text-xs text-zinc-300 truncate">
              {isConstraintSatisfied ? '0x0fb849f7...c87e' : 'Undefined'}
            </div>
            <div className="text-[11px] text-zinc-500">
              Algebraic hash over prime field F_p
            </div>
          </div>
        </div>
      </div>

      {/* The 4 Architecture Steps */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-zinc-200 uppercase tracking-wider">
          Architecture Breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#111114] p-5 rounded-xl border border-zinc-800 space-y-2.5">
            <div className="w-8 h-8 rounded-md bg-[#16161a] border border-zinc-800 flex items-center justify-center text-zinc-400">
              <Layers className="w-4 h-4" />
            </div>
            <h4 className="font-semibold text-zinc-200 text-sm">1. Circom Circuit Definition</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Compliance logic is declared as arithmetic constraints over the BN128 scalar field <code className="text-zinc-300">F_p</code> ($p \approx 2^{254}$). Range checks decompose the 8-bit difference to ensure non-negativity.
            </p>
            <div className="p-2.5 rounded bg-[#0c0c0e] font-mono text-[11px] text-zinc-400 border border-zinc-800">
              greaterEq.in[0] &lt;== age;<br />
              greaterEq.in[1] &lt;== ageThreshold;<br />
              isEligible === 1;
            </div>
          </div>

          <div className="bg-[#111114] p-5 rounded-xl border border-zinc-800 space-y-2.5">
            <div className="w-8 h-8 rounded-md bg-[#16161a] border border-zinc-800 flex items-center justify-center text-zinc-400">
              <Binary className="w-4 h-4" />
            </div>
            <h4 className="font-semibold text-zinc-200 text-sm">2. Rank-1 Constraint System (R1CS)</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Circom compiles the circuit into a quadratic arithmetic system of the form:
              <span className="block font-mono text-zinc-300 py-1">(A &middot; s) &times; (B &middot; s) - (C &middot; s) = 0</span>
              Where <code className="text-zinc-300">s</code> is the complete witness vector containing private inputs, public signals, and intermediate wires.
            </p>
          </div>

          <div className="bg-[#111114] p-5 rounded-xl border border-zinc-800 space-y-2.5">
            <div className="w-8 h-8 rounded-md bg-[#16161a] border border-zinc-800 flex items-center justify-center text-zinc-400">
              <Cpu className="w-4 h-4" />
            </div>
            <h4 className="font-semibold text-zinc-200 text-sm">3. Structured Reference String (Powers of Tau)</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Groth16 uses a two-phase trusted setup ceremony. Phase 1 computes universal powers of secret trapdoor &tau; in G1 and G2. Phase 2 binds the ceremony to <code className="text-zinc-300">compliance.r1cs</code>, generating <code className="text-zinc-300">compliance.zkey</code>.
            </p>
          </div>

          <div className="bg-[#111114] p-5 rounded-xl border border-zinc-800 space-y-2.5">
            <div className="w-8 h-8 rounded-md bg-[#16161a] border border-zinc-800 flex items-center justify-center text-zinc-400">
              <Lock className="w-4 h-4" />
            </div>
            <h4 className="font-semibold text-zinc-200 text-sm">4. On-Chain Pairing Verification (Verifier.sol)</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Ethereum precompile #8 (<code className="text-zinc-300">ecPairing</code> at 0x08) verifies the proof on-chain in ~240,000 gas:
              <span className="block font-mono text-zinc-300 py-1">e(A, B) = e(&alpha;, &beta;) &middot; e(x &middot; &gamma;, &delta;) &middot; e(C, &delta;)</span>
              Blinding factors guarantee zero knowledge of private witness values.
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-[#111114] p-5 rounded-xl border border-zinc-800 space-y-3">
        <h3 className="font-semibold text-xs text-zinc-200 uppercase tracking-wider">
          Compliance Architecture Comparison
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase text-zinc-500 border-b border-zinc-800">
              <tr>
                <th className="pb-2.5">Dimension</th>
                <th className="pb-2.5">Traditional Centralized KYC</th>
                <th className="pb-2.5">Naive On-Chain KYC</th>
                <th className="pb-2.5 text-zinc-200 font-semibold">zkCompliance Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-400">
              <tr>
                <td className="py-2.5 font-medium text-zinc-300">PII Storage</td>
                <td className="py-2.5 text-zinc-400">Centralized database (breach risk)</td>
                <td className="py-2.5 text-zinc-400">Public blockchain (doxxed permanently)</td>
                <td className="py-2.5 text-zinc-200 font-medium">Local client memory only (0 stored)</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-zinc-300">Regulatory Adherence</td>
                <td className="py-2.5 text-zinc-400">Compliant</td>
                <td className="py-2.5 text-zinc-400">Violates GDPR Right to be Forgotten</td>
                <td className="py-2.5 text-zinc-200 font-medium">Compliant + GDPR Compatible</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-zinc-300">Sybil Protection</td>
                <td className="py-2.5 text-zinc-400">Manual review</td>
                <td className="py-2.5 text-zinc-400">Limited</td>
                <td className="py-2.5 text-zinc-200 font-medium">Poseidon Commitment Registry</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-zinc-300">Protocol Composability</td>
                <td className="py-2.5 text-zinc-400">Off-chain silos</td>
                <td className="py-2.5 text-zinc-400">Fragmented</td>
                <td className="py-2.5 text-zinc-200 font-medium">Universal ERC-5192 Attestation</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
