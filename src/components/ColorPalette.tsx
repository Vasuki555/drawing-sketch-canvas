import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
import { SOLID_COLORS, GRADIENT_COLORS } from '../constants/colors';

interface ColorPaletteProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
  title?: string;
}

const ColorPalette: React.FC<ColorPaletteProps> = ({
  selectedColor,
  onColorSelect,
  title = 'Colors',
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      {/* Solid Colors */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.colorRow}
      >
        {SOLID_COLORS.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorButton,
              { backgroundColor: color },
              selectedColor === color && styles.selectedColor,
              color === '#FFFFFF' && styles.whiteColorBorder,
            ]}
            onPress={() => onColorSelect(color)}
          />
        ))}
      </ScrollView>

      {/* Gradient Colors */}
      <Text style={styles.subtitle}>Gradients</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.colorRow}
      >
        {GRADIENT_COLORS.map((gradient) => (
          <TouchableOpacity
            key={gradient.id}
            style={[
              styles.gradientButton,
              selectedColor === gradient.colors[0] && styles.selectedColor,
            ]}
            onPress={() => onColorSelect(gradient.colors[0])}
          >
            <View
              style={[
                styles.gradientPreview,
                { backgroundColor: gradient.colors[0] },
              ]}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
    marginTop: 16,
    marginBottom: 8,
  },
  colorRow: {
    gap: 8,
    paddingHorizontal: 4,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedColor: {
    borderColor: '#3b82f6',
    borderWidth: 3,
    elevation: 4,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  whiteColorBorder: {
    borderColor: '#e2e8f0',
    borderWidth: 1,
  },
  gradientButton: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gradientPreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});

export default ColorPalette;