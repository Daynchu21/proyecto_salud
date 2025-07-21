// components/ErrorMessage.tsx
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const ErrorMessage = ({ message }: { message: string }) => (
  <View style={styles.container}>
    <Text style={styles.text}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60, // antes era bottom: 60
    left: 20,
    right: 20,
    backgroundColor: "#fee2e2",
    borderColor: "#f87171",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    zIndex: 9999,
    elevation: 10, // Android
  },
  text: {
    color: "#b91c1c",
    textAlign: "center",
    fontWeight: "600",
  },
});

export default ErrorMessage;
