import { useContext } from "react";
import { AOSyncContext } from "./walletContext";

export function useWallet() {
  const context = useContext(AOSyncContext);
  if (!context) {
    throw new Error("AoSyncProvider not set");
  }
  return context;
}
