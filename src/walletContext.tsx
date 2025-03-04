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
  const [isConnected, setIsConnected] = useState(false);
  const walletRef = useRef(new WalletClient());

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

  const signAODataItem = async (dataItem: DataItem) => {
    try {
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

      return signedDataItem;
    } catch (error) {
      console.error("Error signing AO message:", error);
      throw error;
    }
  };

  const signAOMessage = async (
    target: string,
    tags: { name: string; value: string }[],
    data: string
  ) => {
    try {
      const dataItem: DataItem = {
        data: data,
        target,
        tags: [
          { name: "Action", value: "Transfer" },
          { name: "SDK", value: "Beacon Wallet" },
          { name: "Data-Protocol", value: "ao" },
          { name: "Variant", value: "ao.TN.1" },
          { name: "Type", value: "Message" },
          ...tags,
        ],
      };

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

      return signedDataItem;
    } catch (error) {
      console.error("Error signing AO message:", error);
      throw error;
    }
  };

  const sign = async (transaction: Transaction) => {
    try {
      return await walletRef.current.sign(transaction);
    } catch (error) {
      console.error("Error signing wallet:", error);
      throw error;
    }
  };

  return (
    <AOSyncContext.Provider
      value={{
        isConnected,
        connect,
        disconnect,
        getAddress,
        getAllAddresses,
        sendAR,
        signAOMessage,
        signAODataItem,
        sign,
      }}
    >
      {children}
    </AOSyncContext.Provider>
  );
}
