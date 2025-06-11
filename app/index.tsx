import React from "react";
import { Alert } from "react-native";
import AppWrapper from "./src/components/AppWrapper";
import { WebSocketProvider } from "./src/components/web-sockets";
import { ChatWebSocketProvider } from "./src/config/chatWebsocket";
import { AuthProvider, useAuth } from "./src/context/authContext";
import Navigation from "./src/navigation";
import AppBlockedScreen from "./src/utils/status-app";

function InnerApp() {
  const { userInfo } = useAuth();

  const content = <Navigation />;

  return userInfo ? (
    <WebSocketProvider user={userInfo}>
      <ChatWebSocketProvider user={userInfo}>{content}</ChatWebSocketProvider>
    </WebSocketProvider>
  ) : (
    content
  );
}

export default function App() {
  const [appBlocked, setAppBlocked] = React.useState(false);
  React.useEffect(() => {
    const checkAppStatus = async () => {
      try {
        const response = await fetch(
          process.env.EXPO_PUBLIC_API_KEY_STATUS + "/estado-app"
        );

        if (!response.ok) {
          console.warn(
            "⚠️ El servidor respondió con un error. No se bloqueará la app."
          );
          return;
        }

        const data: { activo: boolean } = await response.json();

        if (data && data.activo === false) {
          setAppBlocked(true);
          Alert.alert(
            "Acceso bloqueado",
            "Tu aplicación ha sido desactivada. Contacta al proveedor."
          );
        }
      } catch (error) {
        console.error("❌ Error al verificar el estado de la app:", error);
        // No hacer nada si no hay respuesta o hay error de red
      }
    };

    checkAppStatus();
  }, []);

  return (
    <AppWrapper>
      <AuthProvider>
        {appBlocked ? <AppBlockedScreen /> : <InnerApp />}
      </AuthProvider>
    </AppWrapper>
  );
}
