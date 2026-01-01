import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import StackNavigator from "./src/navigation/StackNavigator";
import { SettingsProvider } from "./src/contexts/SettingsContext";
import { AuthProvider } from "./src/contexts/AuthContext";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <SettingsProvider>
            <NavigationContainer>
              <StackNavigator />
            </NavigationContainer>
          </SettingsProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
