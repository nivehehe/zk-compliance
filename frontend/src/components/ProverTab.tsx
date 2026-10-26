import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  AlertCircle,
  CheckCircle2,
  Cpu,
  ArrowRight,
  RefreshCw,
  FileCode2,
} from 'lucide-react';
import { ZKComplianceInput, ProofResult, ComplianceRecord } from '../types/zk';
import { generateComplianceProof, verifyComplianceProof } from '../lib/zkProver';
import { blockchainService } from '../lib/mockBlockchain';
import { ComplianceBadge } from './ComplianceBadge';
import { ProofModal } from './ProofModal';

interface ProverTabProps {
  onComplianceSuccess: () => void;
  onNavigateToVault: () => void;
}

const PRESETS = [
  {
    id: 'adult',
    name: 'Adult Participant',
    age: 24,
    idNumber: '123456789',
    threshold: 18,
    badge: 'Valid',
    badgeColor: 'emerald',
    description: 'Age 24 &ge; 18. Satisfies standard compliance threshold.',
  },
  {
    id: 'underage',
    name: 'Underage Applicant',
    age: 16,
    idNumber: '987654321',
    threshold: 18,
    badge: 'Invalid',
    badgeColor: 'red',
    description: 'Age 16 < 18. Triggers constraint assertion failure.',
  },
  {
    id: 'investor',
    name: 'Accredited Tier',
    age: 38,
    idNumber: '445566778',
    threshold: 21,
    badge: 'Valid',
    badgeColor: 'zinc',
    description: 'Age 38 &ge; 21. Satisfies elevated threshold requirement.',
  },
];

export const ProverTab: React.FC<ProverTabProps> = ({
  onComplianceSuccess,
  onNavigateToVault,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('adult');
  const [formData, setFormData] = useState<ZKComplianceInput>({
    age: 24,
    idNumber: '123456789',
    ageThreshold: 18,
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progressStep, setProgressStep] = useState<string>('');
  const [proofResult, setProofResult] = useState<ProofResult | null>(null);
  const [isLocallyVerified, setIsLocallyVerified] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRegisteringOnChain, setIsRegisteringOnChain] = useState<boolean>(false);
  const [onChainRecord, setOnChainRecord] = useState<ComplianceRecord | null>(
    blockchainService.getComplianceRecord()
  );
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleSelectPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    setProofResult(null);
    setErrorMessage(null);
    setIsLocallyVerified(null);

    const found = PRESETS.find((p) => p.id === presetId);
    if (found) {
      setFormData({
        age: found.age,
        idNumber: found.idNumber,
        ageThreshold: found.threshold,
      });
    }
  };

  const handleGenerateProof = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setProofResult(null);
    setIsLocallyVerified(null);

    try {
      // 1. Generate proof via client-side WebAssembly
      const result = await generateComplianceProof(formData, (step) => {
        setProgressStep(step);
      });
      setProofResult(result);

      // 2. Perform in-browser verification
      setProgressStep('Verifying proof against verification key in browser...');
      const verified = await verifyComplianceProof(result.proof, result.publicSignals);
      setIsLocallyVerified(verified);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Proof generation failed');
    } finally {
      setIsLoading(false);
      setProgressStep('');
    }
  };

  const handleRegisterOnChain = async () => {
    if (!proofResult) return;
    setIsRegisteringOnChain(true);
    try {
      await blockchainService.registerComplianceOnChain(
        proofResult.publicSignals[1],
        Number(proofResult.publicSignals[2]),
        proofResult.calldata
      );
      const rec = blockchainService.getComplianceRecord();
      setOnChainRecord(rec);
      onComplianceSuccess();
    } catch (err: any) {
      alert(`On-chain registration failed: ${err.message}`);
    } finally {
      setIsRegisteringOnChain(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Title & Introduction */}
      <div className="space-y-2 border-b border-zinc-800 pb-5">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
            Client-Side Cryptographic Prover
          </span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
          Zero-Knowledge Compliance Prover
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
          Prove age eligibility (&ge; threshold) and commit a verifiable identity hash to the blockchain using Circom 2.0 and Groth16 zk-SNARKs. Private attributes remain local to this device.
        </p>
      </div>

      {/* Preset Scenarios */}
      <div className="space-y-2.5">
        <label className="block text-xs font-medium text-zinc-400">
          Evaluation Presets
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PRESETS.map((preset) => {
            const isSelected = selectedPreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.id)}
                className={`text-left p-3.5 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-[#16161a] border-zinc-500 shadow-xs'
                    : 'bg-[#111114] border-zinc-800 hover:border-zinc-700 hover:bg-[#141417]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-xs text-zinc-200">{preset.name}</span>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                      preset.badgeColor === 'emerald'
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                        : preset.badgeColor === 'red'
                        ? 'bg-red-950/60 text-red-400 border border-red-800/60'
                        : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                    }`}
                  >
                    {preset.badge}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 mb-2 leading-relaxed">
                  {preset.description}
                </div>
                <div className="flex items-center space-x-3 text-[11px] font-mono text-zinc-500">
                  <span>Age: {preset.age}</span>
                  <span>&middot;</span>
                  <span>Threshold: {preset.threshold}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-[#111114] p-5 rounded-xl border border-zinc-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-zinc-400" />
                <h3 className="font-medium text-sm text-zinc-200">Circuit Inputs</h3>
              </div>
              <span className="text-[11px] font-mono text-zinc-500">
                WASM Witness Synthesis
              </span>
            </div>

            <form onSubmit={handleGenerateProof} className="space-y-4">
              {/* Age */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Age (Private Witness Signal)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={formData.age}
                    onChange={(e) => {
                      setSelectedPreset('custom');
                      setFormData({ ...formData, age: parseInt(e.target.value) || 0 });
                    }}
                    required
                    className="w-full bg-[#0c0c0e] border border-zinc-800 rounded-md px-3 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
                  />
                  <div className="absolute right-3 top-2 text-xs text-zinc-500 font-mono">
                    years
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Private input. Evaluated against ageThreshold inside the circuit.
                </p>
              </div>

              {/* National ID */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  National ID / Passport Number (Private Witness)
                </label>
                <input
                  type="text"
                  value={formData.idNumber}
                  onChange={(e) => {
                    setSelectedPreset('custom');
                    setFormData({ ...formData, idNumber: e.target.value });
                  }}
                  required
                  placeholder="e.g. 123456789"
                  className="w-full bg-[#0c0c0e] border border-zinc-800 rounded-md px-3 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Hashed with Poseidon(1) inside the circuit to create a public commitment.
                </p>
              </div>

              {/* Age Threshold */}
              <div className="pt-2 border-t border-zinc-800/80">
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Regulatory Minimum Threshold (Public Signal)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, ageThreshold: 18 })}
                    className={`py-2 px-3 rounded-md text-xs font-medium border text-center transition-all ${
                      formData.ageThreshold === 18
                        ? 'bg-zinc-800 text-zinc-100 border-zinc-600'
                        : 'bg-[#0c0c0e] text-zinc-400 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    18+ (General Access)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, ageThreshold: 21 })}
                    className={`py-2 px-3 rounded-md text-xs font-medium border text-center transition-all ${
                      formData.ageThreshold === 21
                        ? 'bg-zinc-800 text-zinc-100 border-zinc-600'
                        : 'bg-[#0c0c0e] text-zinc-400 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    21+ (Accredited Tier)
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-md font-medium text-xs text-zinc-950 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2 mt-4 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-950" />
                    <span>Computing Proof in WebAssembly...</span>
                  </>
                ) : (
                  <>
                    <Cpu className="w-3.5 h-3.5 text-zinc-950" />
                    <span>Generate Zero-Knowledge Proof</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Privacy Note */}
          <div className="p-3.5 rounded-lg bg-[#111114] border border-zinc-800 text-xs text-zinc-400 flex items-start space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-medium text-zinc-300">Privacy Guarantee: </span>
              Personal attributes are processed in browser memory and are never transmitted across the network or stored in contract state.
            </div>
          </div>
        </div>

        {/* Right Column: Results & Active Status */}
        <div className="lg:col-span-6 space-y-5">
          {/* Progress Banner */}
          {isLoading && (
            <div className="bg-[#111114] p-5 rounded-xl border border-zinc-800 space-y-3">
              <div className="flex items-center space-x-2 text-zinc-200 text-xs font-medium">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                <span>Generating Cryptographic Proof</span>
              </div>
              <div className="p-2.5 rounded bg-[#0c0c0e] border border-zinc-800 font-mono text-xs text-zinc-400">
                &gt; {progressStep}
              </div>
            </div>
          )}

          {/* Constraint Rejection Display */}
          {errorMessage && (
            <div className="bg-red-950/20 p-5 rounded-xl border border-red-900/50 space-y-3">
              <div className="flex items-center space-x-2 text-red-400 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Circuit Constraint Violated</span>
              </div>
              <p className="text-xs text-zinc-300 font-mono bg-[#0c0c0e] p-3 rounded border border-red-900/40 leading-relaxed">
                {errorMessage}
              </p>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Because the age ({formData.age}) is below the required threshold ({formData.ageThreshold}), the constraint <code className="text-zinc-400">isEligible === 1</code> cannot be satisfied. A valid witness cannot be synthesized.
              </p>
            </div>
          )}

          {/* Generated Proof Card */}
          {proofResult && isLocallyVerified && (
            <div className="bg-[#111114] p-5 rounded-xl border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-xs text-zinc-200">Proof Synthesized & Verified Locally</span>
                </div>
                <span className="text-[11px] font-mono text-zinc-400 bg-[#0c0c0e] px-2 py-0.5 rounded border border-zinc-800">
                  {proofResult.generationTimeMs}ms
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Cryptographic Protocol:</span>
                  <span className="font-mono text-zinc-200">Groth16 / BN128</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Client-Side Verification:</span>
                  <span className="text-emerald-400 font-medium">Valid</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Poseidon Commitment:</span>
                  <span className="font-mono text-zinc-300 truncate max-w-[220px]" title={proofResult.publicSignals[1]}>
                    {proofResult.publicSignals[1]}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="flex-1 py-2 px-3 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors flex items-center justify-center space-x-1.5"
                >
                  <FileCode2 className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Inspect Calldata</span>
                </button>

                <button
                  type="button"
                  onClick={handleRegisterOnChain}
                  disabled={isRegisteringOnChain}
                  className="flex-1 py-2 px-3 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isRegisteringOnChain ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting to EVM...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Submit On-Chain</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Active On-Chain Record */}
          {onChainRecord && onChainRecord.isVerified && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-300">Active Credential</span>
                <button
                  type="button"
                  onClick={onNavigateToVault}
                  className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center space-x-1 transition-colors"
                >
                  <span>Go to Compliant Vault</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <ComplianceBadge
                record={onChainRecord}
                proofResult={proofResult}
                onOpenProofModal={() => setIsModalOpen(true)}
              />
            </div>
          )}

          {/* Awaiting Action State */}
          {!proofResult && !errorMessage && !isLoading && !onChainRecord && (
            <div className="bg-[#111114] p-8 rounded-xl border border-zinc-800 text-center space-y-3">
              <div className="w-9 h-9 rounded-md bg-[#16161a] border border-zinc-800 mx-auto flex items-center justify-center text-zinc-500">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium text-zinc-300">Ready to Generate Proof</div>
                <p className="text-[11px] text-zinc-500 max-w-xs mx-auto leading-relaxed">
                  Select a test preset above or customize the inputs, then click Generate Zero-Knowledge Proof.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <ProofModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        proofResult={proofResult}
      />
    </div>
  );
};
