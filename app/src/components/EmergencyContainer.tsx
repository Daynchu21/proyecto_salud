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
import { formatLocalArgentineString } from "../hook/date";
import { ErrorManager } from "../utils/errorHandler";
import { EstadoEmergencia } from "../utils/global";
import { getPriorityColor } from "./config-emergency";
import EmergencyInfoPills from "./EmergencyInfoPills";
import EmergencyMap, { Emergency } from "./EmergencyMap";

export default function EmergencyContainer({
  emergencyInfo,
  ambulanciaId,
  loadingButton,
  setShowAcceptConfirm,
  setShowNextStateConfirm,
  timeServerNow, // Default to current date if not provided
}: {
  emergencyInfo: EmergencyIF;
  ambulanciaId: string;
  loadingButton: boolean;
  setShowAcceptConfirm: (key: boolean) => void;
  setShowNextStateConfirm: (key: boolean) => void;
  timeServerNow?: Date; // Optional, used for testing
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
      case EstadoEmergencia.PENDIENTE:
        return (
          <TouchableOpacity
            style={styles.button}
            onPress={() => setShowAcceptConfirm(true)}
          >
            <Text style={styles.buttonText}>Iniciar atención</Text>
          </TouchableOpacity>
        );
      case EstadoEmergencia.EN_CAMINO:
        return (
          <TouchableOpacity
            style={styles.buttonOnWay}
            onPress={() => setShowNextStateConfirm(true)}
          >
            <Text style={styles.buttonText}>cambiar a "unidad en sitio"</Text>
          </TouchableOpacity>
        );
      case EstadoEmergencia.EN_SITIO:
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

      case EstadoEmergencia.EN_TRASLADO:
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

    // Asegurarse de que la URL de Google Maps sea correcta para Android
    const url =
      Platform.OS === "ios"
        ? `http://maps.apple.com/?q=${query}`
        : `https://www.google.com/maps/search/?api=1&query=${query}`; // Corregido para Android

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
      <EmergencyInfoPills
        fechaLlamada={fechaLlamada}
        prioridad={prioridad}
        timeServerNow={timeServerNow}
      />

      <View>
        <Text style={[styles.dateText, { color: textColor }]}>
          {`${codigo} ${formatLocalArgentineString(fechaLlamada)}`}
        </Text>
      </View>

      {/* Fila: Emergencia */}
      <View style={styles.infoRow}>
        <View style={styles.labelWrapper}>
          <MaterialCommunityIcons
            name="ambulance"
            size={16}
            style={styles.icon}
          />
          <Text style={styles.labelText}>Emergencia:</Text>
        </View>
        <Text style={styles.valueText}>{tipoEmergencia}</Text>
      </View>

      {/* Fila: Paciente */}
      <View style={styles.infoRow}>
        <View style={styles.labelWrapper}>
          <FontAwesome5 name="user" size={16} style={styles.icon} />
          <Text style={styles.labelText}>Paciente:</Text>
        </View>
        <Text style={styles.valueText}>{pacienteNombre}</Text>
      </View>

      {/* Fila: Domicilio */}
      <View style={styles.infoRow}>
        <View style={styles.labelWrapper}>
          <Entypo name="location-pin" size={16} style={styles.icon} />
          <Text style={styles.labelText}>Domicilio:</Text>
        </View>
        <TouchableOpacity
          onPress={() => openInMaps(domicilio)}
          style={styles.valueTextContainer} // Nuevo contenedor para el TouchableOpacity
          activeOpacity={0.7}
        >
          <Text style={styles.linkValueText}>{domicilio}</Text>
        </TouchableOpacity>
      </View>

      {/* Fila: Hospital */}
      <View style={styles.infoRow}>
        <View style={styles.labelWrapper}>
          <MaterialCommunityIcons
            name="hospital-building"
            size={16}
            style={styles.icon}
          />
          <Text style={styles.labelText}>Hospital:</Text>
        </View>
        <Text style={styles.valueText}>{hospitalName}</Text>
      </View>

      {(estado === "EN_CAMINO" || estado === "EN_TRASLADO") && (
        <EmergencyMap
          emergency={emergencyInfo as Emergency}
          ambulanceId={ambulanciaId}
        />
      )}
      <View style={styles.buttonContainer}>{renderNextActionButton()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    gap: 8,
  },
  buttonContainer: {
    marginTop: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  labelWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: 125,
    flexShrink: 0,
    marginRight: 8,
  },
  labelText: {
    fontSize: 16,
    color: "#333",
  },
  valueTextContainer: {
    flex: 1,
  },
  valueText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    flexWrap: "wrap",
  },
  linkValueText: {
    fontSize: 14,
    color: "#007BFF", // Link color
    textDecorationLine: "underline",
    flexWrap: "wrap", // **Crucial for wrapping text within the Text component**
    flexShrink: 1, // **Allows the Text component to shrink and wrap if needed**
  },
  icon: {
    marginRight: 6,
    color: "#007AFF",
  },
  codeText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  dateText: {
    fontSize: 16,
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
  },
});
