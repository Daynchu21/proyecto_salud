// screens/ChatScreen.tsx
import React from "react";
import { Button, Text, View } from "react-native";
import { useAuth } from "../context/authContext";

export default function ChatScreen() {
  const { logout } = useAuth();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Perfil del Usuario</Text>
      <Button title="Cerrar sesión" onPress={logout} />
    </View>
  );
}
