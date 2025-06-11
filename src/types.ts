import { DataItem, UserTokensResult } from "arconnect";
import Transaction from "arweave/web/lib/transaction";

export interface AOSyncSDKContext {
  isConnected: boolean;
  isSessionActive: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  getAllAddresses: () => Promise<string[]>;
  getAddress: () => Promise<string | undefined>;
  sendAR: (recipient: string, quantity: string) => Promise<any>;
  getWalletNames: () => Promise<{ [addr: string]: string }>;
  userTokens: () => Promise<UserTokensResult>;
  signAOMessage: (dataItem: DataItem) => Promise<string>;
  sign: (transaction: Transaction) => Promise<Transaction>;
}
