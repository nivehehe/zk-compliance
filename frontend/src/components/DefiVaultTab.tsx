import React, { useState, useEffect } from 'react';
import {
  Landmark,
  ShieldCheck,
  ShieldAlert,
  ArrowDownRight,
  ArrowUpRight,
  Lock,
  RefreshCw,
  Info,
} from 'lucide-react';
import { blockchainService, BlockchainTransaction } from '../lib/mockBlockchain';

interface DefiVaultTabProps {
  onNavigateToProver: () => void;
  onStateChange: () => void;
}

export const DefiVaultTab: React.FC<DefiVaultTabProps> = ({
  onNavigateToProver,
  onStateChange,
}) => {
  const isCompliant = blockchainService.isWalletCompliant();
  const complianceRecord = blockchainService.getComplianceRecord();
  const [vaultBalance, setVaultBalance] = useState<number>(blockchainService.getVaultBalance());
  const [accruedYield, setAccruedYield] = useState<number>(blockchainService.getAccruedVaultYield());
  const [depositAmount, setDepositAmount] = useState<string>('1.0');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('0.5');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>(
    blockchainService.getTransactions()
  );

  // Streaming real-time yield counter ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setAccruedYield(blockchainService.getAccruedVaultYield());
    }, 500);
    return () => clearInterval(interval);
  }, [vaultBalance]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) return;

    setIsProcessing(true);
    try {
      await blockchainService.depositToVault(amount);
      setVaultBalance(blockchainService.getVaultBalance());
      setTransactions(blockchainService.getTransactions());
      onStateChange();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) return;

    setIsProcessing(true);
    try {
      await blockchainService.withdrawFromVault(amount);
      setVaultBalance(blockchainService.getVaultBalance());
      setTransactions(blockchainService.getTransactions());
      onStateChange();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
              Compliant Liquidity Vault
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-800 border border-zinc-700 text-zinc-300">
              Contract Gated
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Institutional yield pool demonstrating compliance enforcement via on-chain Zero-Knowledge verification.
          </p>
        </div>

        {/* Live Gate Status Indicator */}
        <div className="shrink-0">
          {isCompliant ? (
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#111114] border border-zinc-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-medium text-zinc-200">Compliance Verified</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#111114] border border-zinc-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
              <span className="font-medium text-zinc-400">Proof Required</span>
            </div>
          )}
        </div>
      </div>

      {/* Access Restriction Banner when Not Compliant */}
      {!isCompliant && (
        <div className="rounded-xl p-5 bg-[#111114] border border-zinc-800 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-md bg-zinc-800 border border-zinc-700 shrink-0 text-zinc-300">
                <Lock className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-semibold text-zinc-200">Compliance Clearance Required</h3>
                <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                  Institutional regulations require proof of age (&ge; 18) before depositing capital. Generate a zero-knowledge proof to unlock access without exposing identity attributes.
                </p>
              </div>
            </div>
            <button
              onClick={onNavigateToProver}
              className="px-3.5 py-2 rounded-md font-medium text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-950 whitespace-nowrap transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Generate ZK Proof</span>
            </button>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111114] p-4 rounded-xl border border-zinc-800">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
            <span>Deposited Principal</span>
            <Landmark className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="text-xl font-bold text-zinc-100 font-mono">
            {vaultBalance.toFixed(4)} <span className="text-xs font-normal text-zinc-500 font-sans">ETH</span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            ≈ ${(vaultBalance * 3200).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
          </div>
        </div>

        <div className="bg-[#111114] p-4 rounded-xl border border-zinc-800">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
            <span>Accrued Yield</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono">
            +{accruedYield.toFixed(6)} <span className="text-xs font-normal text-zinc-500 font-sans">ETH</span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            Continuous compound streaming
          </div>
        </div>

        <div className="bg-[#111114] p-4 rounded-xl border border-zinc-800">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
            <span>Annual Percentage Yield</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
              Variable
            </span>
          </div>
          <div className="text-xl font-bold text-zinc-100 font-mono">
            8.50% <span className="text-xs font-normal text-zinc-500 font-sans">APY</span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            Fixed benchmark rate
          </div>
        </div>

        <div className="bg-[#111114] p-4 rounded-xl border border-zinc-800">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
            <span>Access Status</span>
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="text-sm font-semibold text-zinc-200 mt-0.5">
            {isCompliant ? (
              <span className="text-emerald-400">Permitted</span>
            ) : (
              <span className="text-zinc-500">Restricted</span>
            )}
          </div>
          <div className="text-[11px] font-mono text-zinc-500 mt-0.5 truncate">
            {complianceRecord ? `ID: ${complianceRecord.identityCommitment.slice(0, 10)}...` : 'Unregistered'}
          </div>
        </div>
      </div>

      {/* Deposit & Withdraw Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Deposit */}
        <div className={`bg-[#111114] p-5 rounded-xl border transition-all ${
          isCompliant ? 'border-zinc-800' : 'border-zinc-800/40 opacity-50'
        }`}>
          <div className="flex items-center space-x-2 pb-3 border-b border-zinc-800 mb-4">
            <ArrowDownRight className="w-4 h-4 text-zinc-300" />
            <h3 className="font-medium text-xs text-zinc-200 uppercase tracking-wider">Deposit Capital</h3>
          </div>

          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Amount (ETH)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  disabled={!isCompliant || isProcessing}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-[#0c0c0e] border border-zinc-800 rounded-md px-3 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 disabled:cursor-not-allowed"
                />
                <div className="absolute right-2.5 top-2 flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => setDepositAmount('1.0')}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 hover:text-white"
                  >
                    1 ETH
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositAmount('5.0')}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 hover:text-white"
                  >
                    5 ETH
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!isCompliant || isProcessing}
              className="w-full py-2.5 px-4 rounded-md font-medium text-xs text-zinc-950 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-950" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Deposit ETH</span>
              )}
            </button>
          </form>
        </div>

        {/* Withdraw */}
        <div className={`bg-[#111114] p-5 rounded-xl border transition-all ${
          isCompliant ? 'border-zinc-800' : 'border-zinc-800/40 opacity-50'
        }`}>
          <div className="flex items-center space-x-2 pb-3 border-b border-zinc-800 mb-4">
            <ArrowUpRight className="w-4 h-4 text-zinc-300" />
            <h3 className="font-medium text-xs text-zinc-200 uppercase tracking-wider">Withdraw Capital</h3>
          </div>

          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                <span>Amount (ETH)</span>
                <span>Available: {(vaultBalance + accruedYield).toFixed(4)} ETH</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  disabled={!isCompliant || isProcessing || vaultBalance <= 0}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full bg-[#0c0c0e] border border-zinc-800 rounded-md px-3 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setWithdrawAmount((vaultBalance + accruedYield).toFixed(4))}
                  disabled={!isCompliant || vaultBalance <= 0}
                  className="absolute right-2.5 top-2 text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 hover:text-white disabled:opacity-40"
                >
                  Max
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={!isCompliant || isProcessing || vaultBalance <= 0}
              className="w-full py-2.5 px-4 rounded-md font-medium text-xs text-zinc-200 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-200" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Withdraw Principal & Yield</span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Transaction History Log */}
      <div className="bg-[#111114] p-5 rounded-xl border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <h3 className="font-semibold text-xs text-zinc-200 uppercase tracking-wider">
            On-Chain Audit Log
          </h3>
          <span className="text-[11px] font-mono text-zinc-500">
            {transactions.length} Transactions Recorded
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-6 text-xs text-zinc-500">
            No transactions executed on this wallet session yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[10px] text-zinc-500 uppercase border-b border-zinc-800">
                <tr>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Tx Hash</th>
                  <th className="pb-2">Block</th>
                  <th className="pb-2">Gas</th>
                  <th className="pb-2">Details</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {transactions.map((tx) => (
                  <tr key={tx.hash} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="py-2.5 font-sans">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 border border-zinc-700 text-zinc-300">
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-2.5 text-zinc-400">
                      {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}
                    </td>
                    <td className="py-2.5 text-zinc-500">{tx.blockNumber}</td>
                    <td className="py-2.5 text-zinc-500">{tx.gasUsed.toLocaleString()}</td>
                    <td className="py-2.5 font-sans text-xs text-zinc-300 truncate max-w-xs">{tx.details}</td>
                    <td className="py-2.5 text-right font-sans">
                      <span className="text-[10px] text-emerald-400 font-medium">Confirmed</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Note */}
      <div className="p-4 rounded-lg bg-[#111114] border border-zinc-800 flex items-start space-x-2.5 text-xs text-zinc-400">
        <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-zinc-300">Enterprise Compliance Context: </strong>
          Institutional pools require verified counterparty checks without storing PII on a public ledger. Zero-knowledge proofs allow contracts to execute the gatekeeper verification at the EVM state transition level.
        </p>
      </div>
    </div>
  );
};
