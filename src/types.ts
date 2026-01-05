import WalletClient from "@vela-ventures/ao-sync-sdk";
import type { ChainType, AccountType, MultiChainWallet, TypedDataParams } from "@vela-ventures/ao-sync-sdk";
import { DataItem, UserTokensResult } from "arconnect";
import Transaction from "arweave/web/lib/transaction";

export type { ChainType, AccountType, MultiChainWallet, TypedDataParams };

export interface AOSyncSDKContext {
  // Connection state
  isConnected: boolean;
  isSessionActive: boolean;

  // Multi-chain state
  activeChain: ChainType | null;
  supportedChains: ChainType[];
  multiChainAddresses: MultiChainWallet | null;
  accountType: AccountType | null;

  // Connection methods
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;

  // Chain management
  switchChain: (chain: ChainType) => void;
  getActiveChain: () => ChainType;
  getSupportedChains: () => ChainType[];
  getMultiChainAddresses: () => Promise<MultiChainWallet>;

  // Address methods
  getAllAddresses: () => Promise<string[]>;
  getAddress: () => Promise<string | undefined>;

  // Universal signing methods
  signMessage: (message: string | Uint8Array) => Promise<string>;
  signTransaction: (transaction: any) => Promise<any>;
  sendTransaction: (transaction: any) => Promise<string>;
  signTypedData: (params: TypedDataParams) => Promise<string>;

  // Wallet management
  getWalletNames: () => Promise<{ [addr: string]: string }>;
  getWallets: () => ReturnType<WalletClient['getWallets']>;
  userTokens: () => Promise<UserTokensResult>;
  swapActiveWallet: (walletAddress: string) => Promise<string>;
  getContacts: () => ReturnType<WalletClient['getContacts']>;

  // Legacy Arweave methods (kept for backward compatibility)
  sendAR: (recipient: string, quantity: string) => Promise<any>;
  signAOMessage: (dataItem: DataItem) => Promise<string>;
  sign: (transaction: Transaction) => Promise<Transaction>;
}
