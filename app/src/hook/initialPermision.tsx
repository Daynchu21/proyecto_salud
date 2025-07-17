import AsyncStorage from "@react-native-async-storage/async-storage";
import { AudioModule } from "expo-audio";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Alert } from "react-native";

export const useInitialPermissions = () => {
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const alreadyRequested = await AsyncStorage.getItem(
          "permissionsRequested"
        );
        if (alreadyRequested === "true") {
          return;
        }

        // 🎤 Micrófono
        const micStatus = await AudioModule.requestRecordingPermissionsAsync();
        if (!micStatus.granted) {
          Alert.alert(
            "Permiso denegado",
            "Necesitamos acceso al micrófono para grabar mensajes de audio."
          );
        }

        // 📍 Ubicación
        const { status: locationStatus } =
          await Location.requestForegroundPermissionsAsync();
        if (locationStatus !== "granted") {
          Alert.alert(
            "Permiso de ubicación denegado",
            "No podremos mostrar tu posición en el mapa."
          );
        }

        // 🔔 Notificaciones
        const { status: notificationStatus } =
          await Notifications.requestPermissionsAsync();
        if (notificationStatus !== "granted") {
          Alert.alert(
            "Permiso denegado",
            "No podremos enviarte notificaciones importantes."
          );
        }

        // Si al menos uno fue concedido, podés marcar como ya solicitado
        await AsyncStorage.setItem("permissionsRequested", "true");
      } catch (error) {
        console.error("❌ Error al solicitar permisos:", error);
        Alert.alert("Error", "Ocurrió un error al solicitar los permisos.");
      }
    };

    requestPermissions();
  }, []);
};
//agregar resetPermissionsRequest para reiniciar permisos
export const resetPermissionsRequest = async () => {
  await AsyncStorage.removeItem("permissionsRequested");
};
