import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { GetChats } from "../api/chats";
import ChatMessagesCMP from "../components/ChatMessage";
import { useLoadUserInfo } from "../hook/userInfo";

export default function MessagesScreen() {
  const [chats, setChats] = useState<any>([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const { userInfo } = useLoadUserInfo();

  useEffect(() => {
    if (userInfo?.roles === "AMBULANCIA") {
      fetchChats();
    }
  }, [userInfo]);

  const fetchChats = async () => {
    try {
      const response = await GetChats();

      if (response) {
        if (response.length > 0) {
          setSelectedChat(response[0]);
        }
        setChats(response);
      }
    } catch (error) {
      console.error("Error al obtener chats:", error);
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  if (!userInfo || userInfo.roles !== "AMBULANCIA") {
    return (
      <View style={styles.centered}>
        <Text>Esta sección es exclusiva para ambulancias.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {selectedChat ? (
        <ChatMessagesCMP
          chat={selectedChat}
          onMessageSent={fetchChats}
          showInfoPanel={showInfoPanel}
          onToggleInfoPanel={setShowInfoPanel}
        />
      ) : (
        <Text style={styles.noChat}>No hay chats disponibles</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  noChat: { textAlign: "center", marginTop: 20, color: "#999" },
});
