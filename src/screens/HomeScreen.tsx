import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '../contexts/SettingsContext';

export default function HomeScreen({ navigation }: any) {
  const { settings, theme } = useSettings();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={settings.theme === 'dark' ? "light-content" : "dark-content"} backgroundColor={theme.background} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.primary }]}>🎨 Drawing & Sketch Canvas</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Create amazing digital art</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton, { backgroundColor: theme.primary }]} 
            onPress={() => navigation.navigate("Canvas")}
          >
            <Text style={styles.buttonIcon}>✏️</Text>
            <Text style={styles.primaryButtonText}>Create New Drawing</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton, { backgroundColor: theme.surface, borderColor: theme.border }]} 
            onPress={() => navigation.navigate("Gallery")}
          >
            <Text style={styles.buttonIcon}>🖼️</Text>
            <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Open Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton, { backgroundColor: theme.surface, borderColor: theme.border }]} 
            onPress={() => navigation.navigate("Settings")}
          >
            <Text style={styles.buttonIcon}>⚙️</Text>
            <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Settings</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>Professional drawing tools at your fingertips</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: "center",
    marginTop: 60,
  },
  title: { 
    fontSize: 32, 
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
  },
  buttonContainer: {
    flex: 1,
    justifyContent: "center",
    gap: 20,
  },
  button: { 
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20, 
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButton: {
    // backgroundColor will be set dynamically
  },
  secondaryButton: {
    borderWidth: 2,
    // backgroundColor and borderColor will be set dynamically
  },
  buttonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  primaryButtonText: { 
    color: "#fff", 
    fontSize: 18,
    fontWeight: "600",
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: "600",
    // color will be set dynamically
  },
  footer: {
    alignItems: "center",
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    textAlign: "center",
    // color will be set dynamically
  },
});