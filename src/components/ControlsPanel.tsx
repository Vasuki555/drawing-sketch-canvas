import React, { useState } from 'react';
import { 
  View, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Animated,
  Dimensions 
} from 'react-native';
import Slider from '@react-native-community/slider';

type Tool = 'brush' | 'eraser' | 'line' | 'rect' | 'square' | 'circle' | 'text' | 'fill';
type ColorMode = 'stroke' | 'fill' | 'text';

interface ControlsPanelProps {
  isVisible: boolean;
  onClose: () => void;
  
  // Color props
  colors: string[];
  selectedColor: string;
  backgroundColor: string;
  onColorSelect: (color: string) => void;
  onBackgroundColorSelect: (color: string) => void;
  
  // Size props
  selectedTool: Tool;
  brushSize: number;
  eraserSize: number;
  onBrushSizeChange: (size: number) => void;
  onEraserSizeChange: (size: number) => void;
  
  // Text props
  textSize?: number;
  onTextSizeChange?: (size: number) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const PANEL_HEIGHT = Math.min(300, SCREEN_HEIGHT * 0.4);

const ControlsPanel: React.FC<ControlsPanelProps> = ({
  isVisible,
  onClose,
  colors,
  selectedColor,
  backgroundColor,
  onColorSelect,
  onBackgroundColorSelect,
  selectedTool,
  brushSize,
  eraserSize,
  onBrushSizeChange,
  onEraserSizeChange,
  textSize = 16,
  onTextSizeChange,
}) => {
  const [colorMode, setColorMode] = useState<ColorMode>('stroke');
  const [slideAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible, slideAnim]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [PANEL_HEIGHT, 0],
  });

  const isEraser = selectedTool === 'eraser';
  const currentSize = isEraser ? eraserSize : brushSize;
  const onSizeChange = isEraser ? onEraserSizeChange : onBrushSizeChange;

  const handleColorSelect = (color: string) => {
    if (colorMode === 'text') {
      onBackgroundColorSelect(color); // Use background handler for text color
    } else {
      onColorSelect(color);
    }
  };

  const getCurrentColor = () => {
    if (colorMode === 'text') return backgroundColor; // Use background for text color display
    return selectedColor;
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={onClose}
      />
      
      {/* Panel */}
      <Animated.View 
        style={[
          styles.panel,
          { transform: [{ translateY }] }
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.handle} />
          <Text style={styles.title}>Drawing Controls</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Color Mode Toggle */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Color Mode</Text>
            <View style={styles.colorModeToggle}>
              {(['stroke', 'fill', 'text'] as ColorMode[]).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.modeButton,
                    colorMode === mode && styles.selectedModeButton,
                  ]}
                  onPress={() => setColorMode(mode)}
                >
                  <Text style={[
                    styles.modeText,
                    colorMode === mode && styles.selectedModeText,
                  ]}>
                    {mode === 'stroke' ? '🖌️ Stroke' : 
                     mode === 'fill' ? '🪣 Fill' : '📝 Text'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Color Palette */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {colorMode === 'text' ? 'Text Color' : 
               colorMode === 'fill' ? 'Fill Color' : 'Stroke Color'}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.colorScrollContent}
            >
              {colors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorButton,
                    { backgroundColor: color },
                    getCurrentColor() === color && styles.selectedColor,
                    color === '#FFFFFF' && styles.whiteColorBorder,
                  ]}
                  onPress={() => handleColorSelect(color)}
                />
              ))}
            </ScrollView>
          </View>

          {/* Background Color Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Background Color</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.colorScrollContent}
            >
              {['#FFFFFF', '#F5F5F5', '#E6E6FA', '#F0F8FF', '#F5FFFA', '#FFF8DC'].map((color) => (
                <TouchableOpacity
                  key={`bg-${color}`}
                  style={[
                    styles.colorButton,
                    { backgroundColor: color },
                    backgroundColor === color && styles.selectedColor,
                    styles.whiteColorBorder,
                  ]}
                  onPress={() => onBackgroundColorSelect(color)}
                />
              ))}
            </ScrollView>
          </View>

          {/* Size Control */}
          {(['brush', 'eraser'].includes(selectedTool) || (selectedTool === 'text' && onTextSizeChange)) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {selectedTool === 'text' ? `Text Size: ${textSize}` :
                 isEraser ? `Eraser Size: ${currentSize}` : `Brush Size: ${currentSize}`}
              </Text>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>
                  {selectedTool === 'text' ? '8' : '1'}
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={selectedTool === 'text' ? 8 : 1}
                  maximumValue={selectedTool === 'text' ? 72 : 50}
                  value={selectedTool === 'text' ? textSize : currentSize}
                  onValueChange={selectedTool === 'text' ? onTextSizeChange : onSizeChange}
                  step={1}
                  minimumTrackTintColor="#007AFF"
                  maximumTrackTintColor="#ddd"
                />
                <Text style={styles.sliderLabel}>
                  {selectedTool === 'text' ? '72' : '50'}
                </Text>
              </View>
              <View style={styles.sizePreviewContainer}>
                <View
                  style={[
                    styles.sizePreview,
                    {
                      width: Math.max(selectedTool === 'text' ? textSize / 2 : currentSize, 4),
                      height: Math.max(selectedTool === 'text' ? textSize / 2 : currentSize, 4),
                      backgroundColor: selectedTool === 'text' ? '#333' : isEraser ? '#ff6b6b' : '#007AFF',
                    },
                  ]}
                />
              </View>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: PANEL_HEIGHT,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 1001,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    position: 'absolute',
    top: 8,
    left: '50%',
    marginLeft: -20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  colorModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  selectedModeButton: {
    backgroundColor: '#007AFF',
  },
  modeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  selectedModeText: {
    color: '#fff',
  },
  colorScrollContent: {
    gap: 8,
  },
  colorButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#007AFF',
    borderWidth: 3,
  },
  whiteColorBorder: {
    borderColor: '#ddd',
    borderWidth: 1,
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
  sliderLabel: {
    fontSize: 12,
    color: '#666',
    width: 20,
    textAlign: 'center',
  },
  sizePreviewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  sizePreview: {
    borderRadius: 50,
  },
});

export default ControlsPanel;