// Save drawing utilities with Firebase cloud storage integration

import { Paths, File, Directory } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawingState, SavedDrawing } from '../types/Drawing';
import { drawingApi } from '../services/api';
import { CloudStorageService } from '../services/cloudStorage';

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

// Save complete drawing with Firebase cloud storage integration
export const saveDrawing = async (
  drawingId: string,
  name: string,
  previewImageUri: string,
  state: DrawingState,
  userId?: string
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
    let useCloud = false;

    // Try Firebase cloud storage first if user is authenticated
    if (userId) {
      try {
        await CloudStorageService.saveDrawing(userId, drawingId, name, previewImageUri, state);
        
        savedDrawing = {
          id: drawingId,
          name,
          userId,
          previewUri: previewImageUri,
          stateUri: 'cloud:' + drawingId, // Indicate this is stored in cloud
          createdAt: state.createdAt,
          updatedAt: Date.now(),
          hasState: true,
        };
        
        useCloud = true;
        console.log(`Successfully saved drawing to Firebase: ${drawingId}`);
      } catch (error) {
        console.warn('Firebase save failed, trying backend:', error);
      }
    }

    // Try backend if cloud failed or user not authenticated
    if (!useCloud) {
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
          
          console.log(`Successfully saved drawing to backend: ${drawingId}`);
        }
      } catch (error) {
        console.warn('Backend save failed, falling back to local storage:', error);
      }
    }

    // Fallback to local storage if both cloud and backend failed
    if (!savedDrawing) {
      const previewUri = await savePreviewImageLocal(drawingId, previewImageUri);
      const stateUri = await saveDrawingStateLocal(drawingId, state);
      
      const index = await getDrawingsIndexLocal();
      const existingIndex = index.findIndex(d => d.id === drawingId);
      
      savedDrawing = {
        id: drawingId,
        name,
        userId,
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

// Delete drawing with Firebase cloud storage integration
export const deleteDrawing = async (drawingId: string, userId?: string): Promise<void> => {
  try {
    const localIndex = await getDrawingsIndexLocal();
    const drawing = localIndex.find(d => d.id === drawingId);
    
    // Try Firebase cloud deletion if drawing is stored in cloud
    if (drawing && drawing.stateUri.startsWith('cloud:') && userId) {
      try {
        await CloudStorageService.deleteDrawing(drawingId, userId);
        console.log(`Successfully deleted drawing from Firebase: ${drawingId}`);
      } catch (error) {
        console.warn('Firebase delete failed:', error);
      }
    }
    
    // Try backend deletion if drawing is stored in backend
    else if (drawing && drawing.stateUri.startsWith('api:')) {
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

// Get all saved drawings with Firebase cloud storage integration
export const getSavedDrawings = async (userId?: string): Promise<SavedDrawing[]> => {
  try {
    let allDrawings: SavedDrawing[] = [];
    
    // Try to get drawings from Firebase cloud first if user is authenticated
    if (userId) {
      try {
        const cloudDrawings = await CloudStorageService.getUserDrawings(userId);
        allDrawings = [...cloudDrawings];
        console.log(`Loaded ${cloudDrawings.length} drawings from Firebase`);
      } catch (error) {
        console.warn('Failed to load drawings from Firebase:', error);
      }
    }
    
    // Try to get drawings from backend
    if (allDrawings.length === 0) {
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
    }
    
    // Get local drawings
    const localIndex = await getDrawingsIndexLocal();
    const localDrawings: SavedDrawing[] = [];
    
    for (const drawing of localIndex) {
      // Skip if this drawing is already loaded from cloud or backend
      if (drawing.stateUri.startsWith('cloud:') || drawing.stateUri.startsWith('api:')) {
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
    
    // Combine cloud, backend and local drawings
    allDrawings = [...allDrawings, ...localDrawings];
    
    // Remove duplicates (prefer cloud > backend > local)
    const uniqueDrawings = allDrawings.reduce((acc, drawing) => {
      const existing = acc.find(d => d.id === drawing.id);
      if (!existing) {
        acc.push(drawing);
      } else if (drawing.stateUri.startsWith('cloud:') && !existing.stateUri.startsWith('cloud:')) {
        // Replace backend/local with cloud version
        const index = acc.findIndex(d => d.id === drawing.id);
        acc[index] = drawing;
      } else if (drawing.stateUri.startsWith('api:') && !existing.stateUri.startsWith('cloud:') && !existing.stateUri.startsWith('api:')) {
        // Replace local with backend version
        const index = acc.findIndex(d => d.id === drawing.id);
        acc[index] = drawing;
      }
      return acc;
    }, [] as SavedDrawing[]);
    
    // Update local index with merged results
    await saveDrawingsIndexLocal(uniqueDrawings);
    
    // Sort by updatedAt descending (newest first), with fallback to createdAt
    return uniqueDrawings.sort((a, b) => {
      const aTimestamp = a.updatedAt ?? a.createdAt;
      const bTimestamp = b.updatedAt ?? b.createdAt;
      return bTimestamp - aTimestamp; // Descending order (newest first)
    });
  } catch (error) {
    console.error('Error getting saved drawings:', error);
    return [];
  }
};

// Legacy exports for backward compatibility
export const saveDrawingState = saveDrawingStateLocal;
export const savePreviewImage = savePreviewImageLocal;
export { saveDrawingsIndexLocal };