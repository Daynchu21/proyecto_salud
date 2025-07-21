import http from "./httpClient";

const loginUrl = "/api/login";
// src/hooks/useLogin.ts

interface LoginBody {
  username: string;
  password: string;
}
export interface userInfoIF {
  id: string;
  roles: string;
  username: string;
  telephone: string;
  firstName: string;
  lastName: string;
  email: string;
  document: string;
  centerId: string;
  ambulanceId: string;
  lastSeen: string;
  password: string; // Consider removing this in production
}

export interface LoginResponse {
  token: string;
  user: userInfoIF;
  Error?: string;
}

export const loginApi = async (username: string, password: string) => {
  const body: LoginBody = { username, password };
  return await http.post<LoginBody, LoginResponse>(loginUrl, body);
};
