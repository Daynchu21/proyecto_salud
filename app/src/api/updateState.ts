import http from "./httpClient";

const updateEmergencyUrl = "/api/emergencies/updateEmergency";
const updateEmergencyPendingUrl = "/api/emergencies/updatePendingEmergency";

interface emergencyBody {
  id: string;
  ambulanceId: string;
  currentState: string;
}

interface emergencyPendingBody {
  id: string;
  movilidadId: string;
}

export const updateEmergencyApp = async (
  id: string,
  currentState: string,
  ambulanceId: string
) => {
  const body: emergencyBody = { id, currentState, ambulanceId };
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
