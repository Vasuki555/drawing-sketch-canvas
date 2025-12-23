// Save drawing utilities with backend integration

import { Paths, File, Directory } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawingState, SavedDrawing } from '../types/Drawing';
import { drawingApi } from '../services/api';

const DRAWINGS_FOLDER = 'drawings';
const PREVIEW_FILENAME = 'preview.png';
const STATE_FILENAME = 'state.json';
const DRAWINGS_INDEX_KEY = 'drawings_index';

// Get drawings directory
const getDrawingsDir = (): Directory => {
  return new Directory(Paths.document, DRAWINGS_FOLDER);
};

// Get drawing directory
const getDrawingDir = (drawingId: string): Directory => {
  return new Directory(getDrawingsDir(), drawingId);
};

// Save drawing state to JSON (local fallback)
const saveDrawingStateLocal = async (drawingId: string, state: DrawingState): Promise<string> => {
  try {
    const drawingDir = getDrawingDir(drawingId);
    drawingDir.create({ intermediates: true, idempotent: true });
    
    const stateFile = new File(drawingDir, STATE_FILENAME);
    
    // If state file already exists, delete it first to ensure clean overwrite
    if (stateFile.exists) {
      stateFile.delete();
    }
    
    const stateJson = JSON.stringify(state, null, 2);
    stateFile.write(stateJson);
    
    return stateFile.uri;
  } catch (error) {
    console.error('Error saving drawing state locally:', error);
    throw new Error('Failed to save drawing state locally');
  }
};

// Save preview image (local fallback)
const savePreviewImageLocal = async (drawingId: string, imageUri: string): Promise<string> => {
  try {
    const drawingDir = getDrawingDir(drawingId);
    drawingDir.create({ intermediates: true, idempotent: true });
    
    const previewFile = new File(drawingDir, PREVIEW_FILENAME);
    const sourceFile = new File(imageUri);
    
    // If preview file already exists, delete it first to ensure clean overwrite
    if (previewFile.exists) {
      previewFile.delete();
    }
    
    sourceFile.copy(previewFile);
    
    return previewFile.uri;
  } catch (error) {
    console.error('Error saving preview image locally:', error);
    throw new Error('Failed to save preview image locally');
  }
};

// Get drawings index (local fallback)
const getDrawingsIndexLocal = async (): Promise<SavedDrawing[]> => {
  try {
    const indexJson = await AsyncStorage.getItem(DRAWINGS_INDEX_KEY);
    if (!indexJson) {
      return [];
    }
    
    const index = JSON.parse(indexJson);
    return Array.isArray(index) ? index : [];
  } catch (error) {
    console.error('Error getting drawings index locally:', error);
    return [];
  }
};

// Save drawings index (local fallback)
const saveDrawingsIndexLocal = async (index: SavedDrawing[]): Promise<void> => {
  try {
    const indexJson = JSON.stringify(index);
    await AsyncStorage.setItem(DRAWINGS_INDEX_KEY, indexJson);
  } catch (error) {
    console.error('Error saving drawings index locally:', error);
    throw new Error('Failed to save drawings index locally');
  }
};

// Save complete drawing with backend integration
export const saveDrawing = async (
  drawingId: string,
  name: string,
  previewImageUri: string,
  state: DrawingState
): Promise<void> => {
  try {
    // Validate inputs
    if (!drawingId) {
      throw new Error('Drawing ID is required');
    }
    if (!previewImageUri) {
      throw new Error('Preview image URI is required');
    }
    if (!state) {
      throw new Error('Drawing state is required');
    }

    let savedDrawing: SavedDrawing | null = null;
    let useBackend = false;

    // Try backend first
    try {
      const isHealthy = await drawingApi.isHealthy();
      if (isHealthy) {
        // Check if this is an update (drawing exists in backend)
        const existingDrawings = await getDrawingsIndexLocal();
        const existingDrawing = existingDrawings.find(d => d.id === drawingId);
        const isUpdate = existingDrawing && existingDrawing.stateUri.startsWith('api:');

        if (isUpdate) {
          // Update existing drawing
          savedDrawing = await drawingApi.updateDrawing(drawingId, name, previewImageUri, state);
        } else {
          // Create new drawing
          savedDrawing = await drawingApi.createDrawing(name, previewImageUri, state);
        }
        
        useBackend = true;
        console.log(`Successfully saved drawing to backend: ${drawingId}`);
      }
    } catch (error) {
      console.warn('Backend save failed, falling back to local storage:', error);
    }

    // Fallback to local storage if backend failed
    if (!useBackend || !savedDrawing) {
      const previewUri = await savePreviewImageLocal(drawingId, previewImageUri);
      const stateUri = await saveDrawingStateLocal(drawingId, state);
      
      const index = await getDrawingsIndexLocal();
      const existingIndex = index.findIndex(d => d.id === drawingId);
      
      savedDrawing = {
        id: drawingId,
        name,
        previewUri,
        stateUri,
        createdAt: existingIndex >= 0 ? index[existingIndex].createdAt : Date.now(),
        updatedAt: Date.now(),
        hasState: true,
      };
      
      if (existingIndex >= 0) {
        index[existingIndex] = savedDrawing;
      } else {
        index.push(savedDrawing);
      }
      
      await saveDrawingsIndexLocal(index);
      console.log(`Successfully saved drawing locally: ${drawingId}`);
    }

    // Always update local index for consistency
    if (savedDrawing) {
      const localIndex = await getDrawingsIndexLocal();
      const existingIndex = localIndex.findIndex(d => d.id === drawingId);
      
      if (existingIndex >= 0) {
        localIndex[existingIndex] = savedDrawing;
      } else {
        localIndex.push(savedDrawing);
      }
      
      await saveDrawingsIndexLocal(localIndex);
    }
    
  } catch (error) {
    console.error('Error saving drawing:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to save drawing: ${errorMessage}`);
  }
};

// Delete drawing with backend integration
export const deleteDrawing = async (drawingId: string): Promise<void> => {
  try {
    const localIndex = await getDrawingsIndexLocal();
    const drawing = localIndex.find(d => d.id === drawingId);
    
    // Try backend deletion if drawing is stored in backend
    if (drawing && drawing.stateUri.startsWith('api:')) {
      try {
        const isHealthy = await drawingApi.isHealthy();
        if (isHealthy) {
          await drawingApi.deleteDrawing(drawingId);
          console.log(`Successfully deleted drawing from backend: ${drawingId}`);
        }
      } catch (error) {
        console.warn('Backend delete failed:', error);
      }
    }
    
    // Always clean up local files
    const drawingDir = getDrawingDir(drawingId);
    if (drawingDir.exists) {
      drawingDir.delete();
    }
    
    // Update local index
    const updatedIndex = localIndex.filter(d => d.id !== drawingId);
    await saveDrawingsIndexLocal(updatedIndex);
    
    console.log(`Successfully deleted drawing: ${drawingId}`);
  } catch (error) {
    console.error('Error deleting drawing:', error);
    throw new Error('Failed to delete drawing');
  }
};

// Get all saved drawings with backend integration
export const getSavedDrawings = async (): Promise<SavedDrawing[]> => {
  try {
    let allDrawings: SavedDrawing[] = [];
    
    // Try to get drawings from backend first
    try {
      const isHealthy = await drawingApi.isHealthy();
      if (isHealthy) {
        const backendDrawings = await drawingApi.getDrawings();
        allDrawings = [...backendDrawings];
        console.log(`Loaded ${backendDrawings.length} drawings from backend`);
      }
    } catch (error) {
      console.warn('Failed to load drawings from backend:', error);
    }
    
    // Get local drawings
    const localIndex = await getDrawingsIndexLocal();
    const localDrawings: SavedDrawing[] = [];
    
    for (const drawing of localIndex) {
      // Skip if this drawing is already loaded from backend
      if (drawing.stateUri.startsWith('api:')) {
        continue;
      }
      
      try {
        const previewFile = new File(drawing.previewUri);
        
        if (previewFile.exists) {
          const stateFile = new File(drawing.stateUri);
          
          localDrawings.push({
            ...drawing,
            hasState: stateFile.exists,
          });
        }
      } catch (error) {
        console.warn(`Local drawing ${drawing.id} files not accessible, skipping`);
      }
    }
    
    // Combine backend and local drawings
    allDrawings = [...allDrawings, ...localDrawings];
    
    // Remove duplicates (prefer backend version)
    const uniqueDrawings = allDrawings.reduce((acc, drawing) => {
      const existing = acc.find(d => d.id === drawing.id);
      if (!existing) {
        acc.push(drawing);
      } else if (drawing.stateUri.startsWith('api:') && !existing.stateUri.startsWith('api:')) {
        // Replace local with backend version
        const index = acc.findIndex(d => d.id === drawing.id);
        acc[index] = drawing;
      }
      return acc;
    }, [] as SavedDrawing[]);
    
    // Update local index with merged results
    await saveDrawingsIndexLocal(uniqueDrawings);
    
    // Sort by updatedAt descending (newest first)
    return uniqueDrawings.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error('Error getting saved drawings:', error);
    return [];
  }
};

// Legacy exports for backward compatibility
export const saveDrawingState = saveDrawingStateLocal;
export const savePreviewImage = savePreviewImageLocal;