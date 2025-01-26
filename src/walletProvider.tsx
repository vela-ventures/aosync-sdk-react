import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import WalletClient from "@vela-ventures/ao-sync-sdk";
import Arweave from "arweave";
import { DataItem } from "arconnect";
import Transaction from "arweave/web/lib/transaction";

interface WalletContextValue {
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

const WalletContext = createContext<WalletContextValue | null>(null);

export const WalletProvider: ({ children, }: { children: any; }) => React.JSX.Element = ({
  children,
}) => {
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
      await walletRef.current.connect({});
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
      console.error("Error getting addresses:", error);
      throw error;
    }
  };

  const sendAR = async (recipient: string, quantity: string) => {
    try {
      const arweave = Arweave.init({
        host: "arweave.net",
        port: 443,
        protocol: "https",
      });

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

  const signAOMessage = async (
    target: string,
    recipient: string,
    quantity: string
  ) => {
    try {
      const dataItem: DataItem = {
        data: "",
        target,
        tags: [
          { name: "Action", value: "Transfer" },
          { name: "Recipient", value: recipient },
          { name: "Quantity", value: quantity },
          { name: "SDK", value: "Beacon Wallet" },
          { name: "Data-Protocol", value: "ao" },
          { name: "Variant", value: "ao.TN.1" },
          { name: "Type", value: "Message" },
        ],
      };

      const signedDataItem = await walletRef.current.signDataItem(dataItem);
      const response = await fetch("https://mu.ao-testnet.xyz", {
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
    <WalletContext.Provider
      value={{
        isConnected,
        connect,
        disconnect,
        getAllAddresses,
        getAddress,
        sendAR,
        signAOMessage,
        sign,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextValue => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
