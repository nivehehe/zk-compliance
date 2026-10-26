import { ComplianceRecord } from '../types/zk';

export interface BlockchainTransaction {
  hash: string;
  type: 'VERIFY_COMPLIANCE' | 'VAULT_DEPOSIT' | 'VAULT_WITHDRAW' | 'CLAIM_YIELD';
  status: 'confirmed' | 'pending' | 'reverted';
  blockNumber: number;
  gasUsed: number;
  timestamp: number;
  from: string;
  details: string;
}

const STORAGE_KEYS = {
  WALLET: 'zk_compliance_wallet',
  RECORDS: 'zk_compliance_records',
  TRANSACTIONS: 'zk_compliance_txs',
  VAULT_BALANCE: 'zk_compliance_vault_balance',
  VAULT_DEPOSIT_TIME: 'zk_compliance_vault_deposit_time',
};

// Default simulated demo wallet
const DEFAULT_WALLET = '0x71C8360f38BB205b38a74e5058721c43D2cDa829';

export class MockBlockchainService {
  private currentWallet: string;
  private records: Record<string, ComplianceRecord> = {};
  private transactions: BlockchainTransaction[] = [];
  private vaultBalanceEth: number = 0;
  private vaultDepositTimestamp: number = 0;

  constructor() {
    this.currentWallet = localStorage.getItem(STORAGE_KEYS.WALLET) || DEFAULT_WALLET;
    this.loadState();
  }

  private loadState() {
    try {
      const recordsJson = localStorage.getItem(STORAGE_KEYS.RECORDS);
      if (recordsJson) this.records = JSON.parse(recordsJson);

      const txsJson = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (txsJson) this.transactions = JSON.parse(txsJson);

      const bal = localStorage.getItem(STORAGE_KEYS.VAULT_BALANCE);
      if (bal) this.vaultBalanceEth = parseFloat(bal);

      const time = localStorage.getItem(STORAGE_KEYS.VAULT_DEPOSIT_TIME);
      if (time) this.vaultDepositTimestamp = parseInt(time, 10);
    } catch (e) {
      console.warn('Failed to parse blockchain storage:', e);
    }
  }

  private saveState() {
    localStorage.setItem(STORAGE_KEYS.WALLET, this.currentWallet);
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(this.records));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(this.transactions));
    localStorage.setItem(STORAGE_KEYS.VAULT_BALANCE, this.vaultBalanceEth.toString());
    localStorage.setItem(STORAGE_KEYS.VAULT_DEPOSIT_TIME, this.vaultDepositTimestamp.toString());
  }

  public getWalletAddress(): string {
    return this.currentWallet;
  }

  public setWalletAddress(addr: string) {
    this.currentWallet = addr;
    this.saveState();
  }

  public generateRandomWallet(): string {
    const chars = '0123456789abcdef';
    let addr = '0x';
    for (let i = 0; i < 40; i++) {
      addr += chars[Math.floor(Math.random() * chars.length)];
    }
    this.currentWallet = addr;
    this.saveState();
    return addr;
  }

  public isWalletCompliant(wallet?: string): boolean {
    const target = wallet || this.currentWallet;
    const rec = this.records[target.toLowerCase()];
    if (!rec) return false;
    return rec.isVerified && Date.now() < rec.expiresAt;
  }

  public getComplianceRecord(wallet?: string): ComplianceRecord | null {
    const target = wallet || this.currentWallet;
    return this.records[target.toLowerCase()] || null;
  }

  public async registerComplianceOnChain(
    identityCommitment: string,
    ageThreshold: number,
    calldata: any
  ): Promise<BlockchainTransaction> {
    // Simulate transaction latency
    await new Promise((res) => setTimeout(res, 800));

    const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const now = Date.now();
    const expiresAt = now + 365 * 24 * 60 * 60 * 1000;

    const record: ComplianceRecord = {
      isVerified: true,
      identityCommitment,
      verifiedAt: now,
      expiresAt,
      ageThreshold,
      txHash,
      walletAddress: this.currentWallet,
    };

    this.records[this.currentWallet.toLowerCase()] = record;

    const tx: BlockchainTransaction = {
      hash: txHash,
      type: 'VERIFY_COMPLIANCE',
      status: 'confirmed',
      blockNumber: 19842100 + Math.floor(Math.random() * 100),
      gasUsed: 247182,
      timestamp: now,
      from: this.currentWallet,
      details: `ZK-Groth16 Verified on ZKComplianceRegistry.sol. Commitment: ${identityCommitment.slice(0, 10)}...`,
    };

    this.transactions.unshift(tx);
    this.saveState();
    return tx;
  }

  public getVaultBalance(): number {
    return this.vaultBalanceEth;
  }

  public getAccruedVaultYield(): number {
    if (this.vaultBalanceEth <= 0 || !this.vaultDepositTimestamp) return 0;
    const secondsElapsed = (Date.now() - this.vaultDepositTimestamp) / 1000;
    const apy = 0.085; // 8.5%
    const secondsInYear = 365 * 24 * 3600;
    return this.vaultBalanceEth * apy * (secondsElapsed / secondsInYear);
  }

  public async depositToVault(amountEth: number): Promise<BlockchainTransaction> {
    if (!this.isWalletCompliant()) {
      throw new Error('Transaction Reverted: ZKComplianceRegistry check failed. Caller is not verified.');
    }
    if (amountEth <= 0) {
      throw new Error('Deposit amount must be greater than 0 ETH');
    }

    await new Promise((res) => setTimeout(res, 600));

    // Accrue any current yield before adding new principal
    const currentYield = this.getAccruedVaultYield();
    this.vaultBalanceEth += amountEth + currentYield;
    this.vaultDepositTimestamp = Date.now();

    const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const tx: BlockchainTransaction = {
      hash: txHash,
      type: 'VAULT_DEPOSIT',
      status: 'confirmed',
      blockNumber: 19842100 + Math.floor(Math.random() * 100),
      gasUsed: 62450,
      timestamp: Date.now(),
      from: this.currentWallet,
      details: `Deposited ${amountEth.toFixed(4)} ETH to Institutional Compliant Vault`,
    };

    this.transactions.unshift(tx);
    this.saveState();
    return tx;
  }

  public async withdrawFromVault(amountEth: number): Promise<BlockchainTransaction> {
    if (!this.isWalletCompliant()) {
      throw new Error('Transaction Reverted: ZKComplianceRegistry check failed.');
    }
    const currentYield = this.getAccruedVaultYield();
    const totalAvailable = this.vaultBalanceEth + currentYield;

    if (amountEth > totalAvailable) {
      throw new Error(`Insufficient vault funds. Available: ${totalAvailable.toFixed(4)} ETH`);
    }

    await new Promise((res) => setTimeout(res, 600));

    this.vaultBalanceEth = Math.max(0, totalAvailable - amountEth);
    this.vaultDepositTimestamp = this.vaultBalanceEth > 0 ? Date.now() : 0;

    const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const tx: BlockchainTransaction = {
      hash: txHash,
      type: 'VAULT_WITHDRAW',
      status: 'confirmed',
      blockNumber: 19842100 + Math.floor(Math.random() * 100),
      gasUsed: 54120,
      timestamp: Date.now(),
      from: this.currentWallet,
      details: `Withdrew ${amountEth.toFixed(4)} ETH from Institutional Compliant Vault`,
    };

    this.transactions.unshift(tx);
    this.saveState();
    return tx;
  }

  public getTransactions(): BlockchainTransaction[] {
    return this.transactions;
  }

  public resetAllData() {
    localStorage.removeItem(STORAGE_KEYS.RECORDS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.VAULT_BALANCE);
    localStorage.removeItem(STORAGE_KEYS.VAULT_DEPOSIT_TIME);
    this.records = {};
    this.transactions = [];
    this.vaultBalanceEth = 0;
    this.vaultDepositTimestamp = 0;
  }
}

export const blockchainService = new MockBlockchainService();
