import { FontAwesome } from "@expo/vector-icons";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import React, { useEffect } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { setTokenMobile } from "../api/token";
import {
  getLabelByValue,
  getNextEmergencyState,
} from "../components/config-emergency";
import EmergencyContainer from "../components/EmergencyContainer";
import LiveClock from "../components/LiveClock";
import { registerForPushNotificationsAsync } from "../hook/getToken";
import { useEmergencyHandler } from "../hook/useEmergencyHandler";
import { useLoadUserInfo } from "../hook/userInfo";

export default function HomeScreen() {
  const { userInfo } = useLoadUserInfo();
  const route = useRoute();
  const refreshTrigger = (route.params as { refresh?: boolean })?.refresh;
  const [loadingButton, setLoadingButton] = React.useState(false);
  const navigation = useNavigation();

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
  } = useEmergencyHandler(userInfo, setLoadingButton);

  useFocusEffect(
    React.useCallback(() => {
      if (refreshTrigger) {
        (navigation as any).setParams({ refresh: false });
      }
      onRefresh();
    }, [refreshTrigger])
  );

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
      const textTitle =
        emergencyInfo?.estado !== "EN_TRASLADO"
          ? "Confirmar cambio"
          : "Confirmar finalizada";

      const nexState = getNextEmergencyState(emergencyInfo?.estado ?? "");
      Alert.alert(
        textTitle,
        `¿Estás seguro que deseas actualizar el estado a ${getLabelByValue(
          "EMERGENCY_STATE_BUTTONS",
          nexState ?? ""
        )}?`,
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
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.container}>
        <LiveClock />
        {emergencyInfo?.movilidadName && (
          <View style={styles.containerMovil}>
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>
              {emergencyInfo?.movilidadName}
            </Text>
          </View>
        )}
        {emergencyInfo ? (
          <>
            <EmergencyContainer
              emergencyInfo={emergencyInfo}
              ambulanciaId={userInfo?.ambulanceId ?? ""}
              loadingButton={loadingButton}
              setShowAcceptConfirm={setShowAcceptConfirm}
              setShowNextStateConfirm={setShowNextStateConfirm}
            />
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
  scrollContent: {
    padding: 12,
    backgroundColor: "#f8f9fb",
    flexGrow: 1,
  },
  container: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 12,
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
});
