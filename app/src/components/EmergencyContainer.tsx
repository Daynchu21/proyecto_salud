import {
  Entypo,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { EmergencyIF } from "../api/ambulancia_info";
import { formatDateTime } from "../hook/date";
import { ErrorManager } from "../utils/errorHandler";
import { getPriorityColor } from "./config-emergency";
import EmergencyInfoPills from "./EmergencyInfoPills";
import EmergencyMap, { Emergency } from "./EmergencyMap";

export default function EmergencyContainer({
  emergencyInfo,
  ambulanciaId,
  loadingButton,
  setShowAcceptConfirm,
  setShowNextStateConfirm,
}: {
  emergencyInfo: EmergencyIF;
  ambulanciaId: string;
  loadingButton: boolean;
  setShowAcceptConfirm: (key: boolean) => void;
  setShowNextStateConfirm: (key: boolean) => void;
}) {
  const {
    prioridad,
    estado,
    fechaLlamada,
    tipoEmergencia,
    pacienteNombre,
    domicilio,
    hospitalName,
    codigo,
  } = emergencyInfo;
  const { borderColor, textColor } = getPriorityColor(prioridad);

  const renderNextActionButton = () => {
    if (loadingButton)
      return (
        <TouchableOpacity style={styles.buttonOnWay} disabled>
          <ActivityIndicator size="small" color="white" />
        </TouchableOpacity>
      );
    switch (estado) {
      case "PENDIENTE":
        return (
          <TouchableOpacity
            style={styles.button}
            onPress={() => setShowAcceptConfirm(true)}
          >
            <Text style={styles.buttonText}>Iniciar atención</Text>
          </TouchableOpacity>
        );
      case "EN_CAMINO":
        return (
          <TouchableOpacity
            style={styles.buttonOnWay}
            onPress={() => setShowNextStateConfirm(true)}
          >
            <Text style={styles.buttonText}>cambiar a "unidad en sitio"</Text>
          </TouchableOpacity>
        );

      case "EN_DOMICILIO":
        return (
          <TouchableOpacity
            style={styles.button}
            onPress={() => setShowNextStateConfirm(true)}
          >
            <Text style={styles.buttonText}>Comenzar traslado</Text>
          </TouchableOpacity>
        );
      case "EN_SITIO":
        return (
          <TouchableOpacity
            style={styles.buttonOnWay}
            onPress={() => setShowNextStateConfirm(true)}
          >
            <Text style={styles.buttonText}>
              Cambiar a "Unidad en traslado"
            </Text>
          </TouchableOpacity>
        );

      case "EN_TRASLADO":
        return (
          <TouchableOpacity
            style={styles.buttonOnWay}
            onPress={() => setShowNextStateConfirm(true)}
          >
            <Text style={styles.buttonText}>
              cambiar a "Emergencia Finalizada"
            </Text>
          </TouchableOpacity>
        );

      default:
        return null;
    }
  };

  const openInMaps = (address: string) => {
    const query = encodeURIComponent(address);

    const url =
      Platform.OS === "ios"
        ? `http://maps.apple.com/?q=${query}`
        : `https://www.google.com/maps/search/?api=1&query=${query}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          ErrorManager.showError(
            "No se puede abrir el mapa en este dispositivo."
          );
        }
      })
      .catch((err) => console.error("Error al abrir el mapa:", err));
  };

  return (
    <View style={[styles.container, { borderLeftColor: borderColor }]}>
      <EmergencyInfoPills fechaLlamada={fechaLlamada} prioridad={prioridad} />

      <View>
        <Text style={[styles.codeText, { color: textColor }]}>
          {codigo}{" "}
          <Text style={styles.dateText}>{formatDateTime(fechaLlamada)}</Text>
        </Text>
      </View>

      <View style={styles.gridRow}>
        <View style={styles.gridItem1}>
          <MaterialCommunityIcons
            name="ambulance"
            size={16}
            style={styles.icon}
          />
          <Text style={styles.label}>Emergencia:</Text>
        </View>
        <Text style={styles.gridItem2}>{tipoEmergencia}</Text>
      </View>

      <View style={styles.gridRow}>
        <View style={styles.gridItem1}>
          <FontAwesome5 name="user" size={16} style={styles.icon} />
          <Text style={styles.label}>Paciente:</Text>
        </View>
        <Text style={styles.gridItem2}>{pacienteNombre}</Text>
      </View>

      <View style={styles.gridRow}>
        <View style={styles.gridItem1}>
          <Entypo name="location-pin" size={16} style={styles.icon} />
          <Text style={styles.label}>Domicilio:</Text>
        </View>
        <TouchableOpacity
          onPress={() => openInMaps(domicilio)}
          style={[styles.gridItem2]}
          activeOpacity={0.7}
        >
          <Text style={{ color: "blue" }}>{domicilio}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.gridRow}>
        <View style={styles.gridItem1}>
          <MaterialCommunityIcons
            name="hospital-building"
            size={16}
            style={styles.icon}
          />
          <Text style={styles.label}>Hospital:</Text>
        </View>
        <Text style={styles.gridItem2}>{hospitalName}</Text>
      </View>

      {(estado === "EN_CAMINO" || estado === "EN_TRASLADO") && (
        <EmergencyMap
          emergency={emergencyInfo as Emergency}
          ambulanceId={ambulanciaId}
        />
      )}
      <View style={{ marginTop: 12 }}>{renderNextActionButton()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  gridRow: {
    flexDirection: "row",
    alignItems: "flex-start", // o center si querés verticalmente centrado
    marginBottom: 10,
  },

  gridItem1: {
    flexShrink: 0, // 🔒 evita que esta parte crezca
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    minWidth: 135,
    maxWidth: 135, // opcional: limitar ancho máximo
  },

  gridItem2: {
    flex: 1, // 🔓 ocupa todo el espacio restante
    padding: 6,
  },
  gridItem2Wrapper: {
    flex: 1,
    flexShrink: 1,
    overflow: "hidden",
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    paddingLeft: 16,
    borderLeftWidth: 4,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    gap: 6,
  },
  buttonOnWay: {
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    elevation: 3,
    marginBottom: 8,
  },
  button: {
    backgroundColor: "#22c55e",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    elevation: 3,
    marginBottom: 8,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  icon: {
    marginRight: 4,
    color: "#007AFF",
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flexShrink: 1,
  },
  codeText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  dateText: {
    fontSize: 10,
    fontWeight: "600",
  },
});
