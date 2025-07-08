import http from "./httpClient";

const serverTimeUrl = "/api/time";

export interface serverTimeResponse {
  serverTime: Date;
}

export const getTimeServer = async () => {
  return await http.get<serverTimeResponse>(serverTimeUrl);
};
