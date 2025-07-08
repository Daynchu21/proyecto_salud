import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/authContext";
import { useLoadUserInfo } from "../hook/userInfo";

export default function ProfileScreen() {
  const { logout } = useAuth();
  const { userInfo } = useLoadUserInfo();
  const [loadingLogout, setLoadingLogout] = React.useState(false);

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Seguro que querés cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sí",
        onPress: async () => {
          setLoadingLogout(true);
          await logout();
          setLoadingLogout(false);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mi perfil</Text>

      <View style={styles.item}>
        <MaterialIcons name="person" size={20} style={styles.icon} />
        <Text style={styles.label}>Nombre de usuario:</Text>
        <Text style={styles.value}>{userInfo?.username}</Text>
      </View>

      <View style={styles.item}>
        <MaterialIcons name="badge" size={20} style={styles.icon} />
        <Text style={styles.label}>Nombre:</Text>
        <Text style={styles.value}>{userInfo?.firstName}</Text>
      </View>

      <View style={styles.item}>
        <MaterialIcons name="badge" size={20} style={styles.icon} />
        <Text style={styles.label}>Apellido:</Text>
        <Text style={styles.value}>{userInfo?.lastName}</Text>
      </View>

      <View style={styles.item}>
        <MaterialIcons name="assignment-ind" size={20} style={styles.icon} />
        <Text style={styles.label}>Documento:</Text>
        <Text style={styles.value}>{userInfo?.document}</Text>
      </View>

      <View style={styles.item}>
        <MaterialIcons name="email" size={20} style={styles.icon} />
        <Text style={styles.label}>Correo electrónico:</Text>
        <Text style={styles.value}>{userInfo?.email}</Text>
      </View>

      <View style={styles.item}>
        <MaterialIcons name="groups" size={20} style={styles.icon} />
        <Text style={styles.label}>Rol:</Text>
        <Text style={styles.value}>{userInfo?.roles}</Text>
      </View>

      <View style={styles.item}>
        <MaterialIcons name="phone" size={20} style={styles.icon} />
        <Text style={styles.label}>Teléfono:</Text>
        <Text style={styles.value}>{userInfo?.telephone}</Text>
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, loadingLogout && styles.buttonDisabled]}
        onPress={handleLogout}
        disabled={loadingLogout}
      >
        {loadingLogout ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={styles.buttonContent}>
            <FontAwesome
              name="sign-out"
              size={18}
              color="#fff"
              style={styles.buttonIcon}
            />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f3f3f3",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    backgroundColor: "#0077cc",
    color: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    textAlign: "center",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginBottom: 10,
    padding: 12,
    borderRadius: 8,
    elevation: 1,
  },
  icon: {
    marginRight: 8,
    color: "#333",
  },
  label: {
    fontWeight: "bold",
    flex: 1,
  },
  value: {
    color: "#333",
  },
  logoutButton: {
    marginTop: 30,
    backgroundColor: "#d9534f",
    padding: 14,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutText: {
    color: "#fff",
    marginLeft: 10,
    fontWeight: "bold",
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonIcon: {
    marginRight: 8,
  },
});
