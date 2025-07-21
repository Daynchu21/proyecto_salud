import React, { useRef } from "react";
import { Platform } from "react-native";
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
import { useInitialPermissions } from "./src/hook/initialPermision";
import AppTabs from "./src/navigation/AppTabs";
import AuthStack from "./src/navigation/AuthStack";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true, // ✅ esto hace que se muestre la notificación en el banner
    shouldShowList: true, // ✅ esto hace que se muestre en la lista de notificaciones
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
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  useInitialPermissions();
  React.useEffect(() => {
    if (Platform.OS === "web") {
      console.warn("⚠️ Notificaciones no disponibles en web");
    }
  }, []);

  return (
    <AppWrapper>
      <AuthProvider>
        <InnerApp navigationRef={navigationRef} />
      </AuthProvider>
    </AppWrapper>
  );
}
