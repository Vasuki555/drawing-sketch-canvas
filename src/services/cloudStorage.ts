import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  updateDoc 
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { DrawingState, SavedDrawing } from '../types/Drawing';

const DRAWINGS_COLLECTION = 'drawings';

export interface CloudDrawing {
  id: string;
  name: string;
  userId: string;
  previewUri: string;
  drawingState: DrawingState;
  createdAt: number;
  updatedAt: number;
}

// Check if Firebase is properly configured
const isFirebaseConfigured = (): boolean => {
  try {
    return !!(db && auth);
  } catch (error) {
    console.warn('Firebase not configured:', error);
    return false;
  }
};

export class CloudStorageService {
  // Save drawing to Firestore
  static async saveDrawing(
    userId: string, 
    drawingId: string, 
    name: string, 
    previewUri: string, 
    drawingState: DrawingState
  ): Promise<void> {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase is not configured. Please set up your Firebase project.');
    }

    try {
      const drawingRef = doc(db, DRAWINGS_COLLECTION, drawingId);
      
      // Sanitize drawingState to remove undefined values
      const sanitizedDrawingState = {
        id: drawingState.id || drawingId,
        name: drawingState.name || name,
        userId: userId,
        elements: drawingState.elements || [],
        backgroundColor: drawingState.backgroundColor || '#ffffff',
        canvasTransform: drawingState.canvasTransform || { translateX: 0, translateY: 0, scale: 1 },
        canvasWidth: drawingState.canvasWidth || 800,
        canvasHeight: drawingState.canvasHeight || 600,
        version: drawingState.version || '1.0.0',
        createdAt: drawingState.createdAt || Date.now(),
        updatedAt: Date.now()
      };
      
      const cloudDrawing: CloudDrawing = {
        id: drawingId,
        name: name || 'Untitled Drawing',
        userId: userId,
        previewUri: previewUri || '',
        drawingState: sanitizedDrawingState,
        createdAt: sanitizedDrawingState.createdAt,
        updatedAt: sanitizedDrawingState.updatedAt
      };

      await setDoc(drawingRef, cloudDrawing);
    } catch (error) {
      console.error('Error saving drawing to cloud:', error);
      throw new Error('Failed to save drawing to cloud');
    }
  }

  // Get all drawings for a user
  static async getUserDrawings(userId: string): Promise<SavedDrawing[]> {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase is not configured. Please set up your Firebase project.');
    }

    try {
      const drawingsQuery = query(
        collection(db, DRAWINGS_COLLECTION),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(drawingsQuery);
      const drawings: SavedDrawing[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as CloudDrawing;
        drawings.push({
          id: data.id,
          name: data.name,
          userId: data.userId,
          previewUri: data.previewUri,
          stateUri: '', // We store state directly in Firestore
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          hasState: true
        });
      });

      return drawings;
    } catch (error) {
      console.error('Error fetching user drawings:', error);
      throw new Error('Failed to fetch drawings from cloud');
    }
  }

  // Get a specific drawing
  static async getDrawing(drawingId: string, userId: string): Promise<DrawingState | null> {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase is not configured. Please set up your Firebase project.');
    }

    try {
      const drawingRef = doc(db, DRAWINGS_COLLECTION, drawingId);
      const drawingSnap = await getDoc(drawingRef);

      if (!drawingSnap.exists()) {
        return null;
      }

      const data = drawingSnap.data() as CloudDrawing;
      
      // Verify the drawing belongs to the user
      if (data.userId !== userId) {
        throw new Error('Unauthorized access to drawing');
      }

      return data.drawingState;
    } catch (error) {
      console.error('Error fetching drawing:', error);
      throw new Error('Failed to fetch drawing from cloud');
    }
  }

  // Delete a drawing
  static async deleteDrawing(drawingId: string, userId: string): Promise<void> {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase is not configured. Please set up your Firebase project.');
    }

    try {
      const drawingRef = doc(db, DRAWINGS_COLLECTION, drawingId);
      
      // First verify the drawing belongs to the user
      const drawingSnap = await getDoc(drawingRef);
      if (!drawingSnap.exists()) {
        throw new Error('Drawing not found');
      }

      const data = drawingSnap.data() as CloudDrawing;
      if (data.userId !== userId) {
        throw new Error('Unauthorized access to drawing');
      }

      await deleteDoc(drawingRef);
    } catch (error) {
      console.error('Error deleting drawing:', error);
      throw new Error('Failed to delete drawing from cloud');
    }
  }

  // Update drawing name/title
  static async updateDrawingName(drawingId: string, userId: string, newName: string): Promise<void> {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase is not configured. Please set up your Firebase project.');
    }

    try {
      const drawingRef = doc(db, DRAWINGS_COLLECTION, drawingId);
      
      // First verify the drawing belongs to the user
      const drawingSnap = await getDoc(drawingRef);
      if (!drawingSnap.exists()) {
        throw new Error('Drawing not found');
      }

      const data = drawingSnap.data() as CloudDrawing;
      if (data.userId !== userId) {
        throw new Error('Unauthorized access to drawing');
      }

      await updateDoc(drawingRef, {
        name: newName,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error('Error updating drawing name:', error);
      throw new Error('Failed to update drawing name');
    }
  }
}