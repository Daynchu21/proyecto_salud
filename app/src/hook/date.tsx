import { DateTime } from "luxon";

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

export function getHourMinuteInArgentina(startTime: string) {
  const date = new Date(startTime);

  const formatter = new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false, // Cambiá a true si querés formato 12h con AM/PM
  });

  return formatter.format(date);
}

const ARGENTINA_TIMEZONE = "America/Argentina/Buenos_Aires";

/**
 * Devuelve un objeto Date en hora de Argentina (para uso en pickers, etc.)
 */
export function getCurrentArgentineDateTime() {
  return DateTime.now()
    .setZone(ARGENTINA_TIMEZONE)
    .toUTC() // ⬅️ convierte correctamente a UTC
    .toJSDate(); // ⬅️ genera un Date con valor UTC correcto
}

/**
 * Convierte un objeto Date o DateTime a timestamp en segundos (hora Argentina)
 */
export function toArgentineTimestamp(date: Date) {
  const zoned = DateTime.fromJSDate(date).setZone(ARGENTINA_TIMEZONE);
  return Math.floor(zoned.toSeconds());
}

/**
 * Convierte un string tipo "05-07-2025 13:30" a timestamp (segundos)
 */
export function parseArgentineStringToTimestamp(dateStr: string) {
  const [fecha, hora] = dateStr.trim().split(" ");
  const [dia, mes, anio] = fecha.split("-");
  const [horas, minutos] = hora.split(":");

  const dt = DateTime.fromObject(
    {
      day: Number(dia),
      month: Number(mes),
      year: Number(anio),
      hour: Number(horas),
      minute: Number(minutos),
    },
    { zone: ARGENTINA_TIMEZONE }
  );

  return Math.floor(dt.toSeconds());
}

/**
 * Convierte un timestamp a string legible en hora Argentina
 * Ejemplo: "05/07/2025 13:23:00"
 */
export function formatTimestampToArgentineString(timestamp: number) {
  return DateTime.fromSeconds(timestamp)
    .setZone(ARGENTINA_TIMEZONE)
    .toFormat("dd/MM/yyyy HH:mm:ss");
}

/**
 * Devuelve un Date con hora Argentina (solo para test o DatePicker)
 */
export function getCurrentArgentineDateTimeTEST() {
  const argentina = DateTime.now().setZone(ARGENTINA_TIMEZONE);
  return new Date(
    argentina.year,
    argentina.month - 1,
    argentina.day,
    argentina.hour,
    argentina.minute,
    argentina.second
  );
}

/**
 * Extrae solo HH:mm desde un ISO string (en hora Argentina)
 */
export function getTimeDifferenceHHmm(isoDateStr: string) {
  const inputTime = DateTime.fromISO(isoDateStr, { zone: ARGENTINA_TIMEZONE });
  const now = DateTime.now().setZone(ARGENTINA_TIMEZONE);

  if (!inputTime.isValid) return "--:--";

  const diff = now.diff(inputTime).shiftTo("hours", "minutes").toObject();

  const hours = Math.abs(Math.floor(diff.hours || 0))
    .toString()
    .padStart(2, "0");
  const minutes = Math.abs(Math.floor(diff.minutes || 0))
    .toString()
    .padStart(2, "0");

  return `${hours}:${minutes}`;
}

/**
 * Devuelve fecha actual en ISO UTC para el backend,
 * pero calculada desde zona horaria Argentina
 */
export function getCurrentArgentinaDateISOForBackend() {
  return DateTime.now().setZone(ARGENTINA_TIMEZONE).toUTC().toISO();
}

/**
 * Convierte un ISO string local Argentina a UTC ISO string
 * útil para enviar al backend
 */
export function formatLocalArgentineString(dateStr: string) {
  const dt = DateTime.fromISO(dateStr, { zone: ARGENTINA_TIMEZONE });

  if (!dt.isValid) return "Fecha inválida";

  return dt.toFormat("dd/MM/yyyy HH:mm"); // Ej: "05 julio 2025 13:46"
}
