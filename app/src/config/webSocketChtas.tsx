// Cliente WebSocket para el sistema de chat en TypeScript

type ChatMessageHandler = (message: any) => void;
type TypingHandler = (userId: string, isTyping: boolean) => void;
type ConnectionHandler = (isConnected: boolean) => void;
type ErrorHandler = (error: string) => void;

export class ChatWebSocket {
  userId: string;
  userRole: string;
  socket: WebSocket | null;
  messagesHandlers: ChatMessageHandler[];
  messageHandlers: Map<string, ChatMessageHandler[]>;
  connectionHandlers: ConnectionHandler[];
  errorHandlers: ErrorHandler[];
  typingHandlers: Map<string, TypingHandler[]>;
  isConnected: boolean;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnectDelay: number;
  private pingIntervalId: any;

  constructor(userId: string, userRole: string) {
    this.userId = userId;
    this.userRole = userRole;
    this.socket = null;
    this.messagesHandlers = [];
    this.messageHandlers = new Map();
    this.connectionHandlers = [];
    this.errorHandlers = [];
    this.typingHandlers = new Map();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 120;
    this.reconnectDelay = 5000; // 5 segundos
    this.pingIntervalId = null;
  }

  connect() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) return;

    const wsUrl =
      (typeof process !== "undefined" && process.env.EXPO_PUBLIC_CHAT_WS_URL) ||
      "ws://localhost:8080";
    this.socket = new WebSocket(
      `${wsUrl}?userId=${this.userId}&userRole=${this.userRole}`
    );

    this.socket.onopen = () => {
      console.log("Conexión WebSocket establecida");
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyConnectionHandlers(true);

      // Keep alive (ping)
      this.pingIntervalId = setInterval(() => {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({ type: "ping" }));
        }
      }, 30000);
    };

    this.socket.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error("Error al procesar mensaje:", error);
        this.notifyErrorHandlers("Error al procesar mensaje");
      }
    };

    this.socket.onclose = () => {
      console.log("Conexión WebSocket cerrada");
      this.isConnected = false;
      this.notifyConnectionHandlers(false);
      if (this.pingIntervalId) {
        clearInterval(this.pingIntervalId);
        this.pingIntervalId = null;
      }
      this.attemptReconnect();
    };

    this.socket.onerror = (error: Event) => {
      console.error("Error en la conexión WebSocket:", error);
      this.notifyErrorHandlers("Error en la conexión WebSocket");
    };
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `Intento de reconexión ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
      );

      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error("Máximo número de intentos de reconexión alcanzado");
      this.notifyErrorHandlers("No se pudo reconectar al servidor");
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
      if (this.pingIntervalId) {
        clearInterval(this.pingIntervalId);
        this.pingIntervalId = null;
      }
    }
  }

  sendMessage(type: string, data: any): boolean {
    if (!this.isConnected || !this.socket) {
      console.error("No hay conexión WebSocket");
      this.notifyErrorHandlers("No hay conexión WebSocket");
      return false;
    }

    try {
      const message = JSON.stringify({
        type,
        ...data,
      });
      this.socket.send(message);
      return true;
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      this.notifyErrorHandlers("Error al enviar mensaje");
      return false;
    }
  }

  sendChatMessage(
    chatId: string,
    content: string | null,
    recipientId?: string,
    additionalData: any = {}
  ): boolean {
    return this.sendMessage("chat_message", {
      chatId,
      content,
      senderId: this.userId,
      recipientId,
      ...additionalData,
    });
  }

  sendTypingNotification(
    chatId: string,
    recipientId: string,
    isTyping: boolean
  ): boolean {
    return this.sendMessage("typing", {
      chatId,
      userId: this.userId,
      recipientId,
      isTyping,
    });
  }

  handleMessage(data: any) {
    switch (data.type) {
      case "chat_message":
        this.handleChatMessage(data.message);
        break;
      case "typing":
        this.handleTypingNotification(data);
        break;
      case "message_sent":
        // Mensaje enviado correctamente
        break;
      case "error":
        this.notifyErrorHandlers(data.message);
        break;
      default:
        console.log(`Tipo de mensaje desconocido: ${data.type}`);
    }
  }

  handleChatMessage(message: any) {
    const handlers = this.messageHandlers.get(message.chatId) || [];
    handlers.forEach((handler) => handler(message));

    this.messagesHandlers.forEach((handler) => handler(message));
  }

  handleTypingNotification(data: any) {
    const { chatId, userId, isTyping } = data;
    const handlers = this.typingHandlers.get(chatId) || [];
    handlers.forEach((handler) => handler(userId, isTyping));
  }

  onChatMessages(handler: ChatMessageHandler) {
    this.messagesHandlers.push(handler);
    return () => {
      const index = this.messagesHandlers.indexOf(handler);
      if (index !== -1) {
        this.messagesHandlers.splice(index, 1);
      }
    };
  }

  onChatMessage(chatId: string, handler: ChatMessageHandler) {
    if (!this.messageHandlers.has(chatId)) {
      this.messageHandlers.set(chatId, []);
    }
    this.messageHandlers.get(chatId)!.push(handler);

    return () => {
      const handlers = this.messageHandlers.get(chatId);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index !== -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  onTyping(chatId: string, handler: TypingHandler) {
    if (!this.typingHandlers.has(chatId)) {
      this.typingHandlers.set(chatId, []);
    }
    this.typingHandlers.get(chatId)!.push(handler);

    return () => {
      const handlers = this.typingHandlers.get(chatId);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index !== -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  onConnectionChange(handler: ConnectionHandler) {
    this.connectionHandlers.push(handler);
    return () => {
      const index = this.connectionHandlers.indexOf(handler);
      if (index !== -1) {
        this.connectionHandlers.splice(index, 1);
      }
    };
  }

  onError(handler: ErrorHandler) {
    this.errorHandlers.push(handler);
    return () => {
      const index = this.errorHandlers.indexOf(handler);
      if (index !== -1) {
        this.errorHandlers.splice(index, 1);
      }
    };
  }

  notifyConnectionHandlers(isConnected: boolean) {
    this.connectionHandlers.forEach((handler) => handler(isConnected));
  }

  notifyErrorHandlers(error: string) {
    this.errorHandlers.forEach((handler) => handler(error));
  }
}

// Instancia única global
let chatWebSocketInstance: ChatWebSocket | null = null;

export function getChatWebSocket(
  userId: string,
  userRole: string
): ChatWebSocket {
  if (
    !chatWebSocketInstance ||
    chatWebSocketInstance.userId !== userId ||
    chatWebSocketInstance.userRole !== userRole
  ) {
    chatWebSocketInstance = new ChatWebSocket(userId, userRole);
  }
  return chatWebSocketInstance;
}

export default ChatWebSocket;
