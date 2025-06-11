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
import { userInfoIF } from "../api/users";
import { MessageChat, useChatWebSocket } from "../config/chatWebsocket";

// Tipos de datos
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
}

export default function ChatMessages({
  chat,
  onMessageSent,
}: ChatMessagesProps) {
  const [messages, setMessages] = useState<MessageChat[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [userInfoRaw, setUserInfoRaw] = React.useState<userInfoIF>();

  const scrollViewRef = useRef<ScrollView>(null);
  const { sendChatMessage, onChatMessage, markChatAsRead } = useChatWebSocket();
  const [isRecording, setIsRecording] = useState(false);

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

  // Hooks de audio
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer();

  console.log("Recorder:", userInfoRaw);
  useEffect(() => {
    fetchMessages();

    const messageHandler = (message: MessageChat) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
      if (message.sender.id !== userInfoRaw?.id) {
        Notifications.scheduleNotificationAsync({
          content: {
            title: `Nuevo mensaje de ${message.sender}`,
            body: message.content ?? "Mensaje de audio",
            data: { chatId: chat.id },
          },
          trigger: null,
        });
      }
    };

    const unsubscribe = onChatMessage(chat.id, messageHandler);
    markChatAsRead(chat.id);

    return () => {
      unsubscribe();
      // No existe unloadAsync en expo-audio, sólo paramos si están en uso
      if (recorder.isRecording) recorder.stop();
      player.remove();
    };
  }, [chat.id]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chats/${chat.id}/messages`);
      const data: MessageChat[] = await response.json();
      setMessages(data);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los mensajes");
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const startRecording = async () => {
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
    } catch (err) {
      Alert.alert("Error", "No se pudo iniciar la grabación");
    }
  };

  const stopRecording = async () => {
    try {
      const uri = await recorder.stop();
      setIsRecording(false);

      // Enviar audio como mensaje
      const formData = new FormData();
      formData.append("audio", {
        uri,
        type: "audio/x-wav", // o el tipo que corresponda según tu configuración y plataforma
        name: "audio.wav",
      } as any);
      formData.append("type", "audio");

      const response = await fetch(`/api/chats/${chat.id}/messages`, {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.ok) {
        const message: MessageChat = await response.json();
        setMessages((prev) => [...prev, message]);
        onMessageSent();
      }
    } catch (err) {
      Alert.alert(
        "Error",
        "No se pudo detener la grabación ni enviar el audio"
      );
    }
  };

  const playSound = async (audioUrl: string, messageId: string) => {
    try {
      if (playingMessageId === messageId) {
        await player.pause(); // Pausa si ya está en reproducción
        setPlayingMessageId(null);
        return;
      }

      await player.pause(); // Detiene cualquier sonido previo
      await player.play(); // Este método acepta directamente la URL
      setPlayingMessageId(messageId);
    } catch (err) {
      Alert.alert("Error", "No se pudo reproducir el audio");
    }
  };

  const handleSubmit = async () => {
    if (!newMessage.trim()) return;
    try {
      const success = sendChatMessage(chat.id, newMessage);
      if (success) {
        setNewMessage("");
      } else {
        await fetch(`/api/chats/${chat.id}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newMessage }),
        });
        setNewMessage("");
        fetchMessages();
        onMessageSent();
      }
    } catch {
      Alert.alert("Error", "No se pudo enviar el mensaje");
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
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={scrollToBottom}
      >
        {messages.map((msg) => (
          <View
            key={msg.chatId}
            style={[
              styles.messageBubble,
              msg.sender.id === userInfoRaw?.id
                ? styles.myMessage
                : styles.otherMessage,
            ]}
          >
            <Text style={styles.senderName}>{msg.sender.id}</Text>
            {msg.type === "audio" && msg.audioUrl ? (
              <TouchableOpacity
                style={styles.audioButton}
                onPress={() => playSound(msg.audioUrl!, msg.chatId)}
              >
                <FontAwesome
                  name={playingMessageId === msg.chatId ? "pause" : "play"}
                  size={16}
                  color="#fff"
                />
                <Text style={styles.audioText}>Audio</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.messageText}>{msg.content}</Text>
            )}
            <Text style={styles.messageTime}>
              {new Date(msg.createdAt).toLocaleTimeString()}
            </Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Escribe un mensaje..."
          multiline
        />
        <TouchableOpacity
          style={styles.recordButton}
          onPress={recorder.isRecording ? stopRecording : startRecording}
        >
          <FontAwesome
            name={recorder.isRecording ? "stop" : "microphone"}
            size={24}
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
  myMessage: { alignSelf: "flex-end", backgroundColor: "#007AFF" },
  otherMessage: { alignSelf: "flex-start", backgroundColor: "#e5e5ea" },
  senderName: { fontWeight: "bold", marginBottom: 5, color: "#fff" },
  messageText: { color: "#fff" },
  audioButton: { flexDirection: "row", alignItems: "center", padding: 8 },
  audioText: { marginLeft: 8, color: "#fff" },
  messageTime: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: 5,
    alignSelf: "flex-end",
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
    maxHeight: 100,
  },
  recordButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f44336",
    justifyContent: "center",
    alignItems: "center",
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
});
