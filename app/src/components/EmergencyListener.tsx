import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useEffect } from "react";
import { useWebSocket } from "./web-sockets";

export default function EmergencyListener() {
  const { ambulancesPositions } = useWebSocket();
  const navigation = useNavigation();

  useEffect(() => {
    const checkEmergency = async () => {
      try {
        const stored = await AsyncStorage.getItem("emergencyData");
        if (stored) {
          const emergency = JSON.parse(stored);
          await AsyncStorage.removeItem("emergencyData");

          // Redirigir a la pantalla de emergencia
          //TODO CHINO
          //  navigation.navigate("EmergencyScreen", { emergency });
        }
      } catch (err) {
        console.error("❌ Error leyendo emergencia:", err);
      }
    };

    checkEmergency();
  }, [ambulancesPositions]);

  return null; // Este componente no renderiza nada, solo escucha
}
