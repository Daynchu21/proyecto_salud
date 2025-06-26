// hook/useUniqueMessages.ts
import { useCallback, useState } from "react";

export const useUniqueMessages = () => {
  const [messages, setMessages] = useState<any[]>([]);

  const addMessage = useCallback((newMessage: any) => {
    setMessages((prevMessages) => {
      // Si el nuevo mensaje tiene un 'id' (es del servidor)
      // Y si ya existe un mensaje con el mismo 'localId' pendiente, actualízalo
      if (newMessage.id && newMessage.localId) {
        const existingIndex = prevMessages.findIndex(
          (msg) => msg.localId === newMessage.localId && msg.pending
        );
        if (existingIndex !== -1) {
          const updatedMessages = [...prevMessages];
          // Reemplaza el mensaje pendiente con el mensaje definitivo del servidor
          updatedMessages[existingIndex] = { ...newMessage, pending: false };
          return updatedMessages;
        }
      }

      // Si el mensaje tiene un ID de servidor, asegúrate de no duplicarlo
      if (
        newMessage.id &&
        prevMessages.some((msg) => msg.id === newMessage.id)
      ) {
        return prevMessages; // Ya tenemos este mensaje del servidor
      }

      // De lo contrario, simplemente añade el nuevo mensaje
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
