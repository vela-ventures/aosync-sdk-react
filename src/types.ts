import Transaction from "arweave/web/lib/transaction";

export interface AOSyncSDKContext {
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  getAllAddresses: () => Promise<string[]>;
  getAddress: () => Promise<string | undefined>;
  sendAR: (recipient: string, quantity: string) => Promise<any>;
  signAOMessage: (
    target: string,
    recipient: string,
    quantity: string
  ) => Promise<any>;
  sign: (transaction: Transaction) => Promise<Transaction>;
}