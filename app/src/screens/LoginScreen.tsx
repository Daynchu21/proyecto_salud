import React from "react";
import { Button, Text, View } from "react-native";
import { useAuth } from "../context/authContext";

export default function LoginScreen() {
  const { login } = useAuth();

  return (
    <View>
      <Text>Login</Text>
      <Button title="Login" onPress={login} />
    </View>
  );
}
