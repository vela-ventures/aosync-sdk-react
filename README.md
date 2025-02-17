# Wallet SDK for Arweave and AO

A lightweight React hook and context provider for integrating the Beacon Wallet into your React applications.

## Features

- Easily manage wallet connections.
- Send AR transactions.
- Sign messages and transactions.
- Retrieve wallet addresses.

## Installation

Install the package via npm:

```bash
npm install @vela-ventures/aosync-sdk-react
```

## Usage

### 1: Wrap Your App with WalletProvider

To enable wallet functionality across your app, wrap your application with the AOSyncProvider:

```javascript
import React from "react";
import { AOSyncProvider } from "@vela-ventures/aosync-sdk-react";

const App = () => {
  return (
    <AOSyncProvider
      gatewayConfig={{
        host: "arweave.net",
        port: 443,
        protocol: "https",
      }}
      muUrl="https://mu.ao-testnet.xyz"
    >
      <YourApp />
    </AOSyncProvider>
  );
};
```

### 2. Use the useWallet Hook

Access wallet functionality in any component with the useWallet hook:

```javascript
import React from "react";
import { useWallet } from "@vela-ventures/aosync-sdk-react";

const WalletComponent = () => {
  const { isConnected, connect, disconnect, getAddress, sendAR } = useWallet();

  const handleConnect = async () => {
    await connect();
    const address = await getAddress();
    console.log("Connected wallet address:", address);
  };

  const handleSendAR = async () => {
    try {
      await sendAR("recipient-address", "1000000"); // 1 AR (in winstons)
      console.log("AR sent successfully!");
    } catch (error) {
      console.error("Error sending AR:", error);
    }
  };

  return (
    <div>
      <h1>Wallet Status: {isConnected ? "Connected" : "Disconnected"}</h1>
      {!isConnected ? (
        <button onClick={handleConnect}>Connect Wallet</button>
      ) : (
        <button onClick={disconnect}>Disconnect Wallet</button>
      )}
      {isConnected && <button onClick={handleSendAR}>Send AR</button>}
    </div>
  );
};

export default WalletComponent;
```

## API

### `useWallet`

The `useWallet` hook provides the following methods and properties:

| Method/Property                     | Description                                    |
| ----------------------------------- | ---------------------------------------------- |
| `isConnected`                       | Boolean indicating if the wallet is connected. |
| `connect()`                         | Connects to the wallet.                        |
| `disconnect()`                      | Disconnects from the wallet.                   |
| `getAddress()`                      | Returns the currently active wallet address.   |
| `getAllAddresses()`                 | Returns all wallet addresses.                  |
| `sendAR(recipient, quantity)`       | Sends AR to the specified address.             |
| `sign(transaction)`                 | Signs a transaction using the wallet.          |
| `signAOMessage(target, tags, data)` | Signs an ANS-104 Data Item.                    |
| `signAODataItem(dataItem)`          | Signs an ANS-104 Data Item.                    |

## License

MIT License © 2025 Vela Ventures
