import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { EmergencyApi, EmergencyIF } from "../api/ambulancia_info";
import {
  updateEmergencyApp,
  updateEmergencyAppPending,
} from "../api/updateState";
import { useWebSocket } from "../components/web-sockets";
import { ErrorManager } from "../utils/errorHandler";

export function useEmergencyHandler(userInfo: any) {
  const [emergencyInfo, setEmergencyInfo] = useState<EmergencyIF>();
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);
  const [showNextStateConfirm, setShowNextStateConfirm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { sendEmergencyStateUpdate, sendEmergencyNotification } =
    useWebSocket();

  const checkInternetConnection = async () => {
    try {
      const response = await fetch("https://www.google.com");
      return response.ok;
    } catch {
      return false;
    }
  };

  const fetchData = async () => {
    if (userInfo?.roles !== "AMBULANCIA") return;
    try {
      const resp = await EmergencyApi(userInfo.ambulanceId ?? 0);
      if (resp && resp.length > 0) {
        setEmergencyInfo(resp[0]);
      }
    } catch (error) {
      console.error("Error fetching emergency data:", error);
      Alert.alert(
        "Error",
        "No se pudo obtener la información de la emergencia."
      );
    }
  };

  const handleNextState = async (
    id: string,
    ambulanceId: string,
    currentState: string
  ) => {
    const isConnected = await checkInternetConnection();
    if (!isConnected) {
      setIsNetworkError(true);
      return;
    }

    try {
      console.log(
        "estados",
        currentState,
        "id",
        id,
        "ambulanceId",
        ambulanceId
      );
      let action = undefined;
      if (currentState === "PENDIENTE") {
        action = updateEmergencyAppPending(id, ambulanceId);
      } else {
        action = updateEmergencyApp(id, ambulanceId, currentState);
      }
      const result = await action;
      console.log("Resultado de updateEmergencyApp:", result);
      if (result?.payload?.status !== "success") {
        ErrorManager.showError(result?.payload?.toast?.message);
        return;
      }

      const nextState = result.payload.newState;

      sendEmergencyStateUpdate(
        ambulanceId,
        `Ambulancia ${ambulanceId} - Estado actualizado a ${nextState}`
      );
      sendEmergencyNotification(ambulanceId, nextState);
      fetchData();
    } catch (err) {
      console.error("Error al avanzar estado:", err);
      setIsNetworkError(true);
    }
  };

  useEffect(() => {
    if (isNetworkError) {
      Alert.alert(
        "Error de Conexión",
        "No hay conexión a internet. Verifica tu red.",
        [{ text: "Entendido", onPress: () => setIsNetworkError(false) }]
      );
    }
  }, [isNetworkError]);

  return {
    emergencyInfo,
    setEmergencyInfo,
    fetchData,
    handleNextState,
    checkInternetConnection,
    refreshing,
    setRefreshing,
    showAcceptConfirm,
    setShowAcceptConfirm,
    showNextStateConfirm,
    setShowNextStateConfirm,
  };
}
