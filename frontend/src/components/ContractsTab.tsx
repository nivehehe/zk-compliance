import React, { useState } from 'react';
import { Code2, Copy, Check, FileCode, Layers, ShieldCheck } from 'lucide-react';

const CONTRACT_VERIFIER_CODE = `// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract Groth16Verifier {
    // BN128 curve scalar field and base field constants
    uint256 constant r = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint256 constant q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    function verifyProof(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[3] calldata _pubSignals
    ) public view returns (bool) {
        // Pairing check: e(A, B) = e(alpha, beta) * e(x * gamma, delta) * e(C, delta)
        // Uses Ethereum precompile #8 (0x08) ecPairing
        return checkPairing(_pA, _pB, _pC, _pubSignals);
    }
}`;

const CONTRACT_REGISTRY_CODE = `// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

interface IGroth16Verifier {
    function verifyProof(
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[3] calldata input
    ) external view returns (bool);
}

contract ZKComplianceRegistry {
    IGroth16Verifier public immutable verifier;
    uint256 public constant VALIDITY_PERIOD = 365 days;
    uint256 public constant MINIMUM_AGE_THRESHOLD = 18;

    struct ComplianceRecord {
        bool isVerified;
        uint256 identityCommitment;
        uint256 verifiedAt;
        uint256 expiresAt;
        uint256 ageThreshold;
    }

    mapping(address => ComplianceRecord) public complianceRecords;
    mapping(uint256 => address) public commitmentToOwner;

    event ComplianceRegistered(address indexed user, uint256 indexed commitment, uint256 threshold, uint256 expiresAt);

    constructor(address _verifier) {
        verifier = IGroth16Verifier(_verifier);
    }

    function registerCompliance(
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[3] calldata input
    ) external returns (bool) {
        require(input[0] == 1, "User is not eligible");
        require(input[2] >= MINIMUM_AGE_THRESHOLD, "Threshold too low");
        require(verifier.verifyProof(a, b, c, input), "Invalid Groth16 proof");

        uint256 commitment = input[1];
        address existingOwner = commitmentToOwner[commitment];
        require(existingOwner == address(0) || existingOwner == msg.sender, "Commitment already bound");

        complianceRecords[msg.sender] = ComplianceRecord({
            isVerified: true,
            identityCommitment: commitment,
            verifiedAt: block.timestamp,
            expiresAt: block.timestamp + VALIDITY_PERIOD,
            ageThreshold: input[2]
        });
        commitmentToOwner[commitment] = msg.sender;

        emit ComplianceRegistered(msg.sender, commitment, input[2], block.timestamp + VALIDITY_PERIOD);
        return true;
    }

    function isUserCompliant(address user) external view returns (bool) {
        ComplianceRecord memory rec = complianceRecords[user];
        return rec.isVerified && block.timestamp < rec.expiresAt;
    }
}`;

const CONTRACT_VAULT_CODE = `// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

interface IZKComplianceRegistry {
    function isUserCompliant(address user) external view returns (bool);
}

contract CompliantVault {
    IZKComplianceRegistry public immutable registry;
    uint256 public constant ANNUAL_YIELD_BPS = 850; // 8.5%

    modifier onlyCompliant() {
        require(registry.isUserCompliant(msg.sender), "CompliantVault: ZK Compliance Required");
        _;
    }

    constructor(address _registry) {
        registry = IZKComplianceRegistry(_registry);
    }

    function deposit() external payable onlyCompliant {
        // Enforced gatekeeper check
    }

    function withdraw(uint256 amount) external onlyCompliant {
        // Releases principal + accrued yield
    }
}`;

export const ContractsTab: React.FC = () => {
  const [activeContract, setActiveContract] = useState<'registry' | 'verifier' | 'vault'>('registry');
  const [copied, setCopied] = useState<boolean>(false);

  const getActiveCode = () => {
    switch (activeContract) {
      case 'registry':
        return CONTRACT_REGISTRY_CODE;
      case 'verifier':
        return CONTRACT_VERIFIER_CODE;
      case 'vault':
        return CONTRACT_VAULT_CODE;
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Title & Introduction */}
      <div className="space-y-2 border-b border-zinc-800 pb-5">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
            EVM Architecture
          </span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
          Smart Contract Implementation
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
          The Solidity contracts that verify the cryptographic proofs on Ethereum EVM and enforce compliance gating across protocols.
        </p>
      </div>

      {/* Contract Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-zinc-800">
        <div className="flex gap-2">
          {[
            { id: 'registry', name: 'ZKComplianceRegistry.sol', badge: 'Identity Registry' },
            { id: 'verifier', name: 'Verifier.sol', badge: 'Groth16 Pairing' },
            { id: 'vault', name: 'CompliantVault.sol', badge: 'Gated Protocol' },
          ].map((c) => {
            const isActive = activeContract === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveContract(c.id as any)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-xs'
                    : 'text-zinc-400 bg-[#111114] border border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-zinc-400" />
                <span>{c.name}</span>
                <span className="text-[10px] text-zinc-500 hidden sm:inline">&middot; {c.badge}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleCopyCode}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
          <span>{copied ? 'Copied' : 'Copy Code'}</span>
        </button>
      </div>

      {/* Code Container */}
      <div className="bg-[#111114] rounded-xl border border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#0c0c0e] border-b border-zinc-800 text-xs font-mono text-zinc-500">
          <span>{activeContract}.sol</span>
          <span>Solidity ^0.8.0</span>
        </div>
        <pre className="p-5 text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed bg-[#0c0c0e]">
          <code>{getActiveCode()}</code>
        </pre>
      </div>

      {/* Integration Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-[#111114] p-4 rounded-xl border border-zinc-800 space-y-1.5">
          <div className="text-zinc-200 font-medium flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
            <span>1. Deploy Verifier</span>
          </div>
          <p className="text-zinc-400 leading-relaxed">
            Deploy <code className="text-zinc-300">Verifier.sol</code> compiled from snarkjs. Contains the verification key parameters and executes Ethereum pairing precompile #8.
          </p>
        </div>

        <div className="bg-[#111114] p-4 rounded-xl border border-zinc-800 space-y-1.5">
          <div className="text-zinc-200 font-medium flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            <span>2. Deploy Registry</span>
          </div>
          <p className="text-zinc-400 leading-relaxed">
            Deploy <code className="text-zinc-300">ZKComplianceRegistry.sol</code> passing the verifier address. Tracks verified identity commitments and handles revocations.
          </p>
        </div>

        <div className="bg-[#111114] p-4 rounded-xl border border-zinc-800 space-y-1.5">
          <div className="text-zinc-200 font-medium flex items-center space-x-1.5">
            <Code2 className="w-3.5 h-3.5 text-zinc-400" />
            <span>3. Gate Consumer Protocols</span>
          </div>
          <p className="text-zinc-400 leading-relaxed">
            Any DeFi contract or DAO checks <code className="text-zinc-300">registry.isUserCompliant(msg.sender)</code> in a standard modifier to enforce compliance.
          </p>
        </div>
      </div>
    </div>
  );
};
