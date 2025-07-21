// navigation/AppTabs.tsx
import { FontAwesome } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { Image } from "react-native";
import { useChatWebSocket } from "../config/chatWebsocket";
import ChatScreen from "../screens/ChatScreen";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

export default function AppTabs() {
  const { totalUnreadCount } = useChatWebSocket();
  return (
    <Tab.Navigator
      screenOptions={{
        headerTitle: () => (
          <Image
            source={require("../../../assets/icons/icon_1024.png")}
            style={{
              width: 120,
              height: 120,
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
          tabBarActiveTintColor: "red",
        }}
        name="Emergencias"
        component={HomeScreen}
      />
      <Tab.Screen
        name="Comunicacion"
        options={{
          title: "Comunicación",
          tabBarIcon: ({ color }) => (
            <FontAwesome size={28} name="wechat" color={color} />
          ),
          tabBarActiveTintColor: "green",
          tabBarBadge: totalUnreadCount > 0 ? totalUnreadCount : undefined,
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
          tabBarActiveTintColor: "blue",
        }}
        component={ProfileScreen}
      />
    </Tab.Navigator>
  );
}
