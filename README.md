# aosync-react-sdk

A simple react implementation of the ao-sync protocol.

## Usage

```js
import { AOSyncProvider, useWallet } from "@vela-ventures/aosync-react-sdk";

function WalletView() {
  const wallet = useWallet();
  const [address, setAddress] = useAddress<string>()

  useEffect(() => {
    setAddress(wallet.getAddress())
  }, [wallet.isConnected])

  if (wallet.isConnected) {
    return(
      <>
       <h1>Connected to: {address}</h1>
       <Button onClick={wallet.disconnect}>Disconnect Wallet</Button>
      </>
    )
  }

  return <Button onClick={wallet.connect}>Connect Wallet</Button>
}

function App() {
  return (
    <AOSyncProvider arweaveHost='arweave.net' muUrl='https://mu.ao-testnet.xyz'>
      <WalletView />
    </AOSyncProvider>
  );
}
```
