// Storage utilities for the Drawing & Sketch Canvas App

import { Paths, File, Directory } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawingState, isValidDrawingState } from './drawingState';
import { DRAWINGS_FOLDER, PREVIEW_FILENAME, STATE_FILENAME } from './constants';

// Saved drawing metadata
export interface SavedDrawing {
  id: string;
  name: string;
  previewUri: string;
  stateUri: string;
  createdAt: number;
  updatedAt: number;
  hasState: boolean; // Whether JSON state exists (for backward compatibility)
}

// Storage keys
const DRAWINGS_INDEX_KEY = 'drawings_index';
const SETTINGS_KEY = 'app_settings';

// Get drawings directory
const getDrawingsDir = (): Directory => {
  return new Directory(Paths.document, DRAWINGS_FOLDER);
};

// Get drawing directory
const getDrawingDir = (drawingId: string): Directory => {
  return new Directory(getDrawingsDir(), drawingId);
};

// Save drawing state to JSON file
export const saveDrawingState = async (drawingId: string, state: DrawingState): Promise<string> => {
  try {
    const drawingDir = getDrawingDir(drawingId);
    drawingDir.create({ intermediates: true, idempotent: true });
    
    const stateFile = new File(drawingDir, STATE_FILENAME);
    const stateJson = JSON.stringify(state, null, 2);
    stateFile.write(stateJson);
    
    return stateFile.uri;
  } catch (error) {
    console.error('Error saving drawing state:', error);
    throw new Error('Failed to save drawing state');
  }
};

// Load drawing state from JSON file
export const loadDrawingState = async (stateUri: string): Promise<DrawingState | null> => {
  try {
    const stateFile = new File(stateUri);
    
    if (!stateFile.exists) {
      return null;
    }
    
    const stateJson = await stateFile.text();
    const state = JSON.parse(stateJson);
    
    if (!isValidDrawingState(state)) {
      console.warn('Invalid drawing state format');
      return null;
    }
    
    return state;
  } catch (error) {
    console.error('Error loading drawing state:', error);
    return null;
  }
};

// Save preview image
export const savePreviewImage = async (drawingId: string, imageUri: string): Promise<string> => {
  try {
    const drawingDir = getDrawingDir(drawingId);
    drawingDir.create({ intermediates: true, idempotent: true });
    
    const previewFile = new File(drawingDir, PREVIEW_FILENAME);
    const sourceFile = new File(imageUri);
    
    sourceFile.copy(previewFile);
    
    return previewFile.uri;
  } catch (error) {
    console.error('Error saving preview image:', error);
    throw new Error('Failed to save preview image');
  }
};

// Get drawings index from AsyncStorage
const getDrawingsIndex = async (): Promise<SavedDrawing[]> => {
  try {
    const indexJson = await AsyncStorage.getItem(DRAWINGS_INDEX_KEY);
    if (!indexJson) {
      return [];
    }
    
    const index = JSON.parse(indexJson);
    return Array.isArray(index) ? index : [];
  } catch (error) {
    console.error('Error getting drawings index:', error);
    return [];
  }
};

// Save drawings index to AsyncStorage
const saveDrawingsIndex = async (index: SavedDrawing[]): Promise<void> => {
  try {
    const indexJson = JSON.stringify(index);
    await AsyncStorage.setItem(DRAWINGS_INDEX_KEY, indexJson);
  } catch (error) {
    console.error('Error saving drawings index:', error);
    throw new Error('Failed to save drawings index');
  }
};

// Save complete drawing (preview + state)
export const saveDrawing = async (
  drawingId: string,
  name: string,
  previewImageUri: string,
  state: DrawingState
): Promise<void> => {
  try {
    // Save preview image
    const previewUri = await savePreviewImage(drawingId, previewImageUri);
    
    // Save state
    const stateUri = await saveDrawingState(drawingId, state);
    
    // Update index
    const index = await getDrawingsIndex();
    const existingIndex = index.findIndex(d => d.id === drawingId);
    
    const drawingInfo: SavedDrawing = {
      id: drawingId,
      name,
      previewUri,
      stateUri,
      createdAt: existingIndex >= 0 ? index[existingIndex].createdAt : Date.now(),
      updatedAt: Date.now(),
      hasState: true,
    };
    
    if (existingIndex >= 0) {
      index[existingIndex] = drawingInfo;
    } else {
      index.push(drawingInfo);
    }
    
    await saveDrawingsIndex(index);
  } catch (error) {
    console.error('Error saving drawing:', error);
    throw new Error('Failed to save drawing');
  }
};

// Get all saved drawings
export const getSavedDrawings = async (): Promise<SavedDrawing[]> => {
  try {
    const index = await getDrawingsIndex();
    
    // Verify files still exist and update hasState flag
    const validDrawings: SavedDrawing[] = [];
    
    for (const drawing of index) {
      try {
        const previewFile = new File(drawing.previewUri);
        
        if (previewFile.exists) {
          const stateFile = new File(drawing.stateUri);
          
          validDrawings.push({
            ...drawing,
            hasState: stateFile.exists,
          });
        }
      } catch (error) {
        console.warn(`Drawing ${drawing.id} files not accessible, skipping`);
      }
    }
    
    // Update index if there were changes
    if (validDrawings.length !== index.length) {
      await saveDrawingsIndex(validDrawings);
    }
    
    // Sort by updatedAt descending (newest first)
    return validDrawings.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error('Error getting saved drawings:', error);
    return [];
  }
};

// Delete drawing
export const deleteDrawing = async (drawingId: string): Promise<void> => {
  try {
    // Delete drawing directory
    const drawingDir = getDrawingDir(drawingId);
    
    if (drawingDir.exists) {
      drawingDir.delete();
    }
    
    // Update index
    const index = await getDrawingsIndex();
    const updatedIndex = index.filter(d => d.id !== drawingId);
    await saveDrawingsIndex(updatedIndex);
  } catch (error) {
    console.error('Error deleting drawing:', error);
    throw new Error('Failed to delete drawing');
  }
};

// Clear all drawings
export const clearAllDrawings = async (): Promise<void> => {
  try {
    // Delete drawings directory
    const drawingsDir = getDrawingsDir();
    
    if (drawingsDir.exists) {
      drawingsDir.delete();
    }
    
    // Clear index
    await AsyncStorage.removeItem(DRAWINGS_INDEX_KEY);
  } catch (error) {
    console.error('Error clearing all drawings:', error);
    throw new Error('Failed to clear all drawings');
  }
};

// App settings
export interface AppSettings {
  defaultBrushSize: number;
  defaultBackgroundColor: string;
}

// Get app settings
export const getAppSettings = async (): Promise<AppSettings> => {
  try {
    const settingsJson = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!settingsJson) {
      return {
        defaultBrushSize: 5,
        defaultBackgroundColor: '#FFFFFF',
      };
    }
    
    return JSON.parse(settingsJson);
  } catch (error) {
    console.error('Error getting app settings:', error);
    return {
      defaultBrushSize: 5,
      defaultBackgroundColor: '#FFFFFF',
    };
  }
};

// Save app settings
export const saveAppSettings = async (settings: AppSettings): Promise<void> => {
  try {
    const settingsJson = JSON.stringify(settings);
    await AsyncStorage.setItem(SETTINGS_KEY, settingsJson);
  } catch (error) {
    console.error('Error saving app settings:', error);
    throw new Error('Failed to save app settings');
  }
};