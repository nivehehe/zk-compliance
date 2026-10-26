import React, { useState } from 'react';
import { ShieldCheck, Lock, Copy, Download, ExternalLink, Calendar, KeyRound, Check } from 'lucide-react';
import { ComplianceRecord, ProofResult } from '../types/zk';

interface ComplianceBadgeProps {
  record: ComplianceRecord;
  proofResult?: ProofResult | null;
  onOpenProofModal?: () => void;
}

export const ComplianceBadge: React.FC<ComplianceBadgeProps> = ({
  record,
  proofResult,
  onOpenProofModal,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCommitment = () => {
    navigator.clipboard.writeText(record.identityCommitment);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadProof = () => {
    if (!proofResult) return;
    const blob = new Blob(
      [
        JSON.stringify(
          {
            proof: proofResult.proof,
            publicSignals: proofResult.publicSignals,
            calldata: proofResult.calldata,
            metadata: {
              protocol: 'Groth16 (bn128)',
              circuit: 'compliance.circom',
              generatedAt: new Date(record.verifiedAt).toISOString(),
            },
          },
          null,
          2
        ),
      ],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zk-compliance-proof-${record.walletAddress.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formattedExpiry = new Date(record.expiresAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="w-full bg-[#111114] border border-zinc-800 rounded-xl p-5 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-zinc-300" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
            Compliance Attestation Record
          </span>
        </div>
        <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700 text-[11px] text-zinc-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Verified on EVM</span>
        </div>
      </div>

      {/* Identity Commitment Box */}
      <div className="bg-[#0c0c0e] rounded-lg p-3 border border-zinc-800/80 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-zinc-400">
          <span className="flex items-center space-x-1">
            <Lock className="w-3 h-3 text-zinc-400" />
            <span>Poseidon Identity Commitment</span>
          </span>
          <button
            onClick={handleCopyCommitment}
            className="text-zinc-400 hover:text-zinc-200 flex items-center space-x-1 text-[11px] transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy Hash'}</span>
          </button>
        </div>
        <div className="font-mono text-xs text-zinc-300 break-all select-all leading-relaxed">
          {record.identityCommitment}
        </div>
        <div className="text-[10px] text-zinc-500">
          One-way cryptographic hash of private identity. Raw ID is not stored.
        </div>
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="bg-[#16161a] p-2.5 rounded-lg border border-zinc-800">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider flex items-center space-x-1">
            <KeyRound className="w-3 h-3" />
            <span>Bound Wallet Address</span>
          </div>
          <div className="font-mono text-zinc-300 mt-0.5 truncate" title={record.walletAddress}>
            {record.walletAddress}
          </div>
        </div>

        <div className="bg-[#16161a] p-2.5 rounded-lg border border-zinc-800">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>Validity Expiration</span>
          </div>
          <div className="text-zinc-300 font-medium mt-0.5">
            {formattedExpiry}
          </div>
        </div>
      </div>

      <div className="p-2.5 rounded-lg bg-[#16161a] border border-zinc-800 flex items-center justify-between text-xs">
        <div>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Proved Constraint</span>
          <span className="text-zinc-300 font-medium">Age &ge; {record.ageThreshold} years (Threshold Satisfied)</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Scheme</span>
          <span className="font-mono text-zinc-400">Groth16 / BN128</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex items-center gap-2">
        {proofResult && (
          <button
            onClick={onOpenProofModal}
            className="flex-1 px-3 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors flex items-center justify-center space-x-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            <span>Inspect Proof Details</span>
          </button>
        )}

        {proofResult && (
          <button
            onClick={handleDownloadProof}
            className="px-3 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs font-medium transition-colors flex items-center space-x-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download JSON</span>
          </button>
        )}
      </div>
    </div>
  );
};
