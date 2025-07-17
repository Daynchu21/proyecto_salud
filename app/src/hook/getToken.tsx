import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    alert("Necesitás un dispositivo físico para probar push");
    return;
  }
  /*
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    alert("No se otorgaron permisos para notificaciones");
    return;
  }*/

  try {
    const token = await Notifications.getDevicePushTokenAsync();
    if (token) {
      return token.data;
    } else {
      return console.warn("No se pudo obtener el token de dispositivo");
    }
  } catch (error) {
    console.error("Error al obtener token push:", error);
  }
}
