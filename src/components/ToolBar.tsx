import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ToolType } from '../types/Drawing';
import ToolButton from './ToolButton';

interface ToolbarProps {
  selectedTool: ToolType;
  onToolSelect: (tool: ToolType) => void;
}

const tools: { id: ToolType; name: string; icon: string }[] = [
  { id: 'brush', name: 'Brush', icon: '🖌️' },
  { id: 'eraser', name: 'Eraser', icon: '🧽' },
  { id: 'line', name: 'Line', icon: '📏' },
  { id: 'rect', name: 'Rect', icon: '⬜' },
  { id: 'square', name: 'Square', icon: '🟦' },
  { id: 'circle', name: 'Circle', icon: '⭕' },
  { id: 'ellipse', name: 'Ellipse', icon: '🥚' },
  { id: 'star', name: 'Star', icon: '⭐' },
  { id: 'text', name: 'Text', icon: '📝' },
  { id: 'fill', name: 'Fill', icon: '🪣' },
];

const Toolbar: React.FC<ToolbarProps> = ({
  selectedTool,
  onToolSelect,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {tools.map((tool) => (
          <ToolButton
            key={tool.id}
            icon={tool.icon}
            name={tool.name}
            isSelected={selectedTool === tool.id}
            onPress={() => onToolSelect(tool.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    height: 75,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 12,
  },
});

export default Toolbar;