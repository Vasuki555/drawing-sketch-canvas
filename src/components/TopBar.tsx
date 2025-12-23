import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';

interface TopBarProps {
  onBack: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onClear: () => void;
  onSettings: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  canUndo: boolean;
  canRedo: boolean;
  zoomLevel: number;
}

const TopBar: React.FC<TopBarProps> = ({
  onBack,
  onUndo,
  onRedo,
  onSave,
  onSettings,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  canUndo,
  canRedo,
  zoomLevel,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {/* Back Button */}
        <TouchableOpacity style={styles.actionButton} onPress={onBack}>
          <Text style={styles.buttonText}>←</Text>
        </TouchableOpacity>
        
        {/* Undo Button */}
        <TouchableOpacity
          style={[styles.actionButton, !canUndo && styles.disabledButton]}
          onPress={onUndo}
          disabled={!canUndo}
        >
          <Text style={[styles.buttonText, !canUndo && styles.disabledText]}>↶</Text>
        </TouchableOpacity>

        {/* Redo Button */}
        <TouchableOpacity
          style={[styles.actionButton, !canRedo && styles.disabledButton]}
          onPress={onRedo}
          disabled={!canRedo}
        >
          <Text style={[styles.buttonText, !canRedo && styles.disabledText]}>↷</Text>
        </TouchableOpacity>

        {/* Zoom Controls */}
        <View style={styles.zoomContainer}>
          <TouchableOpacity style={styles.zoomButton} onPress={onZoomOut}>
            <Text style={styles.zoomButtonText}>−</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.zoomPercentButton} onPress={onResetZoom}>
            <Text style={styles.zoomPercentText}>{Math.round(zoomLevel * 100)}%</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.zoomButton} onPress={onZoomIn}>
            <Text style={styles.zoomButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={onSave}>
          <Text style={styles.buttonText}>💾</Text>
        </TouchableOpacity>

        {/* Settings Button */}
        <TouchableOpacity style={styles.settingsButton} onPress={onSettings}>
          <Text style={styles.buttonText}>⚙️</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 10,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  disabledButton: {
    backgroundColor: '#cbd5e1',
    elevation: 1,
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  disabledText: {
    color: '#94a3b8',
  },
  zoomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf6',
    borderRadius: 22,
    height: 44,
    paddingHorizontal: 4,
    elevation: 2,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  zoomButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
  },
  zoomPercentButton: {
    paddingHorizontal: 8,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  zoomPercentText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
});

export default TopBar;