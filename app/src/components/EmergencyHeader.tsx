import {
  Entypo,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function InfoCard({
  id,
  fechaLlamada,
  tipo,
  paciente,
  domicilio,
  hospital,
}: {
  id: string;
  fechaLlamada: string;
  tipo: string;
  paciente: string;
  domicilio: string;
  hospital: string;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.iconLabel}>
          <FontAwesome5 name="hashtag" size={16} style={styles.icon} />
          <Text style={styles.label}>Identificador:</Text>
        </View>
        <Text style={styles.value}>{id}</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.iconLabel}>
          <Ionicons name="time" size={16} style={styles.icon} />
          <Text style={styles.label}>Fecha Llamada:</Text>
        </View>
        <Text style={styles.value}>{fechaLlamada}</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.iconLabel}>
          <MaterialCommunityIcons
            name="ambulance"
            size={16}
            style={styles.icon}
          />
          <Text style={styles.label}>Emergencia:</Text>
        </View>
        <Text style={styles.value}>{tipo}</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.iconLabel}>
          <FontAwesome5 name="user" size={16} style={styles.icon} />
          <Text style={styles.label}>Paciente:</Text>
        </View>
        <Text style={styles.value}>{paciente}</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.iconLabel}>
          <Entypo name="location-pin" size={16} style={styles.icon} />
          <Text style={styles.label}>Domicilio:</Text>
        </View>
        <Text style={styles.value}>{domicilio}</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.iconLabel}>
          <MaterialCommunityIcons
            name="hospital-building"
            size={16}
            style={styles.icon}
          />
          <Text style={styles.label}>Hospital:</Text>
        </View>
        <Text style={styles.value}>{hospital}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    paddingLeft: 16, // para separar contenido del borde rojo
    borderLeftWidth: 4,
    borderLeftColor: "#e55300", // rojo o naranja fuerte
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    flexWrap: "wrap",
  },
  iconLabel: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    maxWidth: "60%",
  },
  icon: {
    marginRight: 4,
    color: "#007AFF",
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    flexShrink: 1,
  },
  value: {
    fontSize: 14,
    color: "#444",
    textAlign: "right",
    flexShrink: 1,
    maxWidth: "40%",
  },
});
