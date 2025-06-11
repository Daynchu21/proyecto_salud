import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { formatTime } from "../hook/date";

export default function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Ionicons name="time" size={20} color="black" style={styles.icon} />
      <Text style={styles.label}>
        <Text style={styles.labelText}>Hora actual: </Text>
        {formatTime(time)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    width: "100%",
    elevation: 3, // sombra Android
    shadowColor: "#000", // sombra iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  icon: {
    marginRight: 8,
  },
  label: {
    fontSize: 18,
    color: "#000",
    fontWeight: "bold",
  },
  labelText: {
    fontWeight: "bold",
  },
});
