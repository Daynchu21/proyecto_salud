import http from "./httpClient";

const updateEmergencyUrl = "/api/emergencies/updateEmergency";
const updateEmergencyPendingUrl = "/api/emergencies/updatePendingEmergency";

interface emergencyBody {
  id: string;
  movilidadId: string;
  estado: string;
}

interface emergencyPendingBody {
  id: string;
  movilidadId: string;
}

export const updateEmergencyApp = async (
  id: string,
  movilidadId: string,
  estado: string
) => {
  const body: emergencyBody = { id, movilidadId, estado };
  return await http.post<emergencyBody, any>(updateEmergencyUrl, body);
};

export const updateEmergencyAppPending = async (
  id: string,
  movilidadId: string
) => {
  const body: emergencyPendingBody = { id, movilidadId };
  return await http.post<emergencyPendingBody, any>(
    updateEmergencyPendingUrl,
    body
  );
};
