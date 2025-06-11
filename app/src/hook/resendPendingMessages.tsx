import AsyncStorage from "@react-native-async-storage/async-storage";
import { SendMessage } from "../api/chats"; // ajustá la ruta a tu proyecto

let isResending = false;

export const resendPendingMessages = async (
  chatId: string,
  fetchMessages: any
) => {
  if (isResending) return;
  isResending = true;

  const pendingKey = `pending_messages_${chatId}`;
  const stored = await AsyncStorage.getItem(pendingKey);
  const messages = stored ? JSON.parse(stored) : [];

  const successfullySent = [];

  for (const msg of messages) {
    try {
      await SendMessage(chatId, msg.content);
      successfullySent.push(msg);
    } catch (error) {
      console.log("Error al reenviar", error);
      break; // si uno falla, no sigas
    }
  }

  if (successfullySent.length === messages.length) {
    await AsyncStorage.removeItem(pendingKey);
  } else {
    const remaining = messages.slice(successfullySent.length);
    await AsyncStorage.setItem(pendingKey, JSON.stringify(remaining));
  }

  fetchMessages();
  isResending = false;
};
