// context/AuthContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Alert } from "react-native";
import { loginApi } from "../api/users";
import { setLogout } from "../utils/authHandler";

type AuthContextType = {
  isLoggedIn: boolean;
  login: (usuario: string, contrasena: string) => void;
  userInfo: any | null;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<any | null>(null);

  useEffect(() => {
    // Leer login desde almacenamiento al iniciar la app
    const checkLoginStatus = async () => {
      const stored = await AsyncStorage.getItem("loggedIn");
      const userStr = await AsyncStorage.getItem("user");
      if (stored === "true" && userStr) {
        setIsLoggedIn(true);
        setUserInfo(JSON.parse(userStr));
      }
    };
    checkLoginStatus();
  }, []);

  const login = async (usuario: string, contrasena: string) => {
    try {
      const resp = await loginApi(usuario, contrasena);
      if (resp.Error) {
        Alert.alert(resp.Error);
      }
      if (resp) {
        const { token, user } = resp;
        await AsyncStorage.setItem("loggedIn", "true");
        await AsyncStorage.setItem("token", token);
        await AsyncStorage.setItem("user", JSON.stringify(user));
        setIsLoggedIn(true);
        setUserInfo(user);
      }
    } catch (error) {
      throw new Error("Credenciales inválidas");
    }
  };

  const logout = async () => {
    setIsLoggedIn(false);
    setUserInfo(null); // <-- limpiar
    await AsyncStorage.removeItem("loggedIn");
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
  };

  useEffect(() => {
    setLogout(logout);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout, userInfo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
};
