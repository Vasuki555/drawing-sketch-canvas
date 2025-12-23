import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings } from '../types/Drawing';
import { DEFAULT_BACKGROUND_COLOR } from '../constants/colors';

const SETTINGS_KEY = 'app_settings';

const defaultSettings: AppSettings = {
  theme: 'light',
  defaultBackgroundColor: DEFAULT_BACKGROUND_COLOR,
  autoSave: true,
  defaultBrushSize: 5,
  defaultEraserSize: 10,
};

// Theme colors
export const themes = {
  light: {
    background: '#fdf2f8',
    surface: '#ffffff',
    primary: '#9d174d',
    secondary: '#be185d',
    text: '#374151',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    headerBackground: '#fce7f3',
    headerBorder: '#f9a8d4',
  },
  dark: {
    background: '#1f2937',
    surface: '#374151',
    primary: '#f9a8d4',
    secondary: '#fce7f3',
    text: '#f9fafb',
    textSecondary: '#d1d5db',
    border: '#4b5563',
    headerBackground: '#374151',
    headerBorder: '#6b7280',
  },
};

interface SettingsContextType {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
  resetSettings: () => Promise<void>;
  isLoading: boolean;
  theme: typeof themes.light;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Get current theme colors
  const theme = themes[settings.theme];

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        // Merge with defaults to ensure all properties exist
        const mergedSettings = { ...defaultSettings, ...parsed };
        setSettings(mergedSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Use defaults if loading fails
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  };

  const updateSetting = async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    await saveSettings(newSettings);
  };

  const resetSettings = async () => {
    await saveSettings(defaultSettings);
  };

  const contextValue: SettingsContextType = {
    settings,
    updateSetting,
    resetSettings,
    isLoading,
    theme,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export { defaultSettings };