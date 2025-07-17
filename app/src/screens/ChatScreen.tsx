import { useFocusEffect } from "@react-navigation/native";
import React, { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { GetChats } from "../api/chats";
import ChatMessagesCMP from "../components/ChatMessage";
import { useLoadUserInfo } from "../hook/userInfo";

export default function MessagesScreen() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const { userInfo } = useLoadUserInfo();
  const [loading, setLoading] = useState(true);

  const fetchChats = React.useCallback(async () => {
    try {
      const response = await GetChats();
      if (response && response.length > 0) {
        const firstChat = response[0];
        setSelectedChat(firstChat);
      } else {
        if (selectedChat !== null) {
          setSelectedChat(null);
        }
      }
    } catch (error) {
      console.error("Error al obtener chats:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedChat]);

  const onRefresh = React.useCallback(() => {
    fetchChats();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (userInfo?.roles === "AMBULANCIA") {
        onRefresh();
      }
    }, [userInfo])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <Image
          source={require("../../../assets/loading_GIF.gif")}
          style={styles.gif}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {selectedChat ? (
        <ChatMessagesCMP
          chat={selectedChat}
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
  gif: {
    width: 150,
    height: 150,
  },
});
