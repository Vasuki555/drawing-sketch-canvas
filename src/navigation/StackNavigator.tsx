import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";

import HomeScreen from "../screens/HomeScreen";
import CanvasScreen from "../screens/CanvasScreen";
import GalleryScreen from "../screens/GalleryScreen";
import SettingsScreen from "../screens/SettingsScreen";

import AuthNavigator from "./AuthNavigator";
import { useAuth } from "../contexts/AuthContext";

const RootStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();

/* ---------------- MAIN APP STACK ---------------- */
function MainStackNavigator() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="Home" component={HomeScreen} />
      <MainStack.Screen name="Canvas" component={CanvasScreen} />
      <MainStack.Screen name="Gallery" component={GalleryScreen} />
      <MainStack.Screen name="Settings" component={SettingsScreen} />
    </MainStack.Navigator>
  );
}

/* ---------------- ROOT STACK ---------------- */
export default function StackNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  // Check for demo mode
  const isDemoMode = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';

  // Show loading screen while checking auth state
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1e1b4b" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isDemoMode || isAuthenticated ? (
        // User is authenticated or in demo mode - show main app
        <RootStack.Screen name="MainStack" component={MainStackNavigator} />
      ) : (
        // User is not authenticated - show auth screens
        <RootStack.Screen name="AuthStack" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
}
