import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '../contexts/SettingsContext';

export default function SettingsScreen({ navigation }: any) {
  const { settings, updateSetting, resetSettings, isLoading, theme } = useSettings();

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetSettings();
              Alert.alert('Success', 'Settings have been reset to default');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset settings');
            }
          },
        },
      ]
    );
  };

  const handleSettingChange = async <K extends keyof typeof settings>(
    key: K,
    value: typeof settings[K]
  ) => {
    try {
      await updateSetting(key, value);
    } catch (error) {
      Alert.alert('Error', 'Failed to save setting');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.primary }]}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBackground, borderBottomColor: theme.headerBorder }]}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: theme.secondary }]} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.primary }]}>Settings</Text>
        <TouchableOpacity 
          style={styles.resetButton}
          onPress={handleResetSettings}
        >
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Theme Section */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>Appearance</Text>
          
          <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Dark Mode</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                Switch between light and dark themes
              </Text>
            </View>
            <Switch
              value={settings.theme === 'dark'}
              onValueChange={(value) => 
                handleSettingChange('theme', value ? 'dark' : 'light')
              }
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor={settings.theme === 'dark' ? '#ffffff' : '#f3f4f6'}
            />
          </View>
        </View>

        {/* Drawing Defaults Section */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>Drawing Defaults</Text>
          
          <TouchableOpacity 
            style={[styles.settingRow, { borderBottomColor: theme.border }]}
            onPress={() => {
              // Show color picker modal
              Alert.prompt(
                'Background Color',
                'Enter a hex color (e.g., #ffffff)',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Set',
                    onPress: (color?: string) => {
                      if (color && /^#[0-9A-F]{6}$/i.test(color)) {
                        handleSettingChange('defaultBackgroundColor', color);
                      } else {
                        Alert.alert('Invalid Color', 'Please enter a valid hex color (e.g., #ffffff)');
                      }
                    },
                  },
                ],
                'plain-text',
                settings.defaultBackgroundColor
              );
            }}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Default Background Color</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                Background color for new drawings
              </Text>
            </View>
            <View 
              style={[
                styles.colorPreview, 
                { backgroundColor: settings.defaultBackgroundColor, borderColor: theme.border }
              ]} 
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingRow, { borderBottomColor: theme.border }]}
            onPress={() => {
              Alert.prompt(
                'Default Brush Size',
                'Enter brush size (1-50)',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Set',
                    onPress: (size?: string) => {
                      const numSize = parseInt(size || '0', 10);
                      if (numSize >= 1 && numSize <= 50) {
                        handleSettingChange('defaultBrushSize', numSize);
                      } else {
                        Alert.alert('Invalid Size', 'Please enter a size between 1 and 50');
                      }
                    },
                  },
                ],
                'plain-text',
                settings.defaultBrushSize.toString()
              );
            }}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Default Brush Size</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                Starting brush size: {settings.defaultBrushSize}px
              </Text>
            </View>
            <Text style={[styles.settingValue, { color: theme.primary }]}>{settings.defaultBrushSize}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingRow, { borderBottomColor: theme.border }]}
            onPress={() => {
              Alert.prompt(
                'Default Eraser Size',
                'Enter eraser size (1-100)',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Set',
                    onPress: (size?: string) => {
                      const numSize = parseInt(size || '0', 10);
                      if (numSize >= 1 && numSize <= 100) {
                        handleSettingChange('defaultEraserSize', numSize);
                      } else {
                        Alert.alert('Invalid Size', 'Please enter a size between 1 and 100');
                      }
                    },
                  },
                ],
                'plain-text',
                settings.defaultEraserSize.toString()
              );
            }}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Default Eraser Size</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                Starting eraser size: {settings.defaultEraserSize}px
              </Text>
            </View>
            <Text style={[styles.settingValue, { color: theme.primary }]}>{settings.defaultEraserSize}</Text>
          </TouchableOpacity>
        </View>

        {/* Auto-Save Section */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>Auto-Save</Text>
          
          <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Auto-Save Drawings</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                Automatically save your work while drawing
              </Text>
            </View>
            <Switch
              value={settings.autoSave}
              onValueChange={(value) => handleSettingChange('autoSave', value)}
              trackColor={{ false: '#e5e7eb', true: '#10b981' }}
              thumbColor={settings.autoSave ? '#ffffff' : '#f3f4f6'}
            />
          </View>
        </View>

        {/* App Info Section */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>About</Text>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>App Version</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>1.0.0</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Build</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>Professional</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Platform</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>React Native + Expo</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginVertical: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  colorPreview: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});