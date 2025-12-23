import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { ToolType } from '../types/Drawing';
import ColorPalette from './ColorPalette';
import BrushSlider from './BrushSlider';
import { BACKGROUND_COLORS } from '../constants/colors';

interface SettingsPanelProps {
  isVisible: boolean;
  onClose: () => void;
  
  // Tool settings
  selectedTool: ToolType;
  brushSize: number;
  eraserSize: number;
  onBrushSizeChange: (size: number) => void;
  onEraserSizeChange: (size: number) => void;
  
  // Color settings
  strokeColor: string;
  backgroundColor: string;
  onStrokeColorChange: (color: string) => void;
  onBackgroundColorChange: (color: string) => void;
  
  // Text settings
  textSize: number;
  onTextSizeChange: (size: number) => void;
  
  // Text-specific settings for selected text
  selectedElementId?: string | null;
  selectedTextColor?: string | null;
  selectedTextSize?: number | null;
  onTextColorChange?: (color: string) => void;
  onSelectedTextSizeChange?: (size: number) => void;
  onTextEdit?: () => void;
  
  // Shape resizing settings
  selectedShapeWidth?: number | null;
  selectedShapeHeight?: number | null;
  onShapeResize?: (width: number, height: number) => void;
  
  // Canvas actions
  onClear?: () => void;
  onResetZoom?: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const PANEL_HEIGHT = Math.min(500, SCREEN_HEIGHT * 0.7);

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isVisible,
  onClose,
  selectedTool,
  brushSize,
  eraserSize,
  onBrushSizeChange,
  onEraserSizeChange,
  strokeColor,
  backgroundColor,
  onStrokeColorChange,
  onBackgroundColorChange,
  textSize,
  onTextSizeChange,
  selectedElementId,
  selectedTextColor,
  selectedTextSize,
  onTextColorChange,
  onSelectedTextSizeChange,
  onTextEdit,
  selectedShapeWidth,
  selectedShapeHeight,
  onShapeResize,
  onClear,
  onResetZoom,
}) => {
  const [slideAnim] = useState(new Animated.Value(0));

  useEffect(() => {
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
          <Text style={styles.title}>Drawing Settings</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Canvas Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Canvas Actions</Text>
            <View style={styles.actionButtonRow}>
              {onResetZoom && (
                <TouchableOpacity style={styles.actionButton} onPress={onResetZoom}>
                  <Text style={styles.actionButtonText}>🔍 Reset Zoom</Text>
                </TouchableOpacity>
              )}
              {onClear && (
                <TouchableOpacity style={[styles.actionButton, styles.clearButton]} onPress={onClear}>
                  <Text style={styles.actionButtonText}>🗑️ Clear Canvas</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Colors Section */}
          <View style={styles.section}>
            <ColorPalette
              selectedColor={strokeColor}
              onColorSelect={onStrokeColorChange}
              title="Drawing Color"
            />
          </View>

          {/* Background Colors */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Canvas Background</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.backgroundColorRow}
            >
              {BACKGROUND_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.backgroundColorButton,
                    { backgroundColor: color },
                    backgroundColor === color && styles.selectedBackgroundColor,
                  ]}
                  onPress={() => onBackgroundColorChange(color)}
                />
              ))}
            </ScrollView>
          </View>

          {/* Brush & Eraser Size */}
          {(selectedTool === 'brush' || selectedTool === 'eraser') && (
            <View style={styles.section}>
              <BrushSlider
                value={selectedTool === 'brush' ? brushSize : eraserSize}
                onValueChange={selectedTool === 'brush' ? onBrushSizeChange : onEraserSizeChange}
                title={selectedTool === 'brush' ? 'Brush Size' : 'Eraser Size'}
                color={selectedTool === 'brush' ? '#3b82f6' : '#ef4444'}
              />
            </View>
          )}

          {/* Text Size Control */}
          {selectedTool === 'text' && (
            <View style={styles.section}>
              <BrushSlider
                value={textSize}
                onValueChange={onTextSizeChange}
                minimumValue={8}
                maximumValue={72}
                title="Text Size"
                color="#10b981"
              />
            </View>
          )}

          {/* Selected Shape Resize Controls */}
          {selectedElementId && selectedShapeWidth && selectedShapeHeight && onShapeResize && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Resize Shape</Text>
              
              <BrushSlider
                value={selectedShapeWidth}
                onValueChange={(width) => onShapeResize(width, selectedShapeHeight)}
                minimumValue={10}
                maximumValue={300}
                title="Width"
                color="#8b5cf6"
              />

              <BrushSlider
                value={selectedShapeHeight}
                onValueChange={(height) => onShapeResize(selectedShapeWidth, height)}
                minimumValue={10}
                maximumValue={300}
                title="Height"
                color="#8b5cf6"
              />
            </View>
          )}

          {/* Selected Text Controls */}
          {selectedElementId && selectedTextColor && selectedTextSize && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Edit Selected Text</Text>
              
              <TouchableOpacity 
                style={styles.editTextButton}
                onPress={onTextEdit}
              >
                <Text style={styles.editTextButtonText}>✏️ Edit Text Content</Text>
              </TouchableOpacity>

              <ColorPalette
                selectedColor={selectedTextColor}
                onColorSelect={onTextColorChange || (() => {})}
                title="Text Color"
              />

              <BrushSlider
                value={selectedTextSize}
                onValueChange={onSelectedTextSizeChange || (() => {})}
                minimumValue={10}
                maximumValue={80}
                title="Text Size"
                color="#10b981"
              />
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: PANEL_HEIGHT,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    zIndex: 1001,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  handle: {
    width: 48,
    height: 5,
    backgroundColor: '#cbd5e1',
    borderRadius: 3,
    position: 'absolute',
    top: 12,
    left: '50%',
    marginLeft: -24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  closeText: {
    fontSize: 20,
    color: '#64748b',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  section: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  backgroundColorRow: {
    gap: 14,
    paddingHorizontal: 4,
  },
  backgroundColorButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  selectedBackgroundColor: {
    borderColor: '#3b82f6',
    borderWidth: 4,
    elevation: 6,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  editTextButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  editTextButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  actionButtonRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  actionButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    minWidth: 120,
    elevation: 2,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  clearButton: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SettingsPanel;