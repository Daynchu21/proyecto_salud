// components/AppWrapper.js
import React from "react";
import { Platform, SafeAreaView, StatusBar, StyleSheet } from "react-native";

export default function AppWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
});
