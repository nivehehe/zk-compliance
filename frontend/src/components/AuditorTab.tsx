import React, { useState } from 'react';
import {
  FileSearch,
  CheckCircle2,
  XCircle,
  Upload,
  RefreshCw,
  FileCheck2,
  AlertTriangle,
  Fingerprint,
} from 'lucide-react';
import { verifyComplianceProof } from '../lib/zkProver';

export const AuditorTab: React.FC = () => {
  const [proofJsonInput, setProofJsonInput] = useState<string>('');
  const [publicJsonInput, setPublicJsonInput] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<{
    status: 'valid' | 'invalid' | null;
    message: string;
    signals?: string[];
  }>({ status: null, message: '' });

  const loadCurrentGeneratedProof = async () => {
    try {
      const [pRes, sRes] = await Promise.all([
        fetch('/proof.json'),
        fetch('/public.json'),
      ]);
      if (pRes.ok) {
        const pText = await pRes.text();
        setProofJsonInput(pText);
      }
      if (sRes.ok) {
        const sText = await sRes.text();
        setPublicJsonInput(sText);
      }
    } catch (e) {
      console.warn('Failed to load sample proof:', e);
    }
  };

  const handleSimulateTamper = () => {
    try {
      const parsed = JSON.parse(
        publicJsonInput ||
          '["1", "7110303097080024260800444665787206606103183587082596139871399733998958991511", "18"]'
      );
      parsed[1] = '9999999999999999999999999999999999999999999999999999999999999999999';
      setPublicJsonInput(JSON.stringify(parsed, null, 2));
      setVerificationResult({
        status: null,
        message: 'Public signals have been modified. Run verification to test cryptographic tamper detection.',
      });
    } catch (e) {
      alert('Invalid public signals JSON to modify');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setVerificationResult({ status: null, message: '' });

    try {
      const proof = JSON.parse(proofJsonInput);
      const publicSignals = JSON.parse(publicJsonInput);

      if (!Array.isArray(publicSignals) || publicSignals.length < 3) {
        throw new Error('Public signals must be an array of at least 3 elements: [isEligible, identityCommitment, ageThreshold]');
      }

      const isValid = await verifyComplianceProof(proof, publicSignals);

      if (isValid) {
        setVerificationResult({
          status: 'valid',
          message: 'Bilinear pairing check verified successfully. The proof matches the verification key and public signals have not been altered.',
          signals: publicSignals,
        });
      } else {
        setVerificationResult({
          status: 'invalid',
          message: 'Bilinear pairing check failed: The proof is invalid, forged, or the public signals do not match the witness commitments.',
          signals: publicSignals,
        });
      }
    } catch (err: any) {
      setVerificationResult({
        status: 'invalid',
        message: `Verification Error: ${err.message}`,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Title & Introduction */}
      <div className="space-y-2 border-b border-zinc-800 pb-5">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
            Independent Verification
          </span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
          Auditor & Regulator Verification Portal
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
          Verify any Groth16 compliance proof and public signal set against the verification key without requiring access to the private witness attributes.
        </p>
      </div>

      {/* Preset Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg bg-[#111114] border border-zinc-800">
        <span className="text-xs font-medium text-zinc-300 flex items-center space-x-1.5">
          <Upload className="w-3.5 h-3.5 text-zinc-400" />
          <span>Sample Actions</span>
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadCurrentGeneratedProof}
            className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
          >
            Load Valid Reference Proof
          </button>
          <button
            type="button"
            onClick={handleSimulateTamper}
            className="px-3 py-1.5 rounded-md bg-red-950/40 hover:bg-red-900/40 text-red-300 border border-red-900/60 text-xs font-medium transition-colors flex items-center space-x-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Simulate Signal Tamper</span>
          </button>
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleVerify} className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Proof JSON */}
          <div className="bg-[#111114] p-4 rounded-xl border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <label className="text-xs font-medium text-zinc-300">
                1. proof.json (Curve Points)
              </label>
              <span className="text-[10px] font-mono text-zinc-500">JSON</span>
            </div>
            <textarea
              rows={9}
              required
              value={proofJsonInput}
              onChange={(e) => setProofJsonInput(e.target.value)}
              placeholder='Paste proof.json content here (containing "pi_a", "pi_b", "pi_c")...'
              className="w-full bg-[#0c0c0e] border border-zinc-800 rounded-lg p-3 font-mono text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>

          {/* Public Signals JSON */}
          <div className="bg-[#111114] p-4 rounded-xl border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <label className="text-xs font-medium text-zinc-300">
                2. public.json (Public Signals)
              </label>
              <span className="text-[10px] font-mono text-zinc-500">[isEligible, commitment, threshold]</span>
            </div>
            <textarea
              rows={9}
              required
              value={publicJsonInput}
              onChange={(e) => setPublicJsonInput(e.target.value)}
              placeholder='Paste public.json content here (e.g. ["1", "71103030...", "18"])...'
              className="w-full bg-[#0c0c0e] border border-zinc-800 rounded-lg p-3 font-mono text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isVerifying || !proofJsonInput || !publicJsonInput}
          className="w-full py-2.5 px-4 rounded-md font-medium text-xs text-zinc-950 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-40 transition-colors flex items-center justify-center space-x-2 cursor-pointer"
        >
          {isVerifying ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-950" />
              <span>Verifying Cryptographic Pairings...</span>
            </>
          ) : (
            <>
              <FileCheck2 className="w-3.5 h-3.5 text-zinc-950" />
              <span>Verify Cryptographic Pairings</span>
            </>
          )}
        </button>
      </form>

      {/* Verification Result Display */}
      {verificationResult.status && (
        <div
          className={`p-5 rounded-xl border transition-all ${
            verificationResult.status === 'valid'
              ? 'bg-emerald-950/15 border-emerald-900/50'
              : 'bg-red-950/15 border-red-900/50'
          }`}
        >
          <div className="flex items-start space-x-3.5">
            <div
              className={`p-2 rounded-md shrink-0 ${
                verificationResult.status === 'valid'
                  ? 'bg-emerald-900/30 text-emerald-400'
                  : 'bg-red-900/30 text-red-400'
              }`}
            >
              {verificationResult.status === 'valid' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
            </div>

            <div className="space-y-3 flex-1 text-xs">
              <div>
                <div className="flex items-center space-x-2">
                  <h3
                    className={`font-semibold text-sm ${
                      verificationResult.status === 'valid' ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {verificationResult.status === 'valid'
                      ? 'Proof Authenticated'
                      : 'Verification Rejected'}
                  </h3>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-medium ${
                      verificationResult.status === 'valid'
                        ? 'bg-emerald-900/40 text-emerald-300'
                        : 'bg-red-900/40 text-red-300'
                    }`}
                  >
                    {verificationResult.status === 'valid' ? 'Valid' : 'Invalid / Tampered'}
                  </span>
                </div>
                <p className="text-zinc-400 mt-1 leading-relaxed">
                  {verificationResult.message}
                </p>
              </div>

              {verificationResult.signals && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-zinc-800">
                  <div className="p-2.5 rounded bg-[#0c0c0e] border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Eligibility Output</div>
                    <div className="font-mono text-zinc-200 mt-0.5">
                      {verificationResult.signals[0] === '1' ? '1 (Satisfied)' : '0 (Unsatisfied)'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded bg-[#0c0c0e] border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Committed Identity Hash</div>
                    <div className="font-mono text-zinc-300 mt-0.5 truncate" title={verificationResult.signals[1]}>
                      {verificationResult.signals[1]}
                    </div>
                  </div>
                  <div className="p-2.5 rounded bg-[#0c0c0e] border border-zinc-800">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Target Threshold</div>
                    <div className="font-mono text-zinc-200 mt-0.5">
                      &ge; {verificationResult.signals[2]} years
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cryptographic Reference */}
      <div className="p-4 rounded-lg bg-[#111114] border border-zinc-800 space-y-1.5 text-xs text-zinc-400">
        <h4 className="font-medium text-zinc-300 flex items-center space-x-1.5">
          <Fingerprint className="w-3.5 h-3.5 text-zinc-400" />
          <span>Pairing Equation Verification</span>
        </h4>
        <p className="leading-relaxed">
          The Groth16 verification check evaluates the bilinear pairing equation over the BN128 curve:
          <span className="block font-mono text-zinc-300 py-1 bg-[#0c0c0e] p-2 rounded border border-zinc-800 my-1">
            e(A, B) = e(&alpha;, &beta;) &middot; e(x &middot; &gamma;, &delta;) &middot; e(C, &delta;)
          </span>
          No adversary can forge a valid proof or modify the public signals without breaking the discrete logarithm hardness assumption over the underlying curve.
        </p>
      </div>
    </div>
  );
};
