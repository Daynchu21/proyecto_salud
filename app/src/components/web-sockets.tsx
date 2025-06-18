import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Alert } from "react-native";
import { navigateTo } from "../hook/handlerNotification";

interface WebSocketContextType {
  ws: WebSocket | null;
  ambulancesPositions: any[];
  sendEmergencyNotification: (ambulanceId: string, message: string) => boolean;
  sendEmergencyStateUpdate: (ambulanceId: string, message: string) => boolean;
  isConnected: boolean;
  reconnectAttempts: number;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface Props {
  children: ReactNode;
  user: any; // Tipa correctamente si tenés un tipo definido para `user`
}

export const WebSocketProvider = ({ children, user }: Props) => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [ambulancesPositions, setAmbulancesPositions] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const MAX_RECONNECT_ATTEMPTS = 30;
  const INITIAL_RECONNECT_INTERVAL = 5000;
  const MAX_RECONNECT_INTERVAL = 20000;

  const getReconnectDelay = (attempt: number) =>
    Math.min(
      INITIAL_RECONNECT_INTERVAL * Math.pow(1.5, attempt),
      MAX_RECONNECT_INTERVAL
    );

  const connectWebSocket = () => {
    if (!user) return;

    const socket = new WebSocket(
      process.env.EXPO_PUBLIC_NEXT_POSITION_WS_URL || "ws://localhost:3001"
    );

    socket.onopen = () => {
      setIsConnected(true);
      setReconnectAttempts(0);
      socket.send(
        JSON.stringify({
          type: "register",
          user,
        })
      );
    };

    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case "ambulancesPositions":
          setAmbulancesPositions(data.ambulances);
          break;
        case "emergency":
          Alert.alert("🚨 Nueva Emergencia", data.message);
          await AsyncStorage.setItem("emergencyData", JSON.stringify(data));
          break;
        case "emergencyStateUpdate":
          navigateTo("Emergencias", { emergencyId: 1, refresh: true });

          break;
        default:
          break;
      }
    };

    socket.onerror = (err) => {
      console.error("❌ WebSocket error", err);
      setIsConnected(false);
    };

    socket.onclose = () => {
      console.warn("⚠️ WebSocket desconectado");
      setIsConnected(false);

      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        const delay = getReconnectDelay(reconnectAttempts);
        setReconnectAttempts((prev) => prev + 1);
        setTimeout(connectWebSocket, delay);
      } else {
        Alert.alert(
          "❌ Conexión perdida",
          "No se pudo reconectar al servidor."
        );
      }
    };

    setWs(socket);
  };

  useEffect(() => {
    connectWebSocket();
    return () => {
      ws?.close();
    };
  }, [user]);

  const sendEmergencyNotification = (
    ambulanceId: string,
    message: string
  ): boolean => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "emergencyNotification",
          ambulanceId,
          message,
        })
      );
      return true;
    }
    return false;
  };

  const sendEmergencyStateUpdate = (
    ambulanceId: string,
    message: string
  ): boolean => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "emergencyStateUpdate",
          ambulanceId,
          message,
        })
      );
      return true;
    }
    return false;
  };

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

// Hook personalizado
export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket debe usarse dentro de WebSocketProvider");
  }
  return context;
};
