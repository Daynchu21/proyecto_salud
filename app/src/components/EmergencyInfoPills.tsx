// components/EmergencyInfo.tsx
import Feather from "@expo/vector-icons/Feather";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import TimeElapsed from "./TimeElapsed";
import {
  getLabelByValue,
  getPriorityColor,
  prioridadEN,
} from "./config-emergency";

export default function EmergencyInfoPills({
  fechaLlamada,
  prioridad,
}: {
  fechaLlamada: string;
  prioridad: prioridadEN;
}) {
  const priorityLabel = getLabelByValue("EMERGENCY_PRIORITY_TYPES", prioridad);
  const { borderColor, backgroundColor, textColor } =
    getPriorityColor(prioridad);

  return (
    <View style={styles.bubbles}>
      <View style={[styles.pill, styles.timePill]}>
        <Feather name="clock" size={16} color="#1976d2" style={styles.icon} />
        <Text style={styles.timeText}>
          <TimeElapsed fromDateTime={fechaLlamada} />
        </Text>
      </View>

      <View style={[styles.pill, { backgroundColor, borderColor }]}>
        <Text style={[styles.priorityText, { color: textColor }]}>
          {priorityLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubbles: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  icon: {
    marginRight: 4,
  },
  timePill: {
    backgroundColor: "rgb(203, 222, 255)",
    borderColor: "#1f87cb",
  },
  timeText: {
    fontWeight: "bold",
    color: "#1f87cb",
  },
  priorityText: {
    fontWeight: "bold",
    fontSize: 14,
  },
});
