// components/EmergencyInfo.tsx
import Feather from "@expo/vector-icons/Feather";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { getTimeDifferenceHHmm } from "../hook/date";
import {
  getLabelByValue,
  getPriorityColor,
  prioridadEN,
} from "./config-emergency";

export default function EmergencyInfoPills({
  fechaLlamada,
  prioridad,
  timeServerNow,
}: {
  fechaLlamada: string;
  prioridad: prioridadEN;
  timeServerNow?: Date; // Optional, used for testing
}) {
  const priorityLabel = getLabelByValue("EMERGENCY_PRIORITY_TYPES", prioridad);
  const { borderColor, backgroundColor, textColor } =
    getPriorityColor(prioridad);

  const [timeDiff, setTimeDiff] = React.useState(() =>
    getTimeDifferenceHHmm(fechaLlamada, new Date(timeServerNow ?? new Date()))
  );

  React.useEffect(() => {
    const start = performance.now();
    const serverBase = new Date(timeServerNow ?? new Date());

    const interval = setInterval(() => {
      const elapsed = performance.now() - start;
      const updatedServerNow = new Date(serverBase.getTime() + elapsed);

      const diff = getTimeDifferenceHHmm(fechaLlamada, updatedServerNow);
      setTimeDiff(diff);
    }, 10000); // cada segundo; podés usar 60000 si solo querés minuto a minuto

    return () => clearInterval(interval);
  }, [fechaLlamada, timeServerNow]);

  return (
    <View style={styles.bubbles}>
      <View style={[styles.pill, styles.timePill]}>
        <Feather name="clock" size={16} color="#1976d2" style={styles.icon} />
        <Text style={styles.timeText}>{timeDiff}</Text>
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
