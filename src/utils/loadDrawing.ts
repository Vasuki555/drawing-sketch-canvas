// Load drawing utilities with Firebase cloud storage integration

import { File } from 'expo-file-system';
import { DrawingState } from '../types/Drawing';
import { drawingApi } from '../services/api';
import { CloudStorageService } from '../services/cloudStorage';

// Validate drawing state
const isValidDrawingState = (state: any): state is DrawingState => {
  return state &&
         typeof state === 'object' &&
         Array.isArray(state.elements) &&
         typeof state.backgroundColor === 'string' &&
         typeof state.canvasWidth === 'number' &&
         typeof state.canvasHeight === 'number' &&
         typeof state.version === 'string' &&
         typeof state.createdAt === 'number' &&
         typeof state.updatedAt === 'number';
};

// Load drawing state from JSON file, API, or Firebase cloud
export const loadDrawingState = async (stateUri: string, userId?: string): Promise<DrawingState | null> => {
  try {
    // Check if this is a Firebase cloud-stored drawing
    if (stateUri.startsWith('cloud:')) {
      const drawingId = stateUri.replace('cloud:', '');
      
      if (!userId) {
        console.warn('User ID required for loading cloud drawing');
        return null;
      }
      
      try {
        const state = await CloudStorageService.getDrawing(drawingId, userId);
        
        if (!state) {
          console.warn('Drawing not found in cloud');
          return null;
        }
        
        if (!isValidDrawingState(state)) {
          console.warn('Invalid drawing state format from cloud');
          return null;
        }
        
        return state;
      } catch (error) {
        console.error('Error loading drawing state from cloud:', error);
        return null;
      }
    }
    
    // Check if this is an API-stored drawing
    if (stateUri.startsWith('api:')) {
      const drawingId = stateUri.replace('api:', '');
      
      try {
        const isHealthy = await drawingApi.isHealthy();
        if (isHealthy) {
          const state = await drawingApi.getDrawing(drawingId);
          
          if (!isValidDrawingState(state)) {
            console.warn('Invalid drawing state format from API');
            return null;
          }
          
          return state;
        } else {
          console.warn('Backend not available for loading drawing');
          return null;
        }
      } catch (error) {
        console.error('Error loading drawing state from API:', error);
        return null;
      }
    }
    
    // Load from local file
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

// Create default transform
export const createDefaultTransform = () => ({
  translateX: 0,
  translateY: 0,
  scale: 1,
});

// Generate unique ID
export const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};