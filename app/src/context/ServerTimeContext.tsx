// context/ServerTimeContext.tsx
import React, { createContext, useContext, useState } from "react";
import { getTimeServer } from "../api/getTime";

interface ServerTimeContextValue {
  serverTime: Date | null;
  updateServerTime: () => Promise<void>;
}

const ServerTimeContext = createContext<ServerTimeContextValue | undefined>(
  undefined
);

export const ServerTimeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [serverTime, setServerTime] = useState<Date | null>(null);

  const updateServerTime = async () => {
    try {
      const resp = await getTimeServer();
      if (resp) {
        setServerTime(resp.serverTime);
      }
    } catch (error) {
      console.error("Error fetching server time", error);
    }
  };

  return (
    <ServerTimeContext.Provider value={{ serverTime, updateServerTime }}>
      {children}
    </ServerTimeContext.Provider>
  );
};

export const useServerTime = () => {
  const context = useContext(ServerTimeContext);
  if (!context)
    throw new Error("useServerTime must be used within ServerTimeProvider");
  return context;
};
