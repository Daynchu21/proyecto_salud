// screens/HomeScreen.tsx
import React from "react";
import { Button, Text, View } from "react-native";
import { useAuth } from "../context/authContext";

export default function HomeScreen() {
  const { logout } = useAuth();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Bienvenido a la app</Text>
      <Button title="Cerrar sesión" onPress={logout} />
    </View>
  );
}
