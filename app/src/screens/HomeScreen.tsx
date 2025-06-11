import { FontAwesome } from "@expo/vector-icons";
import React, { useEffect } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { setTokenMobile } from "../api/token";
import EmergencyHeader from "../components/EmergencyHeader";
import EmergencyMap, { Emergency } from "../components/EmergencyMap";
import LiveClock from "../components/LiveClock";
import { formatDateTime } from "../hook/date";
import { registerForPushNotificationsAsync } from "../hook/getToken";
import { useEmergencyHandler } from "../hook/useEmergencyHandler";
import { useLoadUserInfo } from "../hook/userInfo";

export default function HomeScreen() {
  const { userInfo } = useLoadUserInfo();

  const {
    emergencyInfo,
    fetchData,
    handleNextState,
    showAcceptConfirm,
    setShowAcceptConfirm,
    showNextStateConfirm,
    setShowNextStateConfirm,
    refreshing,
    setRefreshing,
  } = useEmergencyHandler(userInfo);

  useEffect(() => {
    fetchData();
    registerForPushNotificationsAsync().then((token) => {
      if (token && userInfo?.ambulanceId) {
        setTokenMobile(userInfo.ambulanceId, token);
      }
    });
  }, [userInfo]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    if (showAcceptConfirm && emergencyInfo) {
      Alert.alert(
        "Confirmar Asignación",
        "¿Estás seguro que deseas aceptar esta asignación?",
        [
          { text: "Cancelar", onPress: () => setShowAcceptConfirm(false) },
          {
            text: "Aceptar",
            onPress: () => {
              setShowAcceptConfirm(false);
              handleNextState(
                emergencyInfo.id,
                userInfo?.ambulanceId ?? "0",
                emergencyInfo.estado
              );
            },
          },
        ]
      );
    }
  }, [showAcceptConfirm, emergencyInfo]);

  useEffect(() => {
    if (showNextStateConfirm) {
      Alert.alert(
        "Confirmar cambio",
        "¿Estás seguro que deseas avanzar al siguiente estado?",
        [
          { text: "Cancelar", onPress: () => setShowNextStateConfirm(false) },
          {
            text: "Aceptar",
            onPress: () => {
              setShowNextStateConfirm(false);
              handleNextState(
                emergencyInfo?.id ?? "0",
                userInfo?.ambulanceId ?? "0",
                emergencyInfo?.estado ?? "PENDIENTE"
              );
            },
          },
        ]
      );
    }
  }, [showNextStateConfirm]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={{ flex: 1, paddingBottom: 20, gap: 12 }}>
        <LiveClock />
        <View style={styles.containerMovil}>
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>
            {emergencyInfo?.movilidadName ?? "Desconocido"}
          </Text>
        </View>

        {emergencyInfo ? (
          <>
            <EmergencyHeader
              id={emergencyInfo.codigo ?? "000"}
              fechaLlamada={
                formatDateTime(emergencyInfo.fechaLlamada) ?? "Desconocida"
              }
              tipo={emergencyInfo.tipoEmergencia ?? "Desconocido"}
              paciente={emergencyInfo.pacienteNombre ?? "Desconocido"}
              domicilio={emergencyInfo.domicilio ?? "Desconocido"}
              hospital={emergencyInfo.hospitalName ?? "Desconocido"}
            />

            {(emergencyInfo.estado === "EN_CAMINO" ||
              emergencyInfo.estado === "EN_TRASLADO") && (
              <EmergencyMap
                emergency={emergencyInfo as Emergency}
                ambulanceId={userInfo?.ambulanceId ?? "0"}
              />
            )}

            <View style={{ marginTop: 12 }}>
              {emergencyInfo.estado === "PENDIENTE" ? (
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => setShowAcceptConfirm(true)}
                >
                  <Text style={styles.buttonText}>Iniciar atención</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => setShowNextStateConfirm(true)}
                  >
                    <Text style={styles.buttonText}>Avanzar estado</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.button} onPress={() => {}}>
                    <Text style={styles.buttonText}>
                      Cambiar a "Emergencia finalizada"
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </>
        ) : (
          <View style={styles.centeredContainer}>
            <FontAwesome
              name="check-circle"
              size={64}
              color="#4CAF50"
              style={{ marginBottom: 12 }}
            />
            <Text style={styles.centeredText}>
              No tienes ninguna emergencia asignada.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: "#f8f9fb",
    height: "100%",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  centeredText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  containerMovil: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  button: {
    backgroundColor: "#007AFF",
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
});
