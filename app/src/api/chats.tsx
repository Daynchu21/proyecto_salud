import http from "./httpClient";

const ChatUrl = "/api/chats";

export const GetChats = async () => {
  return await http.get(ChatUrl);
};

export const GetChatIdMessages = async (chatId: string) => {
  return await http.get(`/api/chats/${chatId}/messages`);
};

export const SendMessage = async (chatId: string, message: string) => {
  return await http.post(`/api/chats/${chatId}/messages`, {
    type: "text",
    content: message,
  });
};
