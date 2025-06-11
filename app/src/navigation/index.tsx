// navigation/index.tsx
import { NavigationContainer } from "@react-navigation/native";
import React from "react";
import { useAuth } from "../context/authContext";
import { ErrorProvider } from "../context/errorContext";
import NotificationHandler from "../hook/handlerNotification";
import AppTabs from "./AppTabs";
import AuthStack from "./AuthStack";

export default function Navigation() {
  const { isLoggedIn } = useAuth();

  return (
    <ErrorProvider>
      <NavigationContainer>
        <NotificationHandler />
        {isLoggedIn ? <AppTabs /> : <AuthStack />}
      </NavigationContainer>
    </ErrorProvider>
  );
}
