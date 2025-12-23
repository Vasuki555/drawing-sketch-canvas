import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  Alert,
  Dimensions,
  RefreshControl,
  Modal,
  StatusBar
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getSavedDrawings, deleteDrawing } from '../utils/saveDrawing';
import { SavedDrawing } from '../types/Drawing';
import { useSettings } from '../contexts/SettingsContext';

const { width, height } = Dimensions.get('window');
const ITEM_SIZE = (width - 48) / 2; // 2 columns with padding

export default function GalleryScreen({ navigation }: any) {
  const { settings, theme } = useSettings();
  const [drawings, setDrawings] = useState<SavedDrawing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedDrawing, setSelectedDrawing] = useState<SavedDrawing | null>(null);
  const [showFullScreen, setShowFullScreen] = useState<boolean>(false);

  // Load saved drawings
  const loadDrawings = async () => {
    try {
      const savedDrawings = await getSavedDrawings();
      setDrawings(savedDrawings.reverse()); // Show newest first
    } catch (error) {
      console.error('Error loading drawings:', error);
      Alert.alert("Error", "Failed to load drawings.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 🎯 Use useFocusEffect to reload when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadDrawings();
    }, [])
  );

  // Delete a specific drawing
  const deleteDrawingHandler = async (drawingToDelete: SavedDrawing) => {
    Alert.alert(
      "Delete Drawing",
      `Are you sure you want to delete "${drawingToDelete.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Use the backend-aware delete function
              await deleteDrawing(drawingToDelete.id);
              
              // Reload drawings to reflect changes
              await loadDrawings();
              
              // Close full screen if this drawing was being viewed
              if (selectedDrawing?.id === drawingToDelete.id) {
                setShowFullScreen(false);
                setSelectedDrawing(null);
              }
              
            } catch (error) {
              console.error('Error deleting drawing:', error);
              Alert.alert("Error", "Failed to delete drawing.");
              // Reload drawings to restore state
              loadDrawings();
            }
          },
        },
      ]
    );
  };

  // Clear all drawings
  const handleClearAll = async () => {
    Alert.alert(
      "Clear All Drawings",
      "Are you sure you want to delete all saved drawings? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete all drawings one by one to ensure backend sync
              const allDrawings = await getSavedDrawings();
              for (const drawing of allDrawings) {
                await deleteDrawing(drawing.id);
              }
              
              setDrawings([]);
              setShowFullScreen(false);
              setSelectedDrawing(null);
              Alert.alert("Success", "All drawings have been deleted.");
            } catch (error) {
              Alert.alert("Error", "Failed to delete drawings.");
              // Reload to show current state
              loadDrawings();
            }
          },
        },
      ]
    );
  };

  // Open drawing in full screen
  const openFullScreen = (drawing: SavedDrawing) => {
    setSelectedDrawing(drawing);
    setShowFullScreen(true);
  };

  // Edit drawing in Canvas
  const editDrawing = (drawing: SavedDrawing) => {
    setShowFullScreen(false);
    
    // 🎯 Check if drawing has state (is editable)
    if (!drawing.hasState) {
      Alert.alert(
        "Cannot Edit Drawing",
        "This drawing was created in an older version and cannot be edited.",
        [{ text: "OK" }]
      );
      return;
    }
    
    // 🎯 Navigate to Canvas with state URI for restoration
    navigation.navigate("Canvas", { 
      editMode: true,
      drawingId: drawing.id,
      stateUri: drawing.stateUri, // Pass state URI for restoration
    });
  };

  // Refresh handler
  const onRefresh = () => {
    setRefreshing(true);
    loadDrawings();
  };

  // Render individual drawing item
  const renderDrawingItem = ({ item }: { item: SavedDrawing }) => (
    <TouchableOpacity 
      style={styles.drawingItem}
      onPress={() => openFullScreen(item)}
      activeOpacity={0.8}
    >
      <Image 
        source={{ uri: item.previewUri }} 
        style={styles.drawingImage}
        resizeMode="cover"
      />
      <View style={styles.drawingInfo}>
        <Text style={styles.drawingName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.drawingDate}>
          {new Date(item.updatedAt).toLocaleDateString()}
        </Text>
        
        {/* 🆕 Editability indicator */}
        <View style={styles.editabilityIndicator}>
          <Text style={[
            styles.editabilityText, 
            item.hasState ? styles.editableText : styles.viewOnlyText
          ]}>
            {item.hasState ? '✏️ Editable' : '👁️ View Only'}
          </Text>
        </View>
      </View>
      
      {/* Quick delete button */}
      <TouchableOpacity 
        style={styles.quickDeleteButton}
        onPress={(e) => {
          e.stopPropagation();
          deleteDrawingHandler(item);
        }}
      >
        <Text style={styles.quickDeleteText}>×</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Empty state component
  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🎨</Text>
      <Text style={styles.emptyTitle}>No drawings yet</Text>
      <Text style={styles.emptySubtitle}>
        Start sketching!
      </Text>
      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => navigation.navigate("Canvas")}
      >
        <Text style={styles.createButtonText}>Start Drawing</Text>
      </TouchableOpacity>
    </View>
  );

  // Full Screen Preview Modal
  const FullScreenPreview = () => (
    <Modal
      visible={showFullScreen}
      transparent={false}
      animationType="fade"
      onRequestClose={() => setShowFullScreen(false)}
    >
      <StatusBar hidden />
      <View style={styles.fullScreenContainer}>
        {/* Full screen image */}
        <View style={styles.imageContainer}>
          {selectedDrawing && (
            <Image 
              source={{ uri: selectedDrawing.previewUri }} 
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </View>
        
        {/* Control buttons */}
        <View style={styles.fullScreenControls}>
          <TouchableOpacity 
            style={[styles.controlButton, styles.backButton]}
            onPress={() => setShowFullScreen(false)}
          >
            <Text style={styles.controlButtonText}>← Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.controlButton, 
              selectedDrawing?.hasState ? styles.editButton : styles.disabledEditButton
            ]}
            onPress={() => selectedDrawing && editDrawing(selectedDrawing)}
          >
            <Text style={styles.controlButtonText}>
              {selectedDrawing?.hasState ? '✏️ Edit' : '🔒 View Only'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlButton, styles.deleteButton]}
            onPress={() => selectedDrawing && deleteDrawingHandler(selectedDrawing)}
          >
            <Text style={styles.controlButtonText}>🗑️ Delete</Text>
          </TouchableOpacity>
        </View>
        
        {/* Drawing info */}
        {selectedDrawing && (
          <View style={styles.drawingInfoOverlay}>
            <Text style={styles.fullScreenTitle}>{selectedDrawing.name}</Text>
            <Text style={styles.fullScreenDate}>
              Created: {new Date(selectedDrawing.createdAt).toLocaleString()}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={settings.theme === 'dark' ? "light-content" : "dark-content"} backgroundColor={theme.background} />
        <View style={[styles.header, { backgroundColor: theme.headerBackground, borderBottomColor: theme.headerBorder }]}>
          <TouchableOpacity 
            style={[styles.headerBackButton, { backgroundColor: theme.secondary }]} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.primary }]}>Gallery</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.primary }]}>Loading drawings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={settings.theme === 'dark' ? "light-content" : "dark-content"} backgroundColor={theme.background} />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBackground, borderBottomColor: theme.headerBorder }]}>
        <TouchableOpacity 
          style={[styles.headerBackButton, { backgroundColor: theme.secondary }]} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: theme.primary }]}>
          Gallery ({drawings.length})
        </Text>
        
        {drawings.length > 0 && (
          <TouchableOpacity 
            style={styles.clearAllButton}
            onPress={handleClearAll}
          >
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
        
        {drawings.length === 0 && <View style={styles.placeholder} />}
      </View>

      {/* Drawings Grid or Empty State */}
      {drawings.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={drawings}
          renderItem={renderDrawingItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#2563eb"
            />
          }
        />
      )}

      {/* Floating Action Button */}
      {drawings.length > 0 && (
        <TouchableOpacity 
          style={styles.floatingButton}
          onPress={() => navigation.navigate("Canvas")}
        >
          <Text style={styles.floatingButtonText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Full Screen Preview Modal */}
      <FullScreenPreview />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff7ed" 
  },
  
  // Header Styles
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fed7aa",
    borderBottomWidth: 1,
    borderBottomColor: "#fdba74",
  },
  headerBackButton: {
    backgroundColor: "#ea580c",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#9a3412",
  },
  clearAllButton: {
    backgroundColor: "#dc2626",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearAllText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  placeholder: {
    width: 60,
  },
  
  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#9a3412",
  },
  
  // Grid Styles
  gridContainer: {
    padding: 16,
  },
  drawingItem: {
    width: ITEM_SIZE,
    marginBottom: 16,
    marginHorizontal: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: "relative",
  },
  drawingImage: {
    width: "100%",
    height: ITEM_SIZE * 0.8,
    backgroundColor: "#f3f4f6",
  },
  drawingInfo: {
    padding: 12,
  },
  drawingName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  drawingDate: {
    fontSize: 12,
    color: "#6b7280",
  },
  
  // 🆕 Editability Indicator Styles
  editabilityIndicator: {
    marginTop: 4,
  },
  editabilityText: {
    fontSize: 10,
    fontWeight: "500",
  },
  editableText: {
    color: "#059669",
  },
  viewOnlyText: {
    color: "#dc2626",
  },
  
  // Quick Delete Button
  quickDeleteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(220, 38, 38, 0.9)",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  quickDeleteText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    lineHeight: 16,
  },
  
  // Empty State Styles
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#9a3412",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#c2410c",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  createButton: {
    backgroundColor: "#ea580c",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  
  // Floating Button Styles
  floatingButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "#ea580c",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  floatingButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  
  // 🎯 Full Screen Preview Styles
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: width,
    height: height * 0.8,
  },
  fullScreenControls: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
  },
  controlButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  backButton: {
    backgroundColor: "#6b7280",
  },
  editButton: {
    backgroundColor: "#2563eb",
  },
  disabledEditButton: {
    backgroundColor: "#6b7280",
  },
  deleteButton: {
    backgroundColor: "#dc2626",
  },
  controlButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  drawingInfoOverlay: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 16,
    borderRadius: 8,
  },
  fullScreenTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  fullScreenDate: {
    color: "#d1d5db",
    fontSize: 14,
  },
});