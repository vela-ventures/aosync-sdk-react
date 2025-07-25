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
import WalletClient from "@vela-ventures/ao-sync-sdk";
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
  const [isConnected, setIsConnected] = useState(!!walletRef?.current?.uid);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const sessionValue = sessionStorage.getItem("aosync-session-active");
      return sessionValue ? JSON.parse(sessionValue) : false;
    }
    return false;
  });

  useEffect(() => {
    const wallet = walletRef.current;
    wallet.reconnect();

    const handleDisconnect = () => setIsConnected(false);
    const handleConnect = () => setIsConnected(true);

    wallet.on("disconnected", handleDisconnect);
    wallet.on("connected", handleConnect);

    return () => {
      wallet.off("disconnected", handleDisconnect);
      wallet.off("connected", handleConnect);
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

  return (
    <AOSyncContext.Provider
      value={{
        isConnected,
        isSessionActive,
        connect,
        disconnect,
        getAddress,
        getAllAddresses,
        getWalletNames,
        getWallets,
        userTokens,
        sendAR,
        signAOMessage,
        swapActiveWallet,
        getContacts,
        sign,
      }}
    >
      {children}
    </AOSyncContext.Provider>
  );
}
