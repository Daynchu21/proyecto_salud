import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { formatTime } from "../hook/date";

interface ServerTimeComponentProps {
  serverTime?: Date; // Puede ser undefined hasta que cargue
}

export const LiveClock: React.FC<ServerTimeComponentProps> = ({
  serverTime,
}) => {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    if (!serverTime) return;

    const start = performance.now();
    const serverDate = new Date(serverTime); // convertir el string a Date
    setCurrentTime(serverDate);

    const interval = setInterval(() => {
      const elapsed = performance.now() - start;
      const updatedTime = new Date(serverDate.getTime() + elapsed); // ✅ suma milisegundos
      setCurrentTime(updatedTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [serverTime]);

  if (!serverTime || !currentTime || currentTime === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator
          size="small"
          color="#000"
          style={{ width: "100%" }}
        />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <Ionicons name="time" size={20} color="black" style={styles.icon} />
      <Text style={styles.label}>
        <Text style={styles.labelText}>Hora actual: </Text>
        {formatTime(currentTime)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    width: "100%",
    elevation: 3,
    shadowColor: "#000",
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
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#555",
  },
});

export default LiveClock;
