import { prioridadEN } from "../components/config-emergency";
import http from "./httpClient";

const getEmergencyByAmbulanceUrl = (id: string) =>
  `/api/emergencies/ambulance/${id}`;

export interface EmergencyIF {
  id: string;
  codigo: string;
  fechaLlamada: string;
  fechaDespacho: string;
  fechaArribo: string;
  fechaFinalizacion: string | null;
  domicilio: string;
  latitud: number;
  longitud: number;
  hospitalId: number;
  movilidadId: number;
  pacienteNombre: string;
  pacienteEdad: number | null;
  pacienteDNI: string | null;
  tipoEmergencia: string;
  prioridad: prioridadEN;
  notas: string;
  contactoNombre: string | null;
  contactoTelefono: string | null;
  estado: string;
  hospitalName: string;
  movilidadName: string;
  hospitalLatitud: number;
  hospitalLongitud: number;
}

export const EmergencyApi = async (ambulanceId: string) => {
  return await http.get<Array<EmergencyIF>>(
    getEmergencyByAmbulanceUrl(ambulanceId)
  );
};
