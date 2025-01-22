import { useEffect, useRef, useState } from 'react';
import WalletClient from '@vela-ventures/ao-sync-sdk';
import Arweave from 'arweave';
import { DataItem } from 'arconnect';

interface UseAOWalletReturn {
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  getAllAddresses: () => Promise<string[]>
  getAddress: () => Promise<string | undefined>;
  sendAR: (recipient: string, quantity: string) => Promise<any>;
  signAOMessage: (target: string, recipient: string, quantity: string) => Promise<any>;
}

export const useWallet = (): UseAOWalletReturn => {
  const [connected, setConnected] = useState(false);
  const walletRef = useRef(new WalletClient());

  useEffect(() => {
    const wallet = walletRef.current;
    wallet.reconnect();

    const handleDisconnect = () => setConnected(false);
    const handleConnect = () => setConnected(true);

    wallet.on('disconnected', handleDisconnect);
    wallet.on('connected', handleConnect);

    return () => {
      wallet.off('disconnected', handleDisconnect);
      wallet.off('connected', handleConnect);
    };
  }, []);

  const connect = async () => {
    try {
      await walletRef.current.connect({});
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  };

  const disconnect = async () => {
    try {
      await walletRef.current.disconnect();
      setConnected(false);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      throw error;
    }
  };

  const getAddress = async () => {
    try {
      return await walletRef.current.getActiveAddress();
    } catch (error) {
      console.error('Error getting address:', error);
      throw error;
    }
  };

  const getAllAddresses = async () => {
    try {
      return await walletRef.current.getAllAddresses();
    } catch (error) {
      console.error('Error getting address:', error);
      throw error;
    }
  };

  const sendAR = async (recipient: string, quantity: string) => {
    try {
      const arweave = Arweave.init({
        host: 'arweave.net',
        port: 443,
        protocol: 'https',
      });

      const tx = await arweave.createTransaction({
        target: recipient,
        quantity: quantity,
      });

      const signedTx = await walletRef.current.sign(tx);
      return await arweave.transactions.post(signedTx);
    } catch (error) {
      console.error('Error sending AR:', error);
      throw error;
    }
  };

  const signAOMessage = async (target: string, recipient: string, quantity: string) => {
    try {
      const dataItem: DataItem = {
        data: '',
        target,
        tags: [
          { name: 'Action', value: 'Transfer' },
          { name: 'Recipient', value: recipient },
          { name: 'Quantity', value: quantity },
          { name: 'SDK', value: 'Beacon Wallet' },
          { name: 'Data-Protocol', value: 'ao' },
          { name: 'Variant', value: 'ao.TN.1' },
          { name: 'Type', value: 'Message' },
        ]
      };

      const signedDataItem = await walletRef.current.signDataItem(dataItem);
      const response = await fetch('https://mu.ao-testnet.xyz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream'
        },
        body: signedDataItem
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      return signedDataItem;
    } catch (error) {
      console.error('Error signing AO message:', error);
      throw error;
    }
  };

  return {
    connected,
    connect,
    disconnect,
    getAddress,
    getAllAddresses,
    sendAR,
    signAOMessage
  };
};