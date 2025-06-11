import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { userInfoIF } from "../api/users";

export const useLoadUserInfo = () => {
  const [userInfo, setUserInfo] = useState<userInfoIF | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const raw = await AsyncStorage.getItem("user");
        if (raw) {
          const parsed: userInfoIF = JSON.parse(raw);
          setUserInfo(parsed);
        }
      } catch (error) {
        console.error("Error al cargar el usuario:", error);
      }
    };

    fetchUser();
  }, []);

  return { userInfo };
};
