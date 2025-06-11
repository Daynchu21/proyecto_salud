type Callback = () => void;

const events: Record<string, Callback[]> = {};

export const EventBus = {
  on(event: string, callback: Callback) {
    if (!events[event]) events[event] = [];
    events[event].push(callback);
  },
  off(event: string, callback: Callback) {
    if (!events[event]) return;
    events[event] = events[event].filter((cb) => cb !== callback);
  },
  emit(event: string) {
    if (!events[event]) return;
    events[event].forEach((cb) => cb());
  },
};
