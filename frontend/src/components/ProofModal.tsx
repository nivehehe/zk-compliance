import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Shield, Cpu } from 'lucide-react';
import { ProofResult } from '../types/zk';

interface ProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  proofResult: ProofResult | null;
}

export const ProofModal: React.FC<ProofModalProps> = ({ isOpen, onClose, proofResult }) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen || !proofResult) return null;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const proof = proofResult.proof;
  const signals = proofResult.publicSignals;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#111114] border border-zinc-800 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#0c0c0e]">
          <div className="flex items-center space-x-2.5">
            <Cpu className="w-4 h-4 text-zinc-300" />
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Groth16 Cryptographic Proof Inspector</h3>
              <p className="text-xs text-zinc-500">BN128 Pairing Curve &middot; 429 R1CS Constraints</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Public Signals */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-zinc-200 flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-zinc-400" />
                <span>Public Signals (Inputs to On-Chain Verifier)</span>
              </span>
              <button
                onClick={() => copyToClipboard(JSON.stringify(signals, null, 2), 'signals')}
                className="text-zinc-400 hover:text-zinc-200 flex items-center space-x-1 text-[11px] transition-colors"
              >
                {copiedType === 'signals' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === 'signals' ? 'Copied' : 'Copy Public Signals'}</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <div className="p-3 bg-[#16161a] rounded-lg border border-zinc-800">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Signal [0]: isEligible</div>
                <div className="text-sm font-mono font-semibold text-zinc-200 mt-1">{signals[0]}</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Constraint satisfied (1 = True)</div>
              </div>
              <div className="p-3 bg-[#16161a] rounded-lg border border-zinc-800">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Signal [1]: Identity Commitment</div>
                <div className="text-xs font-mono text-zinc-300 truncate mt-1" title={signals[1]}>
                  {signals[1]}
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Poseidon(idNumber) hash</div>
              </div>
              <div className="p-3 bg-[#16161a] rounded-lg border border-zinc-800">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Signal [2]: ageThreshold</div>
                <div className="text-sm font-mono font-semibold text-zinc-200 mt-1">{signals[2]}</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Required minimum threshold</div>
              </div>
            </div>
          </div>

          {/* Elliptic Curve Group Elements */}
          <div className="space-y-3">
            <span className="font-medium text-zinc-200">Curve Elements & Pairing Coordinates</span>

            {/* pi_A */}
            <div className="p-3 bg-[#16161a] rounded-lg border border-zinc-800 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span className="font-mono text-zinc-200 font-semibold">&pi;_A &in; G1</span>
                <span className="text-zinc-500">affine (x, y) coordinates &middot; 254-bit prime field</span>
              </div>
              <div className="font-mono text-[11px] text-zinc-400 break-all select-all leading-relaxed bg-[#0c0c0e] p-2 rounded border border-zinc-800/80">
                [{proof.pi_a[0]}, {proof.pi_a[1]}]
              </div>
            </div>

            {/* pi_B */}
            <div className="p-3 bg-[#16161a] rounded-lg border border-zinc-800 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span className="font-mono text-zinc-200 font-semibold">&pi;_B &in; G2</span>
                <span className="text-zinc-500">F_q2 extension field elements (2x2 matrix)</span>
              </div>
              <div className="font-mono text-[11px] text-zinc-400 break-all select-all leading-relaxed bg-[#0c0c0e] p-2 rounded border border-zinc-800/80">
                [[{proof.pi_b[0][0]}, {proof.pi_b[0][1]}], [{proof.pi_b[1][0]}, {proof.pi_b[1][1]}]]
              </div>
            </div>

            {/* pi_C */}
            <div className="p-3 bg-[#16161a] rounded-lg border border-zinc-800 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span className="font-mono text-zinc-200 font-semibold">&pi;_C &in; G1</span>
                <span className="text-zinc-500">affine (x, y) coordinates</span>
              </div>
              <div className="font-mono text-[11px] text-zinc-400 break-all select-all leading-relaxed bg-[#0c0c0e] p-2 rounded border border-zinc-800/80">
                [{proof.pi_c[0]}, {proof.pi_c[1]}]
              </div>
            </div>
          </div>

          {/* Solidity Calldata */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-zinc-200 flex items-center space-x-1.5">
                <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                <span>Solidity Calldata for Verifier.sol</span>
              </span>
              <button
                onClick={() => copyToClipboard(proofResult.calldata.rawString, 'calldata')}
                className="text-zinc-400 hover:text-zinc-200 flex items-center space-x-1 text-[11px] transition-colors"
              >
                {copiedType === 'calldata' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === 'calldata' ? 'Copied' : 'Copy Calldata'}</span>
              </button>
            </div>
            <div className="p-3 bg-[#0c0c0e] rounded-lg border border-zinc-800 font-mono text-[11px] text-zinc-400 max-h-32 overflow-y-auto select-all break-all leading-relaxed">
              {proofResult.calldata.rawString}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-[#0c0c0e] flex items-center justify-between text-xs">
          <div className="text-zinc-500">
            Synthesized in <span className="text-zinc-300 font-mono font-medium">{proofResult.generationTimeMs}ms</span> via client-side WebAssembly.
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
