var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useEffect, useRef, useState } from 'react';
import WalletClient from '@vela-ventures/ao-sync-sdk';
import Arweave from 'arweave';
export const useWallet = () => {
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
    const connect = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield walletRef.current.connect({});
        }
        catch (error) {
            console.error('Error connecting wallet:', error);
            throw error;
        }
    });
    const disconnect = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield walletRef.current.disconnect();
            setConnected(false);
        }
        catch (error) {
            console.error('Error disconnecting wallet:', error);
            throw error;
        }
    });
    const getAddress = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            return yield walletRef.current.getActiveAddress();
        }
        catch (error) {
            console.error('Error getting address:', error);
            throw error;
        }
    });
    const sendAR = (recipient, quantity) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const arweave = Arweave.init({
                host: 'arweave.net',
                port: 443,
                protocol: 'https',
            });
            const tx = yield arweave.createTransaction({
                target: recipient,
                quantity: quantity,
            });
            const signedTx = yield walletRef.current.sign(tx);
            return yield arweave.transactions.post(signedTx);
        }
        catch (error) {
            console.error('Error sending AR:', error);
            throw error;
        }
    });
    const signAOMessage = (target, recipient, quantity) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const dataItem = {
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
            const signedDataItem = yield walletRef.current.signDataItem(dataItem);
            const response = yield fetch('https://mu.ao-testnet.xyz', {
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
        }
        catch (error) {
            console.error('Error signing AO message:', error);
            throw error;
        }
    });
    return {
        connected,
        connect,
        disconnect,
        getAddress,
        sendAR,
        signAOMessage
    };
};
