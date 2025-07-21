import http from "./httpClient";

interface tokenBody {
  movilidadId: string;
  pushToken: string;
}

export interface TokenResponse {
  token: string;
  Error?: string;
}

const setTokenUrl = "/api/sessions/push-token";

export const setTokenMobile = async (
  movilidadId: string,
  pushToken: string
) => {
  const body: tokenBody = { pushToken, movilidadId };
  return await http.post<tokenBody, TokenResponse>(setTokenUrl, body);
};
