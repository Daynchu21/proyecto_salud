import React from "react";
import { Text, View } from "react-native";

const AppBlockedScreen = () => (
  <View
    style={{
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    }}
  >
    <Text style={{ fontSize: 20, textAlign: "center", marginBottom: 10 }}>
      🚫 Aplicación bloqueada
    </Text>
    <Text style={{ textAlign: "center" }}>
      Esta aplicación ha sido desactivada por falta de pago. Contacta a soporte
      para más información.
    </Text>
  </View>
);

export default AppBlockedScreen;
