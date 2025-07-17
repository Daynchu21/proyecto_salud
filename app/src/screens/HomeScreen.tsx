import { FontAwesome } from "@expo/vector-icons";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import React, { useEffect } from "react";
import {
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SendEvents } from "../api/log_events";
import { setTokenMobile } from "../api/token";
import {
  getLabelByValue,
  getNextEmergencyState,
} from "../components/config-emergency";
import EmergencyContainer from "../components/EmergencyContainer";
import LiveClock from "../components/LiveClock";
import { useServerTime } from "../context/ServerTimeContext";
import { registerForPushNotificationsAsync } from "../hook/getToken";
import { useEmergencyHandler } from "../hook/useEmergencyHandler";
import { useGetLocation } from "../hook/useGetLocation";
import { useLoadUserInfo } from "../hook/userInfo";
import { configEvent, EstadoEmergencia } from "../utils/global";

export default function HomeScreen() {
  const { userInfo } = useLoadUserInfo();
  const route = useRoute();
  const refreshTrigger = (route.params as { refresh?: boolean })?.refresh;
  const [loadingButton, setLoadingButton] = React.useState(false);
  const navigation = useNavigation();
  const { getLocation } = useGetLocation();
  const { serverTime, updateServerTime } = useServerTime();

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
    isLoadingEmergency,
  } = useEmergencyHandler(userInfo, setLoadingButton);

  useFocusEffect(
    React.useCallback(() => {
      if (refreshTrigger) {
        (navigation as any).setParams({ refresh: false });
      }
      onRefresh();
      updateServerTime();
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
              sendEventsBE(emergencyInfo.estado);
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
    if (showNextStateConfirm && emergencyInfo?.estado) {
      const textTitle =
        emergencyInfo?.estado !== EstadoEmergencia.EN_TRASLADO
          ? "Confirmar cambio"
          : "Confirmar finalizada";

      const nexState = getNextEmergencyState(emergencyInfo?.estado);
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
              sendEventsBE(emergencyInfo.estado);
              handleNextState(
                emergencyInfo?.id ?? "0",
                userInfo?.ambulanceId ?? "0",
                emergencyInfo?.estado ?? EstadoEmergencia.PENDIENTE
              );
            },
          },
        ]
      );
    }
  }, [showNextStateConfirm]);

  const sendEventsBE = async (status: EstadoEmergencia) => {
    const locationAddress = await getLocation();
    const nexState = getNextEmergencyState(status);
    if (nexState !== null) {
      SendEvents(configEvent[nexState as EstadoEmergencia], {
        Ciudad: !locationAddress ? "no habilitado" : locationAddress.city,
        direccion: !locationAddress
          ? "no habilitado"
          : locationAddress.formattedAddress,
        isMobile: true,
      });
    }
  };

  if (isLoadingEmergency) {
    return (
      <View style={styles.centeredContainer}>
        <Image
          source={require("../../../assets/loading_GIF.gif")}
          style={styles.gif}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.container}>
        <LiveClock serverTime={serverTime ?? new Date()} />
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
              timeServerNow={serverTime ?? new Date()}
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
  gif: {
    width: 150,
    height: 150,
  },
});
