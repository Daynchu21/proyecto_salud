import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RecordingPresets, useAudioPlayer, useAudioRecorder } from "expo-audio";
import * as Notifications from "expo-notifications";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { GetChatIdMessages, SendMessage } from "../api/chats";
import { userInfoIF } from "../api/users";
import { useChatWebSocket } from "../config/chatWebsocket";
import { formatDateTime } from "../hook/date";
import { resendPendingMessages } from "../hook/resendPendingMessages";
import { EventBus } from "../utils/EventBus";
import { useChatAudio } from "./ChatAudioControls";
import ChatAudioPlayer from "./ChatAudioPlayer";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  roles: string;
}

interface Chat {
  id: string;
  sender: User;
}

interface ChatMessagesProps {
  chat: Chat;
  onMessageSent: () => void;
  showInfoPanel: boolean;
  onToggleInfoPanel?: (show: boolean) => void;
}

export default function ChatMessages({
  chat,
  onMessageSent,
}: ChatMessagesProps) {
  const [messages, setMessages] = useState<any>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [user, setUserInfoRaw] = React.useState<userInfoIF>();

  const scrollViewRef = useRef<ScrollView>(null);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer();

  const [, forceUpdate] = useState(0);
  const { startRecording, stopRecording } = useChatAudio((base64Audio) => {
    sendChatMessageRaw({
      type: "chat_message",
      chatId: chat.id,
      audio: base64Audio,
    });
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (player.playing) {
        forceUpdate((prev) => prev + 1);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [player]);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const raw = await AsyncStorage.getItem("user");
        if (raw) {
          const parsed: userInfoIF = JSON.parse(raw);
          setUserInfoRaw(parsed);
        }
      } catch (error) {
        console.error("Error al cargar el usuario:", error);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const handleReconnect = () => {
      resendPendingMessages(chat.id, fetchMessages);
    };

    EventBus.on("websocket:reconnected", handleReconnect);

    return () => {
      EventBus.off("websocket:reconnected", handleReconnect);
    };
  }, [chat.id]);

  const {
    sendChatMessage,
    sendChatMessageRaw,
    onChatMessage,
    onTyping,
    markChatAsRead,
  } = useChatWebSocket();

  const currentUserId = user?.id;

  useEffect(() => {
    fetchMessages();

    const messageHandler = (message: any) => {
      setMessages((prevMessages: any) => [...prevMessages, message]);
      scrollToBottom();
      if (
        message.sender.id !== user?.id &&
        message.sender.roles !== "AMBULANCIA"
      ) {
        Notifications.scheduleNotificationAsync({
          content: {
            title: `Nuevo mensaje de ${message.sender.firstName}`,
            body: message.content ?? "Mensaje de audio",
            data: { chatId: chat.id },
          },
          trigger: null,
        });
      }
    };

    const typingHandler = (userId: string, isTyping: boolean) => {
      if (userId !== currentUserId) {
        setTypingUsers((prev) => {
          if (isTyping) {
            return [...prev, userId];
          } else {
            return prev.filter((id) => id !== userId);
          }
        });
      }
    };

    const unsubscribeMessage = onChatMessage(chat.id, messageHandler);
    const unsubscribeTyping = onTyping(chat.id, typingHandler);

    markChatAsRead(chat.id);

    return () => {
      unsubscribeMessage();
      unsubscribeTyping();
    };
  }, [chat.id]);

  const fetchMessages = async () => {
    try {
      const response = await GetChatIdMessages(chat.id);
      if (response) {
        setMessages(response);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los mensajes");
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handleInputChange = (text: string) => {
    setNewMessage(text);
    // Opcional: agregar lógica para notificaciones de escritura
  };

  const handleSubmit = async () => {
    if (!newMessage.trim()) return;

    const messageToSend = newMessage;
    setNewMessage("");

    try {
      const success = sendChatMessage(chat.id, messageToSend);
      if (!success) {
        throw new Error("WebSocket failed");
      }
    } catch {
      try {
        await SendMessage(chat.id, messageToSend);
        fetchMessages();
        onMessageSent();
      } catch {
        await savePendingMessage(chat.id, messageToSend);
        Alert.alert(
          "Sin conexión",
          "Tu mensaje será enviado cuando vuelvas a estar online."
        );
      }
    }
  };

  const savePendingMessage = async (chatId: string, content: string) => {
    const pendingKey = `pending_messages_${chatId}`;
    const message = {
      content,
      timestamp: Date.now(),
      sender: user,
      pending: true,
      localId: `${chatId}_${Date.now()}`,
    };

    const stored = await AsyncStorage.getItem(pendingKey);
    const messages = stored ? JSON.parse(stored) : [];
    messages.push(message);
    await AsyncStorage.setItem(pendingKey, JSON.stringify(messages));

    setMessages((prev: any) => [...prev, message]); // Mostrar en UI
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
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={scrollToBottom}
      >
        {messages.map((msg: any) => {
          const isMine = msg.sender.id === user?.id;
          const messageKey =
            msg.id || msg.localId || `${msg.timestamp}_${msg.content}`;

          const isAudio = msg.type === "audio";
          return isMine ? (
            <View
              key={messageKey}
              style={[styles.messageBubble, styles.myMessage]}
            >
              <Text style={[styles.senderName, styles.myMessageText]}>
                {msg.sender.firstName} {msg.sender.lastName}
              </Text>

              {isAudio ? (
                <ChatAudioPlayer audioUrl={msg.audioUrl} isMine={isMine} />
              ) : (
                <Text style={styles.myMessageText}>{msg.content}</Text>
              )}

              {msg.pending && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 4,
                  }}
                >
                  <FontAwesome
                    name="clock-o"
                    size={12}
                    color="#FFA500"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={{ fontSize: 10, color: "#FFA500" }}>
                    Enviando...
                  </Text>
                </View>
              )}

              <Text style={[styles.messageTime, styles.myMessageTextDate]}>
                {formatDateTime(msg.createdAt || msg.timestamp)}
              </Text>
            </View>
          ) : (
            <View
              key={messageKey}
              style={[styles.messageBubble, styles.otherMessage]}
            >
              <Text style={styles.senderName}>
                {msg.sender.firstName} {msg.sender.lastName}
              </Text>

              {isAudio ? (
                <ChatAudioPlayer audioUrl={msg.audioUrl} isMine={isMine} />
              ) : (
                <Text style={styles.messageText}>{msg.content}</Text>
              )}

              <Text style={styles.messageTime}>
                {formatDateTime(msg.createdAt)}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={handleInputChange}
          placeholder="Escribe un mensaje..."
          multiline
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={audioRecorder.isRecording ? stopRecording : startRecording}
        >
          <FontAwesome
            name={audioRecorder.isRecording ? "stop" : "microphone"}
            size={20}
            color="#fff"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSubmit}
          disabled={!newMessage.trim()}
        >
          <FontAwesome name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  messagesContainer: { padding: 10 },
  messageBubble: {
    maxWidth: "80%",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#007AFF",
  },
  otherMessage: { alignSelf: "flex-start", backgroundColor: "#e5e5ea" },
  senderName: { fontWeight: "bold", marginBottom: 5 },
  messageText: { color: "#000" },
  myMessageText: { color: "#fff" },
  myMessageTextDate: {
    color: "#e3e1e1",
  },
  messageTime: {
    fontSize: 12,
    color: "#888",
    marginTop: 5,
    textAlign: "right",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  toggleInfo: { textAlign: "center", marginVertical: 10, color: "#007AFF" },
});
