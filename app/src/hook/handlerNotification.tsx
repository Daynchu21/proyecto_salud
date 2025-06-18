import { NavigationContainerRef } from "@react-navigation/native";
import * as Notifications from "expo-notifications";

let navigator: NavigationContainerRef<any> | null = null;
let isReady = false;

export const setNavigator = (navRef: NavigationContainerRef<any>) => {
  navigator = navRef;
};

export const setIsReady = () => {
  isReady = true;
};

export const navigateTo = (screen: string, params: any = {}) => {
  if (navigator && isReady) {
    navigator.navigate(screen, params);
  } else {
    console.warn("⛔ Navegación no lista");
  }
};

export const setupNotificationHandler = () => {
  Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;

    if (data?.screen && typeof data.screen === "string" && navigator) {
      const screen = data.screen;
      const { screen: _, ...params } = data;
      navigator.navigate(screen, {
        ...params,
      });
    } else {
      console.warn("⚠️ 'screen' inválido o sin navigator");
    }
  });
};
