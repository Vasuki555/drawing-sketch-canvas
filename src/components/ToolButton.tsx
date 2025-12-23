import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { ToolType } from '../types/Drawing';

interface ToolButtonProps {
  icon: string;
  name: string;
  isSelected: boolean;
  onPress: () => void;
}

const ToolButton: React.FC<ToolButtonProps> = ({
  icon,
  name,
  isSelected,
  onPress,
}) => {
  const scaleValue = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.spring(scaleValue, {
      toValue: isSelected ? 1.05 : 1,
      useNativeDriver: true,
      tension: 150,
      friction: 8,
    }).start();
  }, [isSelected, scaleValue]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity
        style={[
          styles.container,
          isSelected && styles.selected,
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={[styles.icon, isSelected && styles.selectedIcon]}>{icon}</Text>
        <Text style={[styles.name, isSelected && styles.selectedName]}>{name}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    minWidth: 70,
    height: 52,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  selected: {
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb',
    elevation: 4,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  icon: {
    fontSize: 18,
    marginBottom: 3,
    textAlign: 'center',
    lineHeight: 20,
  },
  selectedIcon: {
    // Icon color doesn't change for emojis
  },
  name: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 12,
  },
  selectedName: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default ToolButton;