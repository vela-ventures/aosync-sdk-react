export { useWallet } from "./useWallet";
import React, {
  useEffect,
  useRef,
  useState,
  createContext,
  PropsWithChildren,
} from "react";
import Arweave from "arweave";
import { AppInfo, DataItem, GatewayConfig } from "arconnect";
import WalletClient, { ChainType, AccountType, MultiChainWallet, TypedDataParams } from "@vela-ventures/ao-sync-sdk";
import { AOSyncSDKContext } from "./types";
import Transaction from "arweave/web/lib/transaction";

export const AOSyncContext = createContext<AOSyncSDKContext | undefined>(
  undefined
);

interface Props extends PropsWithChildren {
  gatewayConfig: GatewayConfig;
  muUrl: string;
  appInfo?: AppInfo;
}

export function AOSyncProvider({
  gatewayConfig = { host: "arweave.net", port: 443, protocol: "https" },
  muUrl = "https://mu.ao-testnet.xyz",
  children,
  appInfo,
}: Props) {
  const walletRef = useRef(new WalletClient());
  const [isConnected, setIsConnected] = useState(
    walletRef?.current?.hasActiveSession() || false
  );
  const [isSessionActive, setIsSessionActive] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const sessionValue = sessionStorage.getItem("aosync-session-active");
      return sessionValue ? JSON.parse(sessionValue) : false;
    }
    return false;
  });

  // Multi-chain state
  const [activeChain, setActiveChain] = useState<ChainType | null>(null);
  const [supportedChains, setSupportedChains] = useState<ChainType[]>([]);
  const [multiChainAddresses, setMultiChainAddresses] = useState<MultiChainWallet | null>(null);
  const [accountType, setAccountType] = useState<AccountType | null>(null);

  useEffect(() => {
    const wallet = walletRef.current;
    wallet.reconnect();

    const handleDisconnect = () => setIsConnected(false);
    const handleConnect = () => {
      setIsConnected(true);
      // Initialize chain state on connection
      try {
        setAccountType(wallet.getAccountType());
        setSupportedChains(wallet.getSupportedChains());
        setActiveChain(wallet.getActiveChain());
      } catch (error) {
        console.error("Error initializing chain state:", error);
      }
    };

    const handleChainChanged = (data: any) => {
      setActiveChain(data.currentChain);
    };

    wallet.on("disconnected", handleDisconnect);
    wallet.on("connected", handleConnect);
    wallet.on("chainChanged", handleChainChanged);

    // Initialize chain state if already connected
    if (wallet.hasActiveSession()) {
      try {
        setAccountType(wallet.getAccountType());
        setSupportedChains(wallet.getSupportedChains());
        setActiveChain(wallet.getActiveChain());
      } catch (error) {
        console.error("Error initializing chain state:", error);
      }
    }

    return () => {
      wallet.off("disconnected", handleDisconnect);
      wallet.off("connected", handleConnect);
      wallet.off("chainChanged", handleChainChanged);
    };
  }, []);

  useEffect(() => {
    const handleSessionChange = (event: CustomEvent) => {
      setIsSessionActive(event.detail.isActive);
    };

    window.addEventListener("aosync-session-change", handleSessionChange as EventListener);
    return () => {
      window.removeEventListener("aosync-session-change", handleSessionChange as EventListener);
    };
  }, []);

  const connect = async () => {
    try {
      await walletRef.current.connect({
        gateway: gatewayConfig,
        appInfo,
        accountType: "multichain",
      });
    } catch (error) {
      console.error("Error connecting wallet:", error);
      throw error;
    }
  };

  const disconnect = async () => {
    try {
      await walletRef.current.disconnect();
      setIsConnected(false);
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      throw error;
    }
  };

  const getAddress = async () => {
    try {
      return await walletRef.current.getActiveAddress();
    } catch (error) {
      console.error("Error getting address:", error);
      throw error;
    }
  };

  const getAllAddresses = async () => {
    try {
      return await walletRef.current.getAllAddresses();
    } catch (error) {
      console.error("Error getting address:", error);
      throw error;
    }
  };

  const sendAR = async (recipient: string, quantity: string) => {
    try {
      const arweave = Arweave.init(gatewayConfig);

      const tx = await arweave.createTransaction({
        target: recipient,
        quantity: quantity,
      });

      const signedTx = await walletRef.current.sign(tx);
      return await arweave.transactions.post(signedTx);
    } catch (error) {
      console.error("Error sending AR:", error);
      throw error;
    }
  };

  const signAOMessage = async (dataItem: DataItem): Promise<string> => {
    try {
      dataItem?.tags?.push(
        { name: "SDK", value: "Beacon Wallet" },
        { name: "Data-Protocol", value: "ao" },
        { name: "Variant", value: "ao.TN.1" },
        { name: "Type", value: "Message" }
      );
      const signedDataItem = await walletRef.current.signDataItem(dataItem);
      const response = await fetch(muUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
        },
        body: signedDataItem,
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      return await extractAndHashId(signedDataItem);
    } catch (error) {
      console.error("Error signing AO message:", error);
      throw error;
    }
  };

  async function extractAndHashId(byteArray: ArrayBuffer): Promise<string> {
    const idBytes = byteArray.slice(2, 2 + 512);

    const hashBuffer = await crypto.subtle.digest("SHA-256", idBytes);

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashBase64 = btoa(String.fromCharCode.apply(null, hashArray))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    return hashBase64;
  }

  const sign = async (transaction: Transaction) => {
    try {
      return await walletRef.current.sign(transaction);
    } catch (error) {
      console.error("Error signing wallet:", error);
      throw error;
    }
  };

  const getWalletNames = async () => {
    try {
      return await walletRef.current.getWalletNames();
    } catch (error) {
      console.error("Error getting wallet names:", error);
      throw error;
    }
  };

  const getWallets = async () => {
    try {
      return await walletRef.current.getWallets();
    } catch (error) {
      console.error("Error getting wallets:", error);
      throw error;
    }
  };

  const userTokens = async () => {
    try {
      return await walletRef.current.userTokens();
    } catch (error) {
      console.error("Error getting user tokens:", error);
      throw error;
    }
  };

  const swapActiveWallet = async (walletAddress: string) => {
    try {
      return await walletRef.current.swapActiveWallet(walletAddress);
    } catch (error) {
      console.error("Error swapping wallet:", error);
      throw error;
    }
  };

  const getContacts = async () => {
    try {
      return await walletRef.current.getContacts();
    } catch (error) {
      console.error("Error getting contacts:", error);
      throw error;
    }
  };

  // Multi-chain methods
  const switchChain = (chain: ChainType) => {
    try {
      walletRef.current.switchChain(chain);
    } catch (error) {
      console.error("Error switching chain:", error);
      throw error;
    }
  };

  const getActiveChain = (): ChainType => {
    try {
      return walletRef.current.getActiveChain();
    } catch (error) {
      console.error("Error getting active chain:", error);
      throw error;
    }
  };

  const getSupportedChains = (): ChainType[] => {
    try {
      return walletRef.current.getSupportedChains();
    } catch (error) {
      console.error("Error getting supported chains:", error);
      throw error;
    }
  };

  const getMultiChainAddresses = async (): Promise<MultiChainWallet> => {
    try {
      const addresses = await walletRef.current.getMultiChainAddresses();
      setMultiChainAddresses(addresses);
      return addresses;
    } catch (error) {
      console.error("Error getting multi-chain addresses:", error);
      throw error;
    }
  };

  // Universal signing methods
  const signMessage = async (message: string | Uint8Array): Promise<string> => {
    try {
      return await walletRef.current.signMessage(message);
    } catch (error) {
      console.error("Error signing message:", error);
      throw error;
    }
  };

  const signTransaction = async (transaction: any): Promise<any> => {
    try {
      return await walletRef.current.signTransaction(transaction);
    } catch (error) {
      console.error("Error signing transaction:", error);
      throw error;
    }
  };

  const sendTransaction = async (transaction: any): Promise<string> => {
    try {
      return await walletRef.current.sendTransaction(transaction);
    } catch (error) {
      console.error("Error sending transaction:", error);
      throw error;
    }
  };

  const signTypedData = async (params: TypedDataParams): Promise<string> => {
    try {
      return await walletRef.current.signTypedData(params);
    } catch (error) {
      console.error("Error signing typed data:", error);
      throw error;
    }
  };

  return (
    <AOSyncContext.Provider
      value={{
        // Connection state
        isConnected,
        isSessionActive,

        // Multi-chain state
        activeChain,
        supportedChains,
        multiChainAddresses,
        accountType,

        // Connection methods
        connect,
        disconnect,

        // Chain management
        switchChain,
        getActiveChain,
        getSupportedChains,
        getMultiChainAddresses,

        // Address methods
        getAddress,
        getAllAddresses,

        // Universal signing methods
        signMessage,
        signTransaction,
        sendTransaction,
        signTypedData,

        // Wallet management
        getWalletNames,
        getWallets,
        userTokens,
        swapActiveWallet,
        getContacts,

        // Legacy Arweave methods
        sendAR,
        signAOMessage,
        sign,
      }}
    >
      {children}
    </AOSyncContext.Provider>
  );
}
