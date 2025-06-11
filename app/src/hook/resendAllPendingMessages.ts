// hook/resendAllPendingMessages.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SendMessage } from "../api/chats";

export const resendAllPendingMessages = async () => {
  const keys = await AsyncStorage.getAllKeys();
  const pendingKeys = keys.filter((key) => key.startsWith("pending_messages_"));

  for (const key of pendingKeys) {
    const chatId = key.replace("pending_messages_", "");
    const stored = await AsyncStorage.getItem(key);
    const messages = stored ? JSON.parse(stored) : [];

    const sentSuccessfully: any[] = [];

    for (const msg of messages) {
      try {
        await SendMessage(chatId, msg.content);
        sentSuccessfully.push(msg);
      } catch (err) {
        break; // detener si falla uno
      }
    }

    if (sentSuccessfully.length === messages.length) {
      await AsyncStorage.removeItem(key);
    } else {
      const remaining = messages.slice(sentSuccessfully.length);
      await AsyncStorage.setItem(key, JSON.stringify(remaining));
    }
  }
};
