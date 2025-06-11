const { Expo } = require("expo-server-sdk");

export async function sendPushNotification(pushToken, message, chatId) {
  const expo = new Expo();

  const messages = [
    {
      to: pushToken,
      sound: "default",
      title: "Nuevo mensaje",
      body: message.content || "Mensaje de audio",
      data: { chatId: chatId },
    },
  ];

  const chunks = expo.chunkPushNotifications(messages);

  for (let chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  }
}
