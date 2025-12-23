// Drawing state types and utilities

// Transform matrix for zoom/pan/move
export interface Transform {
  translateX: number;
  translateY: number;
  scale: number;
}

// Unified canvas item model
export interface CanvasItem {
  id: string;
  type: 'path' | 'shape' | 'text';
  data: any; // Specific data for each type
  strokeColor: string;
  fillColor?: string;
  strokeWidth: number;
  transform: Transform;
  selected?: boolean;
}

// Path-specific data
export interface PathData {
  d: string; // SVG path string
}

// Shape-specific data
export interface ShapeData {
  shape: 'line' | 'rect' | 'square' | 'circle';
  x: number;
  y: number;
  width: number;
  height: number;
  x2?: number; // For line end point
  y2?: number;
}

// Text-specific data
export interface TextData {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily?: string;
}

// Legacy type for backward compatibility
export type CanvasElement = CanvasItem;

// Drawing state interface
export interface DrawingState {
  items: CanvasItem[];
  backgroundColor: string;
  canvasWidth: number;
  canvasHeight: number;
  canvasTransform: Transform;
  version: string;
  createdAt: number;
  updatedAt: number;
}

// History state for undo/redo
export interface HistoryState {
  items: CanvasItem[];
  backgroundColor: string;
  canvasTransform: Transform;
}

// Generate unique ID for elements
export const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Create initial drawing state
export const createInitialState = (width: number, height: number, backgroundColor: string): DrawingState => {
  return {
    items: [],
    backgroundColor,
    canvasWidth: width,
    canvasHeight: height,
    canvasTransform: { translateX: 0, translateY: 0, scale: 1 },
    version: '2.0.0',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
};

// Create history state from current state
export const createHistoryState = (items: CanvasItem[], backgroundColor: string, canvasTransform: Transform): HistoryState => {
  return {
    items: JSON.parse(JSON.stringify(items)), // Deep copy
    backgroundColor,
    canvasTransform: { ...canvasTransform },
  };
};

// Create default transform
export const createDefaultTransform = (): Transform => ({
  translateX: 0,
  translateY: 0,
  scale: 1,
});

// Helper functions for canvas items
export const createPathItem = (
  pathData: string,
  strokeColor: string,
  strokeWidth: number,
  fillColor?: string
): CanvasItem => ({
  id: generateId(),
  type: 'path',
  data: { d: pathData } as PathData,
  strokeColor,
  fillColor,
  strokeWidth,
  transform: createDefaultTransform(),
});

export const createShapeItem = (
  shape: ShapeData['shape'],
  x: number,
  y: number,
  width: number,
  height: number,
  strokeColor: string,
  strokeWidth: number,
  fillColor?: string,
  x2?: number,
  y2?: number
): CanvasItem => ({
  id: generateId(),
  type: 'shape',
  data: { shape, x, y, width, height, x2, y2 } as ShapeData,
  strokeColor,
  fillColor,
  strokeWidth,
  transform: createDefaultTransform(),
});

export const createTextItem = (
  text: string,
  x: number,
  y: number,
  color: string,
  fontSize: number = 16
): CanvasItem => ({
  id: generateId(),
  type: 'text',
  data: { text, x, y, fontSize } as TextData,
  strokeColor: color,
  strokeWidth: 1,
  transform: createDefaultTransform(),
});

// Validate canvas item
export const isValidCanvasItem = (item: any): item is CanvasItem => {
  if (!item || typeof item !== 'object' || !item.id || !item.type) {
    return false;
  }

  const hasValidTransform = item.transform && 
    typeof item.transform.translateX === 'number' &&
    typeof item.transform.translateY === 'number' &&
    typeof item.transform.scale === 'number';

  if (!hasValidTransform) return false;

  switch (item.type) {
    case 'path':
      return item.data && typeof item.data.d === 'string' && 
             typeof item.strokeColor === 'string' && 
             typeof item.strokeWidth === 'number';
    
    case 'shape':
      return item.data && 
             ['line', 'rect', 'square', 'circle'].includes(item.data.shape) &&
             typeof item.data.x === 'number' &&
             typeof item.data.y === 'number' &&
             typeof item.strokeColor === 'string';
    
    case 'text':
      return item.data && 
             typeof item.data.text === 'string' &&
             typeof item.data.x === 'number' &&
             typeof item.data.y === 'number' &&
             typeof item.strokeColor === 'string';
    
    default:
      return false;
  }
};

// Validate drawing state
export const isValidDrawingState = (state: any): state is DrawingState => {
  return state &&
         typeof state === 'object' &&
         Array.isArray(state.items) &&
         state.items.every(isValidCanvasItem) &&
         typeof state.backgroundColor === 'string' &&
         typeof state.canvasWidth === 'number' &&
         typeof state.canvasHeight === 'number' &&
         typeof state.version === 'string' &&
         typeof state.createdAt === 'number' &&
         typeof state.updatedAt === 'number';
};