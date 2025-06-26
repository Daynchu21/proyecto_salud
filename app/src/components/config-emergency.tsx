type Option = {
  value: string;
  label: string;
};

export enum prioridadEN {
  ALTA = "ALTA",
  MEDIA = "MEDIA",
  BAJA = "BAJA",
}

export type PriorityColor = {
  borderColor: string;
  backgroundColor: string;
  textColor: string;
};

export const EMERGENCY_PRIORITY_TYPES = [
  { value: "ALTA", label: "Alta" },
  { value: "MEDIA", label: "Media" },
  { value: "BAJA", label: "Baja" },
];

export function getPriorityColor(prioridad: prioridadEN): PriorityColor {
  switch (prioridad) {
    case prioridadEN.ALTA:
      return {
        borderColor: "#dc2626",
        backgroundColor: "#fee2e2",
        textColor: "#dc2626",
      };
    case prioridadEN.MEDIA:
      return {
        borderColor: "#c2410c",
        backgroundColor: "#ffedd5",
        textColor: "#c2410c",
      };
    case prioridadEN.BAJA:
      return {
        borderColor: "#064e3b",
        backgroundColor: "#d1fae5",
        textColor: "#064e3b",
      };
    default:
      return {
        borderColor: "#ccc",
        backgroundColor: "#f5f5f5",
        textColor: "#999",
      };
  }
}

export const DAYS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

export const SPECIALTIES = [
  "Cardiología",
  "Dermatología",
  "Endocrinología",
  "Gastroenterología",
  "Neurología",
  "Oftalmología",
  "Oncología",
  "Pediatría",
  "Traumatología",
  "Urología",
];

export const EMERGENCY_TYPES = [
  { value: "TRAUMA", label: "Trauma" },
  { value: "CARDIACO", label: "Cardiaco" },
  { value: "RESPIRATORIO", label: "Respiratorio" },
  { value: "OBSTETRICO", label: "Obstetrico" },
  { value: "PEDIATRICO", label: "Pediátrico" },
  { value: "INTOXICACION", label: "Intoxicación" },
  { value: "PSIQUIATRICO", label: "Psiquiátrico" },
  { value: "OTRO", label: "Otro" },
];

export const EMERGENCY_STATE = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "DESPACHADA", label: "Aceptada" },
  { value: "EN_CAMINO", label: "En Camino" },
  { value: "EN_SITIO", label: "En Sitio" },
  { value: "EN_TRASLADO", label: "En Translado" },
  { value: "FINALIZADA", label: "Finalizada" },
  { value: "CANCELADA", label: "Cancelada" },
];

export const EMERGENCY_STATE_BUTTONS = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "DESPACHADA", label: "Aceptada" },
  { value: "EN_CAMINO", label: "En Camino" },
  { value: "EN_SITIO", label: "Unidad en sitio" },
  { value: "EN_TRASLADO", label: "Unidad en traslado" },
  { value: "FINALIZADA", label: "Emergencia finalizada" },
  { value: "CANCELADA", label: "Emergencia cancelada" },
];

export const EMERGENCY_STATE_ICON = [
  { value: "PENDIENTE", label: "faClock" },
  { value: "DESPACHADA", label: "faTruckMedical" },
  { value: "EN_CAMINO", label: "faRoute" },
  { value: "EN_SITIO", label: "faMapMarkerAlt" },
  { value: "EN_TRASLADO", label: "faAmbulance" },
  { value: "FINALIZADA", label: "faCheckCircle" },
  { value: "CANCELADA", label: "faTimesCircle" },
];

export const MEDICAL_CENTERS_TYPES = [
  { value: "CLINICA", label: "Clínica" },
  { value: "SANATORIO", label: "Sanatorio" },
  { value: "HOSPITAL", label: "Hospital" },
  { value: "CENTRO", label: "Centro Sanitario" },
];

const OPTIONS_MAP = {
  EMERGENCY_PRIORITY_TYPES,
  EMERGENCY_TYPES,
  EMERGENCY_STATE,
  EMERGENCY_STATE_BUTTONS,
  EMERGENCY_STATE_ICON,
  MEDICAL_CENTERS_TYPES,
} as const;

export function getLabelByValue<K extends keyof typeof OPTIONS_MAP>(
  constantName: K,
  value: string | prioridadEN
): string {
  const options = OPTIONS_MAP[constantName] as ReadonlyArray<Option>;
  const option = options.find((opt) => opt.value === value);
  return option ? option.label : "Desconocido";
}

export function getNextEmergencyState(currentState: string): string | null {
  const validSequence = ["EN_CAMINO", "EN_SITIO", "EN_TRASLADO", "FINALIZADA"];

  const currentIndex = validSequence.indexOf(currentState);

  if (currentIndex === -1 || currentIndex === validSequence.length - 1) {
    return null;
  }

  return validSequence[currentIndex + 1];
}
