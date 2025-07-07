import { useUser } from "@/lib/hooks/UserContext";
import { useNavigation } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import ChatMessages from "./ui/ChatMessages";
import AmbulanceMap from "./ui/info/AmbulanceMap";
import EmergencyInfo from "./ui/info/EmergencyInfo";

export default function MessagesPage() {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState(null);
  const [notification, setNotification] = useState(null);
  const navigation = useNavigation();
  const user = useUser();

  // Configurar listeners de notificaciones
  useEffect(() => {
    const subscription =
      Notifications.addNotificationReceivedListener(handleNotification);
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        handleNotification(response.notification);
      });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, []);

  const handleNotification = (notification) => {
    setNotification(notification);
    // Si la notificación es de un chat, abrir el chat correspondiente
    if (notification.request.content.data.chatId) {
      const chat = chats.find(
        (c) => c.id === notification.request.content.data.chatId
      );
      if (chat) {
        setSelectedChat(chat);
        navigation.navigate("Chat");
      }
    }
  };

  // Registrar token para notificaciones push
  useEffect(() => {
    registerForPushNotificationsAsync();
    fetchChats();
  }, []);

  const registerForPushNotificationsAsync = async () => {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      alert("Failed to get push token for push notification!");
      return;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;

    // Enviar el token a tu servidor para asociarlo al usuario/ambulancia
    await fetch("/api/ambulances/register-push-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ambulanceId: user.ambulanceId,
        token: token,
      }),
    });
  };

  const fetchChats = async () => {
    try {
      const response = await fetch("/api/chats");
      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid response format");
      }

      // Para ambulancias, crear chat si no existe
      if (user.roles === "AMBULANCIA" && data.length === 0) {
        const newChatResponse = await fetch("/api/chats", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content:
              "Mensaje de sistema: se creó este chat para mantener comunicación con el operador",
          }),
        });

        const newChat = await newChatResponse.json();
        setSelectedChat(newChat);
        setChats([newChat]);
      } else {
        setChats(data);
        if (data.length > 0) {
          setSelectedChat(data[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const moreInfo = async (targetUser) => {
    if (targetUser.roles === "AMBULANCIA" && targetUser.ambulanceId) {
      const response = await fetch(
        `/api/emergencies/ambulance/${targetUser.ambulanceId}`
      );
      const data = await response.json();
      setMapData(
        data.length > 0 ? data[0] : { ambulanceId: targetUser.ambulanceId }
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.chatContainer}>
        {selectedChat ? (
          <ChatMessages chat={selectedChat} onMessageSent={fetchChats} />
        ) : (
          <View style={styles.noChatContainer}>
            <Text>No hay chats disponibles</Text>
          </View>
        )}
      </View>

      {mapData && (
        <View style={styles.mapContainer}>
          <AmbulanceMap ambulanceId={mapData.ambulanceId} />
          {mapData.id && <EmergencyInfo emergency={mapData} />}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  chatContainer: {
    flex: 1,
  },
  noChatContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mapContainer: {
    height: 300,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
});

async function schedulePushNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Nuevo mensaje recibido",
      body: "Tienes un nuevo mensaje en el chat de emergencia",
      data: { chatId: "123" }, // Datos adicionales
    },
    trigger: null, // Enviar inmediatamente
  });
}
