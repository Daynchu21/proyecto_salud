// navigation/index.tsx
import { NavigationContainer } from "@react-navigation/native";
import React from "react";
import { useAuth } from "../context/authContext";
import AppTabs from "./AppTabs";
import AuthStack from "./AuthStack";

export default function Navigation() {
  const { isLoggedIn } = useAuth();

  return (
    <NavigationContainer>
      {isLoggedIn ? <AppTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
