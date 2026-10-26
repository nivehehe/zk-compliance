import React, { useState } from 'react';
import { ShieldCheck, Landmark, FileSearch, Binary, Code2, RefreshCw, Wallet } from 'lucide-react';
import { blockchainService } from '../lib/mockBlockchain';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCompliant: boolean;
  onWalletChange: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isCompliant,
  onWalletChange,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const walletAddress = blockchainService.getWalletAddress();

  const navItems = [
    { id: 'prover', label: 'Prover', icon: ShieldCheck },
    { id: 'vault', label: 'Compliant Vault', icon: Landmark },
    { id: 'auditor', label: 'Auditor & Verifier', icon: FileSearch },
    { id: 'visualizer', label: 'ZK Architecture', icon: Binary },
    { id: 'contracts', label: 'Smart Contracts', icon: Code2 },
  ];

  const handleSwitchWallet = () => {
    blockchainService.generateRandomWallet();
    onWalletChange();
    setDropdownOpen(false);
  };

  const handleResetData = () => {
    if (confirm('Reset credentials, simulated deposits, and transaction history?')) {
      blockchainService.resetAllData();
      onWalletChange();
      setDropdownOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-[#09090b]/95 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Brand */}
          <div
            className="flex items-center space-x-2.5 cursor-pointer select-none"
            onClick={() => setActiveTab('prover')}
          >
            <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200">
              <ShieldCheck className="w-4 h-4 text-zinc-200" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm text-zinc-100 tracking-tight">zkCompliance</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400">
                Groth16
              </span>
            </div>
          </div>

          {/* Navigation Items (Segmented Control style) */}
          <nav className="hidden md:flex items-center space-x-1 p-1 bg-zinc-900 border border-zinc-800 rounded-lg">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-zinc-200' : 'text-zinc-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Wallet Address & Status Pill */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2 px-2.5 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors text-xs"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isCompliant ? 'bg-emerald-500' : 'bg-zinc-500'
                }`}
              />
              <span className="font-mono text-zinc-300">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
              <span className="text-[11px] text-zinc-500 font-sans">
                {isCompliant ? 'Verified' : 'Unverified'}
              </span>
            </button>

            {/* Wallet Dropdown */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-lg bg-[#111114] border border-zinc-800 shadow-xl p-3 z-50 text-xs">
                <div className="pb-2.5 border-b border-zinc-800">
                  <div className="text-[11px] text-zinc-500">Connected Wallet (Demo)</div>
                  <div className="font-mono text-xs text-zinc-200 mt-0.5 break-all select-all">
                    {walletAddress}
                  </div>
                  <div className="mt-2 flex items-center space-x-1.5 text-[11px]">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isCompliant ? 'bg-emerald-500' : 'bg-zinc-500'
                      }`}
                    />
                    <span className={isCompliant ? 'text-emerald-400' : 'text-zinc-400'}>
                      {isCompliant ? 'Compliance Record Active' : 'No Verification Record'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 space-y-1">
                  <button
                    onClick={handleSwitchWallet}
                    className="w-full flex items-center space-x-2 px-2 py-1.5 rounded text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Switch to New Wallet (Test Gating)</span>
                  </button>
                  <button
                    onClick={handleResetData}
                    className="w-full flex items-center space-x-2 px-2 py-1.5 rounded text-zinc-400 hover:bg-zinc-800 hover:text-red-400 transition-colors text-left"
                  >
                    <span>Reset Stored State</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-between py-2 border-t border-zinc-800/60 overflow-x-auto space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs whitespace-nowrap ${
                  isActive ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
