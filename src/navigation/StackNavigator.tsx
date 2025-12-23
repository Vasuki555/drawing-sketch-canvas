import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SplashScreen from "../screens/SplashScreen";
import HomeScreen from "../screens/HomeScreen";
import CanvasScreen from "../screens/CanvasScreen";
import GalleryScreen from "../screens/GalleryScreen";
import SettingsScreen from "../screens/SettingsScreen";

const RootStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();

// Main app screens (after splash)
function MainStackNavigator() {
  return (
    <MainStack.Navigator 
      screenOptions={{ headerShown: false }}
      initialRouteName="Home"
    >
      <MainStack.Screen name="Home" component={HomeScreen} />
      <MainStack.Screen name="Canvas" component={CanvasScreen} />
      <MainStack.Screen name="Gallery" component={GalleryScreen} />
      <MainStack.Screen name="Settings" component={SettingsScreen} />
    </MainStack.Navigator>
  );
}

// Root navigator with splash screen
export default function StackNavigator() {
  return (
    <RootStack.Navigator 
      screenOptions={{ headerShown: false }}
      initialRouteName="Splash"
    >
      {/* Splash Screen - Shows only on app launch */}
      <RootStack.Screen 
        name="Splash" 
        component={SplashScreen}
        options={{
          gestureEnabled: false, // Disable swipe gestures
          animation: 'fade', // Smooth fade transition
        }}
      />
      {/* Main App Stack - Contains all main screens */}
      <RootStack.Screen 
        name="MainStack" 
        component={MainStackNavigator}
        options={{
          gestureEnabled: false, // Prevent going back to splash
          animation: 'slide_from_right', // Smooth transition from splash
        }}
      />
    </RootStack.Navigator>
  );
}