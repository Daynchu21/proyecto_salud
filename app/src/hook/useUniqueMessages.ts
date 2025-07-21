// hook/useUniqueMessages.ts
import { useCallback, useState } from "react";

export const useUniqueMessages = () => {
  const [messages, setMessages] = useState<any[]>([]);

  const addMessage = useCallback((newMessage: any) => {
    setMessages((prevMessages) => {
      // ✅ Si ya existe por ID exacto, no agregar
      if (
        newMessage.id &&
        prevMessages.some((msg) => msg.id === newMessage.id)
      ) {
        return prevMessages;
      }

      // ✅ Reemplazo por localId (si viene desde WebSocket con localId)
      if (newMessage.id && newMessage.localId) {
        const index = prevMessages.findIndex(
          (msg) => msg.localId === newMessage.localId && msg.pending
        );
        if (index !== -1) {
          const updated = [...prevMessages];
          updated[index] = { ...newMessage, pending: false };
          return updated;
        }
      }

      // ✅ Reemplazo heurístico si NO viene localId (por timestamp + contenido + pending)
      if (newMessage.id) {
        const index = prevMessages.findIndex(
          (msg) =>
            msg.pending &&
            msg.content === newMessage.content &&
            Math.abs(msg.timestamp - newMessage.timestamp) < 3000 // 3s de margen
        );
        if (index !== -1) {
          const updated = [...prevMessages];
          updated[index] = { ...newMessage, pending: false };
          return updated;
        }
      }

      // ✅ Si no hay duplicados ni reemplazo, agregar normalmente
      return [...prevMessages, newMessage];
    });
  }, []);

  const setAllMessages = useCallback((newMessages: any[]) => {
    // Cuando cargas todos los mensajes, asegúrate de que no haya duplicados
    // y que solo se usen los mensajes con ID de servidor si están disponibles.
    const uniqueMessages = Array.from(
      new Map(newMessages.map((msg) => [msg.id || msg.localId, msg])).values()
    );
    setMessages(uniqueMessages);
  }, []);

  return { messages, addMessage, setAllMessages };
};
