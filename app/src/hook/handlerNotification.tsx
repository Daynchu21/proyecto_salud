// NotificationHandler.tsx
import { NavigationProp, useNavigation } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import React, { useEffect } from "react";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
const NotificationHandler: React.FC = () => {
  const navigation = useNavigation<NavigationProp<any>>();

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;

        console.log("🔔 Notificación tocada:", data);

        if (typeof data?.screen === "string") {
          navigation.navigate(data.screen, {
            ...data,
          });
        } else {
          console.warn("⚠️ 'screen' inválida:", data?.screen);
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, [navigation]);

  return null;
};

export default NotificationHandler;
