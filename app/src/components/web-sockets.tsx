import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import { userInfoIF } from "../api/users";
import { navigateTo } from "../hook/handlerNotification";
import { ErrorManager } from "../utils/errorHandler";

interface WebSocketContextType {
  ws: WebSocket | null;
  ambulancesPositions: any[];
  sendEmergencyNotification: (ambulanceId: string, message: string) => boolean;
  sendEmergencyStateUpdate: (ambulanceId: string, message: any) => boolean;
  isConnected: boolean;
  reconnectAttempts: number;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface Props {
  children: ReactNode;
  user: userInfoIF;
}

// --- New: Constants for WebSocket messages ---
const WS_TYPES = {
  REGISTER: "register",
  AMBULANCES_POSITIONS: "ambulancesPositions",
  EMERGENCY: "emergency",
  EMERGENCY_STATE_UPDATE: "emergencyStateUpdate",
  PING: "ping",
  EMERGENCY_NOTIFICATION: "emergencyNotification",
  EMERGENCY_DELETED: "emergencyDeleted",
};

export const WebSocketProvider = ({ children, user }: Props) => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [ambulancesPositions, setAmbulancesPositions] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const reconnectingRef = useRef(false);
  const connectWebSocketRef = useRef<() => void>(() => {});
  const closeRequestedRef = useRef(false);

  const MAX_RECONNECT_ATTEMPTS = 30;
  const INITIAL_RECONNECT_INTERVAL = 5000;
  const MAX_RECONNECT_INTERVAL = 20000;

  const getReconnectDelay = useCallback((attempt: number) => {
    const baseDelay = Math.min(
      INITIAL_RECONNECT_INTERVAL * Math.pow(1.5, attempt),
      MAX_RECONNECT_INTERVAL
    );
    const jitter = Math.random() * (baseDelay * 0.2);
    return baseDelay + jitter;
  }, []);
  const connectWebSocket = useCallback(() => {
    if (!user || reconnectingRef.current) {
      return;
    }
    reconnectingRef.current = true;
    closeRequestedRef.current = false;

    if (ws) {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      ws.close();
    }

    const socket = new WebSocket(
      process.env.EXPO_PUBLIC_NEXT_POSITION_WS_URL || "ws://localhost:3001"
    );

    socket.onopen = () => {
      reconnectingRef.current = false;
      setIsConnected(true);
      setReconnectAttempts(0);
      socket.send(JSON.stringify({ type: WS_TYPES.REGISTER, user }));
    };

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case WS_TYPES.AMBULANCES_POSITIONS:
            setAmbulancesPositions(data.ambulances);
            break;
          case WS_TYPES.EMERGENCY:
            await AsyncStorage.setItem("emergencyData", JSON.stringify(data));
            break;
          case WS_TYPES.EMERGENCY_STATE_UPDATE:
            navigateTo("Emergencias", { emergencyId: 1, refresh: true });
            break;
          case WS_TYPES.EMERGENCY_DELETED:
            navigateTo("Emergencias", { refresh: true });

            break;
          default:
            console.warn("Received unknown WebSocket message type:", data.type);
            break;
        }
      } catch (error) {
        console.error("❌ Error parsing WebSocket message:", error, event.data);
      }
    };

    socket.onerror = (err) => {
      console.error("❌ WebSocket error", err);
      setIsConnected(false);
    };

    socket.onclose = (event) => {
      console.warn(
        "⚠️ WebSocket desconectado. Code:",
        event.code,
        "Reason:",
        event.reason
      );
      setIsConnected(false);
      reconnectingRef.current = false;

      if (
        !closeRequestedRef.current &&
        reconnectAttempts < MAX_RECONNECT_ATTEMPTS
      ) {
        const delay = getReconnectDelay(reconnectAttempts);
        setReconnectAttempts((prev) => prev + 1);
        setTimeout(() => {
          connectWebSocketRef.current();
        }, delay);
      } else if (!closeRequestedRef.current) {
        ErrorManager.showError(
          "No se pudo reconectar al servidor. Por favor, revisa tu conexión a internet."
        );
      }
    };

    setWs(socket);
  }, [user, getReconnectDelay, reconnectAttempts, ws]);

  connectWebSocketRef.current = connectWebSocket;

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (ws) {
        closeRequestedRef.current = true;
        ws.close();
      }
    };
  }, [user, connectWebSocket, ws]); // Added ws to dependencies for proper cleanup

  useEffect(() => {
    const handleAppStateChange = (state: string) => {
      if (state === "active" && !isConnected && !reconnectingRef.current) {
        connectWebSocketRef.current();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription.remove();
  }, [isConnected]);

  useEffect(() => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const interval = setInterval(() => {
      ws.send(JSON.stringify({ type: WS_TYPES.PING }));
    }, 15000);
    return () => clearInterval(interval);
  }, [ws]);

  const sendEmergencyNotification = useCallback(
    (ambulanceId: string, message: string): boolean => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: WS_TYPES.EMERGENCY_NOTIFICATION,
            ambulanceId,
            message,
          })
        );
        return true;
      }
      ErrorManager.showError(
        "No se pudo enviar la notificación de emergencia: Conexión no disponible."
      );
      return false;
    },
    [ws]
  );

  const sendEmergencyStateUpdate = useCallback(
    (ambulanceId: string, message: any): boolean => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: WS_TYPES.EMERGENCY_STATE_UPDATE,
            ambulanceId,
            message: message, // 🔥 importante: plano, no como message: {...}
          })
        );
        return true;
      }

      ErrorManager.showError(
        "No se pudo enviar la actualización de estado de emergencia: Conexión no disponible."
      );
      return false;
    },
    [ws]
  );

  return (
    <WebSocketContext.Provider
      value={{
        ws,
        ambulancesPositions,
        sendEmergencyNotification,
        sendEmergencyStateUpdate,
        isConnected,
        reconnectAttempts,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket debe usarse dentro de WebSocketProvider");
  }
  return context;
};
