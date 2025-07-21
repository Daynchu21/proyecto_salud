import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

export function useNetworkStatus(onReconnect?: () => void) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = Boolean(state.isConnected && state.isInternetReachable);
      setIsConnected(connected);

      // Si se reconectó a internet, ejecutar función opcional
      if (connected && onReconnect) {
        onReconnect();
      }
    });

    return () => unsubscribe();
  }, [onReconnect]);

  return { isConnected };
}
