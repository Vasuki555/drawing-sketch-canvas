import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

interface BrushSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  title: string;
  color?: string;
}

const BrushSlider: React.FC<BrushSliderProps> = ({
  value,
  onValueChange,
  minimumValue = 1,
  maximumValue = 50,
  title,
  color = '#3b82f6',
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}: {Math.round(value)}px</Text>
      
      <View style={styles.sliderContainer}>
        <Text style={styles.label}>{minimumValue}</Text>
        <Slider
          style={styles.slider}
          minimumValue={minimumValue}
          maximumValue={maximumValue}
          value={value}
          onValueChange={onValueChange}
          step={1}
          minimumTrackTintColor={color}
          maximumTrackTintColor="#e2e8f0"
          thumbTintColor="#3b82f6"
        />
        <Text style={styles.label}>{maximumValue}</Text>
      </View>
      
      <View style={styles.previewContainer}>
        <View
          style={[
            styles.preview,
            {
              width: Math.max(value, 4),
              height: Math.max(value, 4),
              backgroundColor: color,
            },
          ]}
        />
      </View>
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
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 12,
  },
  label: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    width: 20,
    textAlign: 'center',
  },
  previewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  preview: {
    borderRadius: 50,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});

export default BrushSlider;


