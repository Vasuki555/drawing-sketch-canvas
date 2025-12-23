// API service for backend integration
import { DrawingState, SavedDrawing } from '../types/Drawing';
import API_CONFIG from '../config/api';

// Configuration
const API_BASE_URL = API_CONFIG.BASE_URL;
const API_TIMEOUT = API_CONFIG.TIMEOUT;

// API Response types
interface ApiDrawingResponse {
  id: string;
  name: string;
  preview_image: string;
  canvas_state: DrawingState;
  created_at: string;
  updated_at: string;
}

interface ApiCreateDrawingRequest {
  name: string;
  preview_image: string;
  canvas_state: DrawingState;
}

interface ApiUpdateDrawingRequest {
  name?: string;
  preview_image?: string;
  canvas_state?: DrawingState;
}

// Utility function to convert base64 to data URI
const ensureDataUri = (base64String: string): string => {
  if (base64String.startsWith('data:')) {
    return base64String;
  }
  return `data:image/png;base64,${base64String}`;
};

// Utility function to extract base64 from data URI
const extractBase64 = (dataUri: string): string => {
  if (dataUri.startsWith('data:')) {
    return dataUri.split(',')[1] || dataUri;
  }
  return dataUri;
};

// API service class
class DrawingApiService {
  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    // Check if backend integration is enabled
    if (!API_CONFIG.ENABLED) {
      throw new Error('Backend integration is disabled');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async createDrawing(
    name: string,
    previewImageUri: string,
    canvasState: DrawingState
  ): Promise<SavedDrawing> {
    try {
      const requestData: ApiCreateDrawingRequest = {
        name,
        preview_image: extractBase64(previewImageUri),
        canvas_state: canvasState,
      };

      const response = await this.fetchWithTimeout(`${API_BASE_URL}/drawings`, {
        method: 'POST',
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ApiDrawingResponse = await response.json();

      return {
        id: data.id,
        name: data.name,
        previewUri: ensureDataUri(data.preview_image),
        stateUri: `api:${data.id}`, // Special URI to indicate API storage
        createdAt: new Date(data.created_at).getTime(),
        updatedAt: new Date(data.updated_at).getTime(),
        hasState: true,
      };
    } catch (error) {
      console.error('Failed to create drawing via API:', error);
      throw new Error(`Failed to save drawing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getDrawings(): Promise<SavedDrawing[]> {
    try {
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/drawings`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ApiDrawingResponse[] = await response.json();

      return data.map(drawing => ({
        id: drawing.id,
        name: drawing.name,
        previewUri: ensureDataUri(drawing.preview_image),
        stateUri: `api:${drawing.id}`,
        createdAt: new Date(drawing.created_at).getTime(),
        updatedAt: new Date(drawing.updated_at).getTime(),
        hasState: true,
      }));
    } catch (error) {
      console.error('Failed to get drawings via API:', error);
      throw new Error(`Failed to load drawings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getDrawing(id: string): Promise<DrawingState> {
    try {
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/drawings/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Drawing not found');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ApiDrawingResponse = await response.json();
      return data.canvas_state;
    } catch (error) {
      console.error('Failed to get drawing via API:', error);
      throw new Error(`Failed to load drawing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateDrawing(
    id: string,
    name?: string,
    previewImageUri?: string,
    canvasState?: DrawingState
  ): Promise<SavedDrawing> {
    try {
      const requestData: ApiUpdateDrawingRequest = {};

      if (name !== undefined) {
        requestData.name = name;
      }
      if (previewImageUri !== undefined) {
        requestData.preview_image = extractBase64(previewImageUri);
      }
      if (canvasState !== undefined) {
        requestData.canvas_state = canvasState;
      }

      const response = await this.fetchWithTimeout(`${API_BASE_URL}/drawings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Drawing not found');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ApiDrawingResponse = await response.json();

      return {
        id: data.id,
        name: data.name,
        previewUri: ensureDataUri(data.preview_image),
        stateUri: `api:${data.id}`,
        createdAt: new Date(data.created_at).getTime(),
        updatedAt: new Date(data.updated_at).getTime(),
        hasState: true,
      };
    } catch (error) {
      console.error('Failed to update drawing via API:', error);
      throw new Error(`Failed to update drawing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteDrawing(id: string): Promise<void> {
    try {
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/drawings/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Drawing not found');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to delete drawing via API:', error);
      throw new Error(`Failed to delete drawing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    if (!API_CONFIG.ENABLED) {
      return false;
    }
    
    try {
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const drawingApi = new DrawingApiService();
export default drawingApi;