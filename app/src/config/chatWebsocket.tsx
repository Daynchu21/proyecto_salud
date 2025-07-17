import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import { resendAllPendingMessages } from "../hook/resendAllPendingMessages";
import { ErrorManager } from "../utils/errorHandler";
import { EventBus } from "../utils/EventBus";
import { useNotificationSound } from "../utils/playNotificationSound.ts";
import { getChatWebSocket } from "./webSocketChtas";

// --- TYPES ---
interface User {
  id: string; // Keep as string if it comes from storage as string
  roles: string;
  [key: string]: any;
}

export interface MessageChat {
  chatId: number; // Changed to number based on Prisma schema
  sender: { id: number; firstName: string; lastName: string; roles: string }; // Changed sender.id to number
  content?: string;
  type: string; // 'text', 'audio'
  audioUrl?: string;
  audioDuration?: number;
  createdAt: string; // From backend, it's a string date
  id: number; // Message ID, changed to number
  isRead: boolean;
  // Properties added by backend for unread count updates (if included in message payload)
  unreadCountForChat?: number;
  totalUnreadCount?: number;
}

interface UnreadMessages {
  [chatId: number]: number; // Key is now number
}

// These interfaces are for the ChatWebSocket client, not the context value
interface IChatWebSocket {
  connect: () => void;
  disconnect: () => void;
  sendChatMessage: (
    chatId: number,
    content: string,
    recipientId?: number,
    additionalData?: Record<string, any>
  ) => boolean;

  sendChatMessageRaw: (payload: Record<string, any>) => boolean;
  sendTypingNotification: (
    chatId: number, // Changed to number
    recipientId: number, // Changed to number
    isTyping: boolean
  ) => boolean;
  onConnectionChange: (handler: (connected: boolean) => void) => () => void;
  onError: (handler: (error: string) => void) => () => void;
  onChatMessages: (handler: (message: MessageChat) => void) => () => void;
  onChatMessage: (
    chatId: number, // Changed to number
    handler: (message: MessageChat) => void
  ) => () => void;
  onTyping: (
    chatId: number, // Changed to number
    handler: (userId: number, isTyping: boolean) => void // Changed userId to number
  ) => () => void;
  isConnected: boolean;
  reconnectAttempts: number;
  lastMessageReceived: number;
  onInitialUnreadCounts: (
    handler: (data: {
      unreadMessagesByChat: UnreadMessages;
      totalUnreadCount: number;
    }) => void
  ) => () => void;
  onUnreadCountsUpdated: (
    handler: (data: {
      chatId: number;
      unreadMessagesByChat: UnreadMessages;
      totalUnreadCount: number;
    }) => void
  ) => () => void;
  onChatReadStatusUpdated: (
    handler: (data: { chatId: number; unreadCount: number }) => void
  ) => () => void;
}

interface ChatWebSocketContextType {
  chatWebSocket: IChatWebSocket | null;
  isConnected: boolean;
  error: string | null;
  totalUnreadCount: number; // Renamed for clarity
  unreadMessagesByChat: UnreadMessages; // Renamed for clarity
  sendChatMessage: (
    chatId: number, // Changed to number
    content: string,
    recipientId?: number, // Changed to number
    additionalData?: Record<string, any>
  ) => boolean;
  sendChatMessageRaw: (payload: Record<string, any>) => boolean;
  sendTypingNotification: (
    chatId: number, // Changed to number
    recipientId: number, // Changed to number
    isTyping: boolean
  ) => boolean;
  onChatMessages: (handler: (message: MessageChat) => void) => () => void;
  onChatMessage: (
    chatId: number, // Changed to number
    handler: (message: MessageChat) => void
  ) => () => void;
  onTyping: (
    chatId: number, // Changed to number
    handler: (userId: number, isTyping: boolean) => void // Changed userId to number
  ) => () => void;
  markChatAsRead: (chatId: number) => void;
  markAllAsRead: () => void;
}

const ChatWebSocketContext = createContext<ChatWebSocketContextType | null>(
  null
);

interface ChatWebSocketProviderProps {
  children: ReactNode;
  user: User;
}

export const ChatWebSocketProvider: React.FC<ChatWebSocketProviderProps> = ({
  children,
  user,
}) => {
  const [chatWebSocket, setChatWebSocket] = useState<IChatWebSocket | null>(
    null
  );
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // States for unread counts
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [unreadMessagesByChat, setUnreadMessagesByChat] =
    useState<UnreadMessages>({});
  const chatWSRef = useRef<ReturnType<typeof getChatWebSocket> | null>(null);
  const initializedRef = useRef(false);

  const playNotificationSound = useNotificationSound();
  // Ensure user.id is parsed to a number consistently for WebSocket interactions
  const userIdAsNumber = user.id ? parseInt(user.id, 10) : NaN;

  // Ref to track AppState to prevent background reconnection attempts
  const appState = useRef(AppState.currentState);

  // --- WebSocket Event Handlers ---
  const handleConnectionChange = useCallback(
    async (connected: boolean) => {
      setIsConnected(connected);
      if (connected) {
        setError(null);
        EventBus.emit("websocket:reconnected");
        chatWSRef.current?.sendChatMessageRaw({
          type: "request_unread_counts",
        });
        await resendAllPendingMessages();
      }
    },
    [] // Depend on chatWebSocket to call onRequestUnreadCounts
  );

  const handleWebSocketError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    console.error("Chat WebSocket error:", errorMessage);
    ErrorManager.showError(errorMessage);
  }, []);

  const handleNewChatMessage = useCallback(
    (message: MessageChat) => {
      if (message.sender.id !== userIdAsNumber) {
        playNotificationSound();
      }
    },
    [userIdAsNumber, playNotificationSound]
  );

  const handleInitialUnreadCounts = useCallback(
    (data: {
      unreadMessagesByChat: UnreadMessages;
      totalUnreadCount: number;
    }) => {
      setUnreadMessagesByChat(data.unreadMessagesByChat);
      setTotalUnreadCount(data.totalUnreadCount);
    },
    []
  );

  const handleUnreadCountsUpdated = useCallback(
    (data: {
      chatId: number;
      unreadMessagesByChat: UnreadMessages;
      totalUnreadCount: number;
    }) => {
      setUnreadMessagesByChat(data.unreadMessagesByChat);
      setTotalUnreadCount(data.totalUnreadCount);
    },
    []
  );

  const handleChatReadStatusUpdated = useCallback(
    (data: { chatId: number; unreadCount: number }) => {
      setUnreadMessagesByChat((prev) => {
        const newUnread = { ...prev };
        if (data.unreadCount === 0) {
          delete newUnread[data.chatId];
        } else {
          newUnread[data.chatId] = data.unreadCount;
        }
        return newUnread;
      });
      // totalUnreadCount will be updated by the useEffect below
    },
    []
  );

  useEffect(() => {
    if (!chatWebSocket) return;

    const unsubscribe = chatWebSocket.onConnectionChange(
      handleConnectionChange
    );

    return () => {
      unsubscribe(); // Limpia el handler al desmontar o cambiar instancia
    };
  }, [chatWebSocket, handleConnectionChange]);

  useEffect(() => {
    const hasUser = !!user?.id;
    const validUserId = !isNaN(userIdAsNumber);
    const hasRoles =
      (Array.isArray(user.roles) && user.roles.length > 0) ||
      (typeof user.roles === "string" && user.roles.trim() !== "");
    if (!hasUser || !validUserId || !hasRoles) {
      return; // esperamos al login
    }
    if (initializedRef.current) {
      return; // ya lo hicimos antes
    }

    const ws = getChatWebSocket(user.id, user.roles, appState);
    chatWSRef.current = ws;
    setChatWebSocket(ws);

    const unsubscribes = [
      ws.onInitialUnreadCounts(handleInitialUnreadCounts),
      ws.onConnectionChange(handleConnectionChange),
      ws.onError(handleWebSocketError),
      ws.onChatMessages(handleNewChatMessage),
      ws.onUnreadCountsUpdated(handleUnreadCountsUpdated),
      ws.onChatReadStatusUpdated(handleChatReadStatusUpdated),
    ];

    ws.connect();

    initializedRef.current = true;

    return () => {
      unsubscribes.forEach((u) => u());
    };
  }, [
    user?.id,
    userIdAsNumber,
    // Transformamos roles a string para que React compare bien su identidad:
    JSON.stringify(user.roles),
    // appState: solo si realmente cambia de forma relevante; si no, sácalo de aquí
  ]);

  // --- App State Change Effect for Reconnection ---
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        const prev = appState.current;
        appState.current = nextAppState;

        if (prev.match(/inactive|background/) && nextAppState === "active") {
          const secondsSinceLastMessage =
            chatWebSocket && chatWebSocket.lastMessageReceived
              ? (Date.now() - chatWebSocket.lastMessageReceived) / 1000
              : 999;

          if (
            chatWebSocket &&
            (!chatWebSocket.isConnected || secondsSinceLastMessage > 30)
          ) {
            chatWebSocket.disconnect();
            chatWebSocket.connect();
          }
        }
      }
    );

    return () => subscription.remove();
  }, [chatWebSocket]);

  // --- Memoized functions for context value ---
  const memoizedSendChatMessage = useCallback(
    (
      chatId: number, // Changed to number
      content: string,
      recipientId?: number, // Changed to number
      additionalData: Record<string, any> = {}
    ) => {
      if (!chatWebSocket) {
        ErrorManager.showError(
          "No se pudo enviar el mensaje: Conexión de chat no disponible."
        );
        return false;
      }
      return chatWebSocket.sendChatMessage(
        chatId,
        content,
        recipientId,
        additionalData
      );
    },
    [chatWebSocket]
  );

  const memoizedSendChatMessageRaw = useCallback(
    (payload: Record<string, any>) => {
      if (!chatWebSocket) {
        ErrorManager.showError(
          "No se pudo enviar el mensaje raw: Conexión de chat no disponible."
        );
        return false;
      }
      return chatWebSocket.sendChatMessageRaw(payload);
    },
    [chatWebSocket]
  );

  const memoizedSendTypingNotification = useCallback(
    (
      chatId: number, // Changed to number
      recipientId: number, // Changed to number
      isTyping: boolean
    ) => {
      if (!chatWebSocket) {
        console.warn(
          "No se pudo enviar la notificación de escritura: Conexión de chat no disponible."
        );
        return false;
      }
      return chatWebSocket.sendTypingNotification(
        chatId,
        recipientId,
        isTyping
      );
    },
    [chatWebSocket]
  );

  const memoizedOnChatMessages = useCallback(
    (handler: (message: MessageChat) => void) => {
      if (!chatWebSocket) return () => {};
      return chatWebSocket.onChatMessages(handler);
    },
    [chatWebSocket]
  );

  const memoizedOnChatMessage = useCallback(
    (
      chatId: number, // Changed to number
      handler: (message: MessageChat) => void
    ) => {
      if (!chatWebSocket) return () => {};
      return chatWebSocket.onChatMessage(chatId, handler);
    },
    [chatWebSocket]
  );

  const memoizedOnTyping = useCallback(
    (
      chatId: number, // Changed to number
      handler: (userId: number, isTyping: boolean) => void // Changed userId to number
    ) => {
      if (!chatWebSocket) return () => {};
      return chatWebSocket.onTyping(chatId, handler);
    },
    [chatWebSocket]
  );

  // FRONTEND: ChatWebSocketProvider.tsx

  const markChatAsRead = useCallback(
    (chatId: number) => {
      // Actualización optimista: asumimos que la acción tendrá éxito y actualizamos la UI inmediatamente.
      const currentTotal = totalUnreadCount;
      const chatCount = unreadMessagesByChat[chatId] || 0;
      setTotalUnreadCount(Math.max(0, currentTotal - chatCount));

      setUnreadMessagesByChat((prev) => {
        if (!prev[chatId]) return prev;
        const newUnread = { ...prev };
        delete newUnread[chatId];
        return newUnread;
      });

      // Enviar mensaje al backend para que confirme el cambio en la BBDD
      chatWebSocket?.sendChatMessageRaw({
        type: "mark_read",
        chatId: chatId,
      });
    },
    [chatWebSocket, unreadMessagesByChat, totalUnreadCount] // Añadir dependencias
  );

  const markAllAsRead = useCallback(() => {
    // Optimistic UI update
    setUnreadMessagesByChat({});

    // Send WebSocket message to backend for marking all as read
    chatWebSocket?.sendChatMessageRaw({
      type: "mark_all_read",
      userId: userIdAsNumber, // Backend needs to know whose messages to mark
    });
  }, [chatWebSocket, userIdAsNumber]);

  return (
    <ChatWebSocketContext.Provider
      value={{
        chatWebSocket,
        isConnected,
        error,
        totalUnreadCount,
        unreadMessagesByChat,
        sendChatMessage: memoizedSendChatMessage,
        sendChatMessageRaw: memoizedSendChatMessageRaw,
        sendTypingNotification: memoizedSendTypingNotification,
        onChatMessages: memoizedOnChatMessages,
        onChatMessage: memoizedOnChatMessage,
        onTyping: memoizedOnTyping,
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
  if (!context) {
    throw new Error(
      "useChatWebSocket debe usarse dentro de ChatWebSocketProvider"
    );
  }
  return context;
};
