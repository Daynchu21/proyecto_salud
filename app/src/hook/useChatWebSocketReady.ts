import { useFocusEffect } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import { getChatWebSocket } from "../config/webSocketChtas";

type Params = {
  userInfo: { id: number | string; roles: string };
  appStateRef: React.MutableRefObject<any>;
  action: () => Promise<void> | void;
};

export function useChatOnFocusAndReady({
  userInfo,
  appStateRef,
  action,
}: Params) {
  const [loading, setLoading] = useState(true);
  const hasRunRef = useRef(false);

  useFocusEffect(() => {
    hasRunRef.current = false; // Reset al enfocar

    if (userInfo?.roles === "AMBULANCIA") {
      const ws = getChatWebSocket(
        userInfo.id.toString(),
        userInfo.roles,
        appStateRef
      );
      if (ws.isConnected && !hasRunRef.current) {
        hasRunRef.current = true;
        setLoading(true);
        Promise.resolve(action()).finally(() => setLoading(false));
      }
    }

    return () => {
      hasRunRef.current = false;
    };
  });

  useEffect(() => {
    const ws = getChatWebSocket(
      userInfo.id.toString(),
      userInfo.roles,
      appStateRef
    );
    const unsubscribe = ws.onConnectionChange((connected) => {
      if (connected && !hasRunRef.current && userInfo?.roles === "AMBULANCIA") {
        hasRunRef.current = true;
        setLoading(true);
        Promise.resolve(action()).finally(() => setLoading(false));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [userInfo, action, appStateRef]);

  return { loading };
}
