// navigation/AppTabs.tsx
import { FontAwesome } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { Image } from "react-native";
import ChatScreen from "../screens/ChatScreen";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerTitle: () => (
          <Image
            source={require("../assets/ecco-logo.png")}
            style={{
              width: 120,
              height: 40,
              resizeMode: "contain",
              display: "flex",
            }}
          />
        ),
        headerTitleAlign: "left",
      }}
    >
      <Tab.Screen
        options={{
          title: "Emergencias",
          tabBarIcon: ({ color }) => (
            <Feather name="alert-triangle" size={24} color={color} />
          ),
        }}
        name="Emergencias"
        component={HomeScreen}
      />
      <Tab.Screen
        name="Comunicación"
        options={{
          title: "Comunicación",
          tabBarIcon: ({ color }) => (
            <FontAwesome size={28} name="wechat" color={color} />
          ),
        }}
        component={ChatScreen}
      />
      <Tab.Screen
        name="Profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <FontAwesome name="user" size={24} color={color} />
          ),
        }}
        component={ProfileScreen}
      />
    </Tab.Navigator>
  );
}
