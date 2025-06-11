// src/api/httpClient.ts
import { triggerLogout } from "../utils/authHandler";
import { ErrorManager } from "../utils/errorHandler";

const BASE_URL = process.env.EXPO_PUBLIC_LOCAL_API_IP;

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface RequestOptions<T> {
  method: HttpMethod;
  endpoint: string;
  body?: T;
  params?: Record<string, string | number>;
  token?: string;
}

const buildUrl = (
  endpoint: string,
  params?: Record<string, string | number>
): string => {
  const query = params
    ? "?" + new URLSearchParams(params as Record<string, string>).toString()
    : "";
  return `${BASE_URL}${endpoint}${query}`;
};

const defaultHeaders = {
  "Content-Type": "application/json",
};

const handleResponse = async <R>(response: Response): Promise<R> => {
  try {
    const contentType = response.headers.get("Content-Type") || "";
    let data: R | null = null;

    if (contentType.includes("application/json")) {
      data = await response.json();
    }

    if (!response.ok) {
      if (response.status === 403) {
        console.warn(
          "🔒 Sesión expirada o acceso denegado. Cerrando sesión..."
        );
        await triggerLogout(); // esta función debería limpiar la sesión y redirigir al login
      }

      const errorMessage = (data as any)?.message || "Error en la petición";
      throw new Error(errorMessage);
    }

    return data!;
  } catch (error: any) {
    console.error("❌ Error al procesar la respuesta:", error);
    ErrorManager.showError(error.message || error.Error || "Error desconocido");
    return Promise.reject(error);
  }
};

const request = async <T = any, R = any>({
  method,
  endpoint,
  body,
  params,
  token,
}: RequestOptions<T>): Promise<R> => {
  const url = buildUrl(endpoint, params);
  const headers: HeadersInit = {
    ...defaultHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const config: RequestInit = {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  try {
    const response = await fetch(url, config);
    return await handleResponse<R>(response);
  } catch (error: any) {
    console.error("❌ Error en la petición HTTP:", error);
    return error;
  }
};

// Métodos de uso directo
const get = <R = any>(
  endpoint: string,
  params?: Record<string, string | number>,
  token?: string
) => request<undefined, R>({ method: "GET", endpoint, params, token });

const post = <T = any, R = any>(endpoint: string, body: T, token?: string) =>
  request<T, R>({ method: "POST", endpoint, body, token });

const put = <T = any, R = any>(endpoint: string, body: T, token?: string) =>
  request<T, R>({ method: "PUT", endpoint, body, token });

const del = <R = any>(endpoint: string, token?: string) =>
  request<undefined, R>({ method: "DELETE", endpoint, token });

export default {
  get,
  post,
  put,
  delete: del,
};
