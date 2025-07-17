// ChatWebSocket.ts
import { AppStateStatus } from "react-native";

// CAMBIO: Actualizamos los tipos de los handlers para usar 'number'
type ChatMessageHandler = (message: any) => void;
type TypingHandler = (userId: number, isTyping: boolean) => void; // userId ahora es number
type ConnectionHandler = (isConnected: boolean) => void;
type ErrorHandler = (error: string) => void;
// -- FIN CAMBIO

const WS_MESSAGE_TYPES = {
  CHAT_MESSAGE: "chat_message",
  TYPING: "typing",
  MESSAGE_SENT: "message_sent",
  ERROR: "error",
  PING: "ping",
  // Agregamos los nuevos tipos para que la clase los conozca si es necesario
  INITIAL_UNREAD_COUNTS: "initial_unread_counts",
  UNREAD_COUNTS_UPDATED: "unread_counts_updated",
  CHAT_READ_STATUS_UPDATED: "chat_read_status_updated",
  MARK_READ: "mark_read",
  CONNECTION_STATUS: "connection",
};

export class ChatWebSocket {
  userId: string; // El userId inicial puede seguir siendo string si así se recibe
  userRole: string;
  socket: WebSocket | null = null;

  private messagesHandlers: ChatMessageHandler[] = [];
  // CAMBIO: La clave del Map ahora es 'number' para el chatId
  private messageHandlers = new Map<number, ChatMessageHandler[]>();
  private connectionHandlers: ConnectionHandler[] = [];
  private errorHandlers: ErrorHandler[] = [];
  // CAMBIO: La clave del Map ahora es 'number' para el chatId
  private typingHandlers = new Map<number, TypingHandler[]>();
  // -- FIN CAMBIO

  // Estos son los handlers para los eventos de conteo
  private initialUnreadCountsHandlers: Function[] = [];
  private unreadCountsUpdatedHandlers: Function[] = [];
  private chatReadStatusUpdatedHandlers: Function[] = [];

  isConnected = false;
  reconnectAttempts = 0;
  lastMessageReceived: number = Date.now();

  private maxReconnectAttempts = 60;
  private initialReconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private pingIntervalId: ReturnType<typeof setInterval> | null = null;
  private heartbeatIntervalId: ReturnType<typeof setInterval> | null = null;

  private appStateRef: React.MutableRefObject<AppStateStatus>;

  constructor(
    userId: string,
    userRole: string,
    appStateRef: React.MutableRefObject<AppStateStatus>
  ) {
    this.userId = userId;
    this.userRole = userRole;
    this.appStateRef = appStateRef;
  }

  // --- A partir de aquí, el resto del constructor y métodos de conexión son iguales ---
  // ... (getReconnectDelay, connect, startPing, etc. no necesitan cambios)

  // El método connect y otros métodos internos no cambian...
  connect() {
    if (
      this.socket?.readyState === WebSocket.OPEN ||
      this.socket?.readyState === WebSocket.CONNECTING
    )
      return;
    if (this.reconnectTimeoutId) clearTimeout(this.reconnectTimeoutId);

    const wsUrl = process.env.EXPO_PUBLIC_CHAT_WS_URL || "ws://localhost:8080";
    const connectionString = `${wsUrl}?userId=${this.userId}&userRole=${this.userRole}`;
    this.socket = new WebSocket(connectionString);

    this.socket.onopen = () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.startPing();
      this.startHeartbeatMonitor();
      this.notifyConnectionHandlers(true);
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch {
        this.notifyErrorHandlers("Mensaje inválido del servidor");
      }
    };

    this.socket.onclose = (event) => {
      console.warn(`⚠️ Desconectado: ${event.code} - ${event.reason}`);
      this.isConnected = false;
      this.stopPing();
      this.stopHeartbeatMonitor();
      this.notifyConnectionHandlers(false);

      // IMPORTANTE: Mostrar códigos específicos que ayudan a saber por qué
      switch (event.code) {
        case 1000:
          console.log("🔌 Cierre normal");
          break;
        case 1006:
          console.log("❌ Cierre abrupto/no limpio");
          break;
        case 1008:
          console.log("🚫 Violación de protocolo: parámetro faltante");
          break;
      }

      this.attemptReconnect();
    };

    this.socket.onerror = (error) => {
      console.error("❌ Error de conexión", error);
      this.notifyErrorHandlers("Error en la conexión");
    };
  }

  // El método handleMessage necesita saber de los nuevos tipos
  private handleMessage(data: any) {
    switch (data.type) {
      case WS_MESSAGE_TYPES.CHAT_MESSAGE:
        this.messagesHandlers.forEach((h) => h(data.message));
        this.messageHandlers
          .get(data.message.chatId)
          ?.forEach((h) => h(data.message));
        break;
      case WS_MESSAGE_TYPES.TYPING:
        this.typingHandlers
          .get(data.chatId)
          ?.forEach((h) => h(data.userId, data.isTyping));
        break;
      case WS_MESSAGE_TYPES.ERROR:
        this.notifyErrorHandlers(data.message);
        break;
      // Añadimos los casos para los contadores
      case WS_MESSAGE_TYPES.INITIAL_UNREAD_COUNTS:
        this.initialUnreadCountsHandlers.forEach((h) => h(data));
        break;
      case WS_MESSAGE_TYPES.UNREAD_COUNTS_UPDATED:
        this.unreadCountsUpdatedHandlers.forEach((h) => h(data));
        break;
      case WS_MESSAGE_TYPES.CHAT_READ_STATUS_UPDATED:
        this.chatReadStatusUpdatedHandlers.forEach((h) => h(data));
        break;
      // Los demás casos (ping, message_sent) no necesitan handlers especiales aquí
      case WS_MESSAGE_TYPES.MESSAGE_SENT:
      case WS_MESSAGE_TYPES.PING:
        this.lastMessageReceived = Date.now();
        break;
      case WS_MESSAGE_TYPES.CONNECTION_STATUS:
        console.log(`🟢 Conectado: ${data.userId} (${data.role})`);
        break;
      default:
        console.warn("Tipo de mensaje desconocido:", data.type);
    }
  }

  // --- MÉTODOS PÚBLICOS (AQUÍ ESTÁN LOS CAMBIOS IMPORTANTES) ---

  // CAMBIO: `chatId`, `recipientId` son 'number'. `additionalData` tiene tipo explícito.
  sendChatMessage(
    chatId: number,
    content: string,
    recipientId?: number,
    additionalData: Record<string, any> = {}
  ): boolean {
    return this.sendChatMessageRaw({
      type: WS_MESSAGE_TYPES.CHAT_MESSAGE,
      chatId,
      content,
      recipientId,
      ...additionalData,
    });
  }

  sendChatMessageRaw(payload: Record<string, any>): boolean {
    if (!this.isConnected || this.socket?.readyState !== WebSocket.OPEN) {
      console.error("No se pudo enviar mensaje raw: No hay conexión");
      return false;
    }
    try {
      this.socket.send(JSON.stringify(payload));
      return true;
    } catch (e) {
      console.error("Error al enviar mensaje raw:", e);
      return false;
    }
  }

  // CAMBIO: `chatId` y `recipientId` son 'number'.
  sendTypingNotification(
    chatId: number,
    recipientId: number,
    isTyping: boolean
  ): boolean {
    return this.sendChatMessageRaw({
      type: WS_MESSAGE_TYPES.TYPING,
      chatId,
      recipientId,
      isTyping,
      userId: parseInt(this.userId, 10), // El backend espera el ID del que está escribiendo
    });
  }

  // --- MÉTODOS DE SUSCRIPCIÓN (on...) ---

  onConnectionChange(handler: ConnectionHandler): () => void {
    this.connectionHandlers.push(handler);
    if (this.isConnected) {
      handler(true);
    }
    return () => {
      this.connectionHandlers = this.connectionHandlers.filter(
        (h) => h !== handler
      );
    };
  }

  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.push(handler);
    return () => {
      this.errorHandlers = this.errorHandlers.filter((h) => h !== handler);
    };
  }

  onChatMessages(handler: ChatMessageHandler): () => void {
    this.messagesHandlers.push(handler);
    return () => {
      this.messagesHandlers = this.messagesHandlers.filter(
        (h) => h !== handler
      );
    };
  }

  // CAMBIO: `chatId` es 'number'.
  onChatMessage(chatId: number, handler: ChatMessageHandler): () => void {
    if (!this.messageHandlers.has(chatId)) {
      this.messageHandlers.set(chatId, []);
    }
    this.messageHandlers.get(chatId)!.push(handler);
    return () => {
      const handlers = this.messageHandlers
        .get(chatId)
        ?.filter((h) => h !== handler);
      if (handlers && handlers.length > 0) {
        this.messageHandlers.set(chatId, handlers);
      } else {
        this.messageHandlers.delete(chatId);
      }
    };
  }

  // CAMBIO: `chatId` es 'number' y el handler espera `userId` como `number`.
  onTyping(chatId: number, handler: TypingHandler): () => void {
    if (!this.typingHandlers.has(chatId)) {
      this.typingHandlers.set(chatId, []);
    }
    this.typingHandlers.get(chatId)!.push(handler);
    return () => {
      const handlers = this.typingHandlers
        .get(chatId)
        ?.filter((h) => h !== handler);
      if (handlers && handlers.length > 0) {
        this.typingHandlers.set(chatId, handlers);
      } else {
        this.typingHandlers.delete(chatId);
      }
    };
  }

  // --- Métodos para los contadores ---

  onInitialUnreadCounts(handler: (data: any) => void): () => void {
    this.initialUnreadCountsHandlers.push(handler);
    return () => {
      this.initialUnreadCountsHandlers =
        this.initialUnreadCountsHandlers.filter((h) => h !== handler);
    };
  }

  onUnreadCountsUpdated(handler: (data: any) => void): () => void {
    this.unreadCountsUpdatedHandlers.push(handler);
    return () => {
      this.unreadCountsUpdatedHandlers =
        this.unreadCountsUpdatedHandlers.filter((h) => h !== handler);
    };
  }

  onChatReadStatusUpdated(handler: (data: any) => void): () => void {
    this.chatReadStatusUpdatedHandlers.push(handler);
    return () => {
      this.chatReadStatusUpdatedHandlers =
        this.chatReadStatusUpdatedHandlers.filter((h) => h !== handler);
    };
  }

  onRequestUnreadCounts(): void {
    this.sendChatMessageRaw({ type: "request_unread_counts" });
  }

  sendReadyForCounts(): void {
    this.sendChatMessageRaw({ type: "ready_for_counts" });
  }

  // El resto de la clase no necesita cambios...
  // (disconnect, notify handlers, etc.)
  // ...
  private notifyConnectionHandlers(isConnected: boolean) {
    this.connectionHandlers.forEach((h) => h(isConnected));
  }

  private notifyErrorHandlers(error: string) {
    this.errorHandlers.forEach((h) => h(error));
  }

  disconnect() {
    if (this.socket) {
      console.log("❎ Desconectando manualmente");
      this.stopPing();
      this.stopHeartbeatMonitor();
      if (this.reconnectTimeoutId) clearTimeout(this.reconnectTimeoutId);
      this.socket.close(1000, "disconnect");
      this.socket = null;
      this.isConnected = false;
      this.notifyConnectionHandlers(false);
    }
  }

  private startPing() {
    this.stopPing();
    this.pingIntervalId = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.sendChatMessageRaw({ type: WS_MESSAGE_TYPES.PING });
      } else {
        this.stopPing();
      }
    }, 30000);
  }

  private stopPing() {
    if (this.pingIntervalId) clearInterval(this.pingIntervalId);
    this.pingIntervalId = null;
  }

  private startHeartbeatMonitor() {
    this.stopHeartbeatMonitor();
    this.heartbeatIntervalId = setInterval(() => {
      if (this.isConnected && Date.now() - this.lastMessageReceived > 60000) {
        console.warn("🛑 Sin mensajes del servidor en 60s. Reiniciando...");
        this.socket?.close();
      }
    }, 10000);
  }

  private stopHeartbeatMonitor() {
    if (this.heartbeatIntervalId) clearInterval(this.heartbeatIntervalId);
    this.heartbeatIntervalId = null;
  }

  private attemptReconnect() {
    if (this.appStateRef.current !== "active") {
      console.log("⏸ App en segundo plano, reconexión pospuesta.");
      this.reconnectAttempts = 0;
      return;
    }
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.notifyErrorHandlers("No se pudo reconectar al chat.");
      return;
    }

    const delay = this.getReconnectDelay();
    console.log(`🔄 Reintentando conexión en ${Math.round(delay / 1000)}s`);
    this.reconnectTimeoutId = setTimeout(() => this.connect(), delay);
    this.reconnectAttempts++;
  }

  private getReconnectDelay() {
    const base = Math.min(
      this.initialReconnectDelay * Math.pow(1.5, this.reconnectAttempts),
      this.maxReconnectDelay
    );
    return base + Math.random() * base * 0.2;
  }
}

// Factoría para instanciar el WebSocket, esto no cambia
let chatWebSocketInstance: ChatWebSocket | null = null;

export const getChatWebSocket = (
  userId: string,
  userRole: string,
  appStateRef: React.MutableRefObject<AppStateStatus>
): ChatWebSocket => {
  if (!chatWebSocketInstance) {
    chatWebSocketInstance = new ChatWebSocket(userId, userRole, appStateRef);
  }
  return chatWebSocketInstance;
};
