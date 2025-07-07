import { EventTypeLog } from "../utils/global";
import http from "./httpClient";

const ChatUrl = "/api/events";

export const SendEvents = async (
  eventType: EventTypeLog,
  metadata: Record<string, any>
) => {
  return await http.post(ChatUrl, {
    type: eventType,
    metadata,
  });
};
