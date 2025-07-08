import React, { useRef } from "react";
import { Alert, Platform } from "react-native";
import AppWrapper from "./src/components/AppWrapper";
import { WebSocketProvider } from "./src/components/web-sockets";
import { ChatWebSocketProvider } from "./src/config/chatWebsocket";
import { AuthProvider, useAuth } from "./src/context/authContext";

import {
  NavigationContainer,
  NavigationContainerRef,
} from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { ErrorProvider } from "./src/context/errorContext";
import { ServerTimeProvider } from "./src/context/ServerTimeContext";
import {
  setIsReady,
  setNavigator,
  setupNotificationHandler,
} from "./src/hook/handlerNotification";
import AppTabs from "./src/navigation/AppTabs";
import AuthStack from "./src/navigation/AuthStack";
import AppBlockedScreen from "./src/utils/status-app";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

if (Platform.OS === "android") {
  Notifications.setNotificationChannelAsync("default", {
    name: "default",
    importance: Notifications.AndroidImportance.HIGH, // ✅ necesario
    sound: "default",
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#FF231F7C",
  });
}

function InnerApp({
  navigationRef,
}: {
  navigationRef: React.RefObject<NavigationContainerRef<any> | null>;
}) {
  const { userInfo, isLoggedIn } = useAuth();

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        if (navigationRef.current) {
          setNavigator(navigationRef.current);
          setIsReady();
          setupNotificationHandler();
        }
      }}
    >
      <ServerTimeProvider>
        <ErrorProvider>
          {isLoggedIn ? (
            <WebSocketProvider user={userInfo}>
              <ChatWebSocketProvider user={userInfo}>
                <AppTabs />
              </ChatWebSocketProvider>
            </WebSocketProvider>
          ) : (
            <AuthStack />
          )}
        </ErrorProvider>
      </ServerTimeProvider>
    </NavigationContainer>
  );
}

export default function App() {
  const [appBlocked, setAppBlocked] = React.useState(false);
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

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
        {appBlocked ? (
          <AppBlockedScreen />
        ) : (
          <InnerApp navigationRef={navigationRef} />
        )}
      </AuthProvider>
    </AppWrapper>
  );
}
