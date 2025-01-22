interface UseAOWalletReturn {
    connected: boolean;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    getAddress: () => Promise<string | undefined>;
    sendAR: (recipient: string, quantity: string) => Promise<any>;
    signAOMessage: (target: string, recipient: string, quantity: string) => Promise<any>;
}
export declare const useWallet: () => UseAOWalletReturn;
export {};
