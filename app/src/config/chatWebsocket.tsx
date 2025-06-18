import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { resendAllPendingMessages } from "../hook/resendAllPendingMessages";
import { EventBus } from "../utils/EventBus";
import { getChatWebSocket } from "./webSocketChtas";

// ==== TYPES ==== //
interface User {
  id: string;
  roles: string;
  [key: string]: any;
}

export interface MessageChat {
  chatId: string;
  sender: { id: string };
  [key: string]: any;
}

interface ChatWebSocket {
  connect: () => void;
  disconnect: () => void;
  sendChatMessage: (
    chatId: string,
    content: string,
    recipientId?: string,
    additionalData?: Record<string, any>
  ) => boolean;
  sendChatMessageRaw: (payload: Record<string, any>) => boolean;
  sendTypingNotification: (
    chatId: string,
    recipientId: string,
    isTyping: boolean
  ) => boolean;
  onConnectionChange: (handler: (connected: boolean) => void) => () => void;
  onError: (handler: (error: string) => void) => () => void;
  onChatMessages: (handler: (message: MessageChat) => void) => () => void;
  onChatMessage: (
    chatId: string,
    handler: (message: MessageChat) => void
  ) => () => void;
  onTyping: (
    chatId: string,
    handler: (userId: string, isTyping: boolean) => void
  ) => () => void;
}

interface UnreadMessages {
  [chatId: string]: number;
}

interface ChatWebSocketContextType {
  chatWebSocket: ChatWebSocket | null;
  isConnected: boolean;
  error: string | null;
  unreadCount: number;
  unreadMessages: UnreadMessages;
  sendChatMessage: (
    chatId: string,
    content: string,
    recipientId?: string,
    additionalData?: Record<string, any>
  ) => boolean;
  sendChatMessageRaw: (payload: Record<string, any>) => boolean;
  sendTypingNotification: (
    chatId: string,
    recipientId: string,
    isTyping: boolean
  ) => boolean;
  onChatMessages: (handler: (message: MessageChat) => void) => () => void;
  onChatMessage: (
    chatId: string,
    handler: (message: MessageChat) => void
  ) => () => void;
  onTyping: (
    chatId: string,
    handler: (userId: string, isTyping: boolean) => void
  ) => () => void;
  markChatAsRead: (chatId: string) => void;
  markAllAsRead: () => void;
}

const ChatWebSocketContext = createContext<ChatWebSocketContextType | null>(
  null
);

interface Props {
  children: ReactNode;
  user: User;
}

export const ChatWebSocketProvider: React.FC<Props> = ({ children, user }) => {
  const [chatWebSocket, setChatWebSocket] = useState<ChatWebSocket | null>(
    null
  );
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState<UnreadMessages>({});

  useEffect(() => {
    if (!user) return;

    const ws = getChatWebSocket(user.id, user.roles);

    const connectionHandler = async (connected: boolean) => {
      setIsConnected(connected);
      if (connected) {
        EventBus.emit("websocket:reconnected");
        await resendAllPendingMessages();
      }
    };

    const errorHandler = (errorMessage: string) => {
      setError(errorMessage);
      console.error("Chat WebSocket error:", errorMessage);
    };

    const removeConnectionHandler = ws.onConnectionChange(connectionHandler);
    const removeErrorHandler = ws.onError(errorHandler);

    ws.connect();
    setChatWebSocket(ws);

    return () => {
      removeConnectionHandler();
      removeErrorHandler();
      ws.disconnect();
    };
  }, [user]);

  const sendChatMessage = (
    chatId: string,
    content: string,
    recipientId?: string,
    additionalData: Record<string, any> = {}
  ) => {
    if (!chatWebSocket) return false;
    return chatWebSocket.sendChatMessage(
      chatId,
      content,
      recipientId,
      additionalData
    );
  };

  const sendChatMessageRaw = (payload: Record<string, any>) => {
    if (!chatWebSocket) return false;
    return chatWebSocket.sendChatMessageRaw(payload);
  };

  const sendTypingNotification = (
    chatId: string,
    recipientId: string,
    isTyping: boolean
  ) => {
    if (!chatWebSocket) return false;
    return chatWebSocket.sendTypingNotification(chatId, recipientId, isTyping);
  };

  const onChatMessages = (handler: (message: MessageChat) => void) => {
    if (!chatWebSocket) return () => {};
    return chatWebSocket.onChatMessages(handler);
  };

  const onChatMessage = (
    chatId: string,
    handler: (message: MessageChat) => void
  ) => {
    if (!chatWebSocket) return () => {};
    return chatWebSocket.onChatMessage(chatId, handler);
  };

  const onTyping = (
    chatId: string,
    handler: (userId: string, isTyping: boolean) => void
  ) => {
    if (!chatWebSocket) return () => {};
    return chatWebSocket.onTyping(chatId, handler);
  };

  const markChatAsRead = (chatId: string) => {
    if (!chatWebSocket) return;
    setUnreadMessages((prev) => {
      if (!prev[chatId]) return prev;
      const newUnread = { ...prev };
      delete newUnread[chatId];
      return newUnread;
    });
  };

  const markAllAsRead = () => {
    if (!chatWebSocket) return;
    setUnreadMessages({});
  };

  useEffect(() => {
    const totalUnread = Object.values(unreadMessages).reduce(
      (sum, count) => sum + count,
      0
    );
    setUnreadCount(totalUnread);
  }, [unreadMessages]);

  useEffect(() => {
    if (!chatWebSocket) return;

    const handleNewMessage = (message: MessageChat) => {
      setUnreadMessages((prev) => {
        const chatId = message.chatId;
        const currentCount = prev[chatId] || 0;
        return {
          ...prev,
          [chatId]: currentCount + 1,
        };
      });

      if (message.sender.id !== user.id) {
        // Agregar sonido u otras acciones si se desea
      }
    };

    const unsubscribe = chatWebSocket.onChatMessages(handleNewMessage);
    return () => unsubscribe();
  }, [chatWebSocket, user]);

  return (
    <ChatWebSocketContext.Provider
      value={{
        chatWebSocket,
        isConnected,
        error,
        unreadCount,
        unreadMessages,
        sendChatMessage,
        sendChatMessageRaw,
        sendTypingNotification,
        onChatMessages,
        onChatMessage,
        onTyping,
        markChatAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </ChatWebSocketContext.Provider>
  );
};

// Custom hook
export const useChatWebSocket = (): ChatWebSocketContextType => {
  const context = useContext(ChatWebSocketContext);
  if (!context)
    throw new Error(
      "useChatWebSocket debe usarse dentro de ChatWebSocketProvider"
    );
  return context;
};
