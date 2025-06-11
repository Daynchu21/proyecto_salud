export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);

  return date.toLocaleString("es-AR", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export const formatTime = (date: Date) =>
  date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
