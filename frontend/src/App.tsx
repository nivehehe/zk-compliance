import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ProverTab } from './components/ProverTab';
import { DefiVaultTab } from './components/DefiVaultTab';
import { AuditorTab } from './components/AuditorTab';
import { VisualizerTab } from './components/VisualizerTab';
import { ContractsTab } from './components/ContractsTab';
import { preloadCircuitAssets } from './lib/zkProver';
import { blockchainService } from './lib/mockBlockchain';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('prover');
  const [isCompliant, setIsCompliant] = useState<boolean>(blockchainService.isWalletCompliant());

  // Preload WASM and ZKey assets into memory
  useEffect(() => {
    preloadCircuitAssets();
  }, []);

  const refreshComplianceState = () => {
    setIsCompliant(blockchainService.isWalletCompliant());
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-zinc-100 font-sans selection:bg-zinc-800 selection:text-zinc-200">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCompliant={isCompliant}
        onWalletChange={refreshComplianceState}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'prover' && (
          <ProverTab
            onComplianceSuccess={refreshComplianceState}
            onNavigateToVault={() => setActiveTab('vault')}
          />
        )}

        {activeTab === 'vault' && (
          <DefiVaultTab
            onNavigateToProver={() => setActiveTab('prover')}
            onStateChange={refreshComplianceState}
          />
        )}

        {activeTab === 'auditor' && <AuditorTab />}

        {activeTab === 'visualizer' && <VisualizerTab />}

        {activeTab === 'contracts' && <ContractsTab />}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-[#0c0c0e] py-6 text-xs text-zinc-500 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-zinc-300">zkCompliance Protocol</span>
            <span className="text-zinc-600">/</span>
            <span>Circom 2.0 &middot; Groth16 zk-SNARK &middot; BN128</span>
          </div>

          <div className="flex items-center space-x-6">
            <span>Client-side WASM Prover</span>
            <a
              href="https://github.com/nivehehe/zk-compliance"
              target="_blank"
              rel="noreferrer"
              className="text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              GitHub Repository
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
