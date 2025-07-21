import { FontAwesome } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/authContext";

export default function LoginScreen() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleLogin = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await login(usuario, contrasena);
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <View style={styles.card}>
          <Image
            source={require("../../../assets/icons/icon_1024.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.label}>
            Usuario <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputContainer}>
            <FontAwesome
              name="user"
              size={20}
              color="#999"
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="Usuario"
              value={usuario.trim()}
              onChangeText={setUsuario}
              placeholderTextColor="#d8d7d7"
            />
          </View>

          <Text style={styles.label}>
            Contraseña <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputContainer}>
            <FontAwesome
              name="lock"
              size={20}
              color="#999"
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              secureTextEntry={secure}
              value={contrasena.trim()}
              onChangeText={setContrasena}
              placeholderTextColor="#d8d7d7"
            />
            <TouchableOpacity
              onPressIn={() => setSecure(false)}
              onPressOut={() => setSecure(true)}
              style={styles.eyeButton}
            >
              <FontAwesome
                name={secure ? "eye-slash" : "eye"}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading} // Desactiva el botón mientras carga
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.buttonContent}>
                <FontAwesome
                  name="sign-in"
                  size={18}
                  color="#fff"
                  style={styles.buttonIcon}
                />
                <Text style={styles.buttonText}>Iniciar sesión</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f3f5",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 25,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  logo: {
    width: "100%",
    height: 180,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
  },
  required: {
    color: "red",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: "#fafafa",
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 45,
    color: "black",
  },

  eyeButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});
