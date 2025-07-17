import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
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
import { useServerTime } from "../context/ServerTimeContext";
import { formatDateTime } from "../hook/date";
import { useUniqueMessages } from "../hook/useUniqueMessages";
import { useChatAudio } from "./ChatAudioControls";
import ChatAudioPlayer from "./ChatAudioPlayer";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  roles: string;
}

interface Chat {
  id: number;
  sender: User;
}

interface ChatMessagesProps {
  chat: Chat;
  showInfoPanel: boolean;
  onToggleInfoPanel?: (show: boolean) => void;
}

export default function ChatMessages({ chat }: ChatMessagesProps) {
  const [newMessage, setNewMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [user, setUser] = useState<userInfoIF | null>(null);
  const { messages, addMessage, setAllMessages } = useUniqueMessages();
  const isFocused = useIsFocused();
  const scrollViewRef = useRef<ScrollView>(null);
  const currentUserId = user ? Number(user.id) : null;

  const { isRecording } = useChatAudio((base64Audio) => {
    // send audio message via WebSocket
    sendChatMessageRaw({
      type: "chat_message",
      chatId: chat.id,
      audio: base64Audio,
    });
  });
  const { serverTime } = useServerTime();
  const {
    sendChatMessage,
    sendChatMessageRaw,
    onChatMessage,
    onTyping,
    markChatAsRead,
    isConnected,
  } = useChatWebSocket();

  // Load stored user once
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("user");
        if (raw) setUser(JSON.parse(raw));
      } catch (e) {
        console.error("Error loading user:", e);
      }
    })();
  }, []);

  // Fetch messages from API
  const loadMessagesOnce = React.useCallback(async () => {
    try {
      const response = await GetChatIdMessages(chat.id.toString());
      if (response) setAllMessages(response);
    } catch {
      Alert.alert("Error", "No se pudieron cargar los mensajes");
    }
  }, [chat.id, setAllMessages]);

  const messageHandler = React.useCallback(
    (message: any) => {
      addMessage(message);
      scrollViewRef.current?.scrollToEnd({ animated: true });
      if (isFocused && message.sender.id !== currentUserId) {
        markChatAsRead(chat.id);
      }
    },
    [addMessage, chat.id, currentUserId, isFocused, markChatAsRead]
  );

  const typingHandler = React.useCallback(
    (userId: number, isTyping: boolean) => {
      if (userId === currentUserId) return;
      setTypingUsers((prev) => {
        const setIds = new Set(prev);
        const idStr = String(userId);
        isTyping ? setIds.add(idStr) : setIds.delete(idStr);
        return Array.from(setIds);
      });
    },
    [currentUserId]
  );

  useEffect(() => {
    if (!isFocused) return;
    loadMessagesOnce().then(() => markChatAsRead(chat.id));

    const unsubMsg = onChatMessage(chat.id, messageHandler);
    const unsubType = onTyping(chat.id, typingHandler);
    return () => {
      unsubMsg();
      unsubType();
    };
  }, [
    chat.id,
    isFocused,
    loadMessagesOnce,
    markChatAsRead,
    onChatMessage,
    onTyping,
    messageHandler,
    typingHandler,
  ]);

  const handleSubmit = React.useCallback(async () => {
    const trimmed = newMessage.trim();
    if (!trimmed) return;

    const localId = `local_${serverTime}_${Math.random()
      .toString(36)
      .slice(2, 9)}`;
    setNewMessage("");
    addMessage({
      content: trimmed,
      timestamp: serverTime,
      sender: user,
      id: localId,
      localId,
      pending: true,
    });

    try {
      const success = sendChatMessage(chat.id, trimmed, undefined, { localId });
      if (!success) throw new Error("WebSocket failed");
    } catch {
      try {
        await SendMessage(chat.id.toString(), trimmed);
        loadMessagesOnce();
      } catch {
        await savePendingMessage(chat.id.toString(), trimmed, localId);
        Alert.alert(
          "Sin conexión",
          "Tu mensaje será enviado cuando vuelvas a estar online."
        );
      }
    }
  }, [
    newMessage,
    serverTime,
    user,
    addMessage,
    chat.id,
    sendChatMessage,
    loadMessagesOnce,
  ]);

  // Persist pending
  const savePendingMessage = React.useCallback(
    async (chatId: string, content: string, localId: string) => {
      const key = `pending_messages_${chatId}`;
      const msg = {
        content,
        timestamp: Date.now(),
        sender: user,
        pending: true,
        localId,
      };
      const stored = await AsyncStorage.getItem(key);
      const arr = stored ? JSON.parse(stored) : [];
      arr.push(msg);
      await AsyncStorage.setItem(key, JSON.stringify(arr));
    },
    [user]
  );

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
      >
        {messages.map((msg: any) => {
          const isMine = msg.sender.id === user?.id;
          const messageKey =
            msg.id?.toString() ??
            msg.localId?.toString() ??
            `${msg.timestamp}_${Math.random().toString(36).substr(2, 9)}`;

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
      {!isConnected && (
        <View style={styles.connectionWarning}>
          <Text style={styles.connectionWarningText}>
            ⚠️ No hay conexión con el chat
          </Text>
        </View>
      )}
      <View style={styles.inputContainer}>
        <TextInput
          style={isConnected ? styles.input : styles.inputDisabled}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Escribe un mensaje..."
          multiline
          editable={isConnected}
        />
        {newMessage ? (
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSubmit}
            disabled={!isConnected}
          >
            <FontAwesome name="send" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={isConnected ? styles.sendButton : styles.sendButtonDisabled}
            onPress={
              isConnected ? (useChatAudio as any).toggleRecording : undefined
            }
            disabled={!isConnected}
          >
            <FontAwesome
              name={isRecording ? "stop" : "microphone"}
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
        )}
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
  inputDisabled: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    backgroundColor: "#f0f0f0", // Indicate disabled state
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ccc", // Indicate disabled state
    justifyContent: "center",
    alignItems: "center",
  },
  toggleInfo: { textAlign: "center", marginVertical: 10, color: "#007AFF" },
  connectionWarning: {
    backgroundColor: "#fff8e1",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderColor: "#ffeb3b",
  },

  connectionWarningText: {
    color: "#f9a825",
    fontWeight: "bold",
    textAlign: "center",
  },
});
