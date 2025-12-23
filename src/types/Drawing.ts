// Drawing types for the mobile drawing app

export interface Point {
  x: number;
  y: number;
}

export interface Transform {
  translateX: number;
  translateY: number;
  scale: number;
}

export type ToolType = 'brush' | 'eraser' | 'line' | 'rect' | 'square' | 'circle' | 'ellipse' | 'star' | 'text' | 'fill';

export interface DrawingElement {
  id: string;
  type: 'path' | 'shape' | 'text';
  data: any;
  strokeColor: string;
  fillColor?: string;
  strokeWidth: number;
  transform: Transform;
  timestamp: number;
  isEraser?: boolean; // Flag to indicate if this is an eraser stroke
}

export interface PathElement extends DrawingElement {
  type: 'path';
  data: {
    d: string; // SVG path string
  };
}

export interface ShapeElement extends DrawingElement {
  type: 'shape';
  data: {
    shape: 'line' | 'rect' | 'square' | 'circle' | 'ellipse' | 'star';
    x: number;
    y: number;
    width: number;
    height: number;
    x2?: number; // For lines
    y2?: number;
  };
}

export interface TextElement extends DrawingElement {
  type: 'text';
  data: {
    text: string;
    x: number;
    y: number;
    fontSize: number;
    fontFamily?: string;
  };
}

export interface DrawingState {
  id: string;
  name: string;
  elements: DrawingElement[];
  backgroundColor: string;
  canvasTransform: Transform;
  canvasWidth: number;
  canvasHeight: number;
  version: string;
  createdAt: number;
  updatedAt: number;
}

export interface SavedDrawing {
  id: string;
  name: string;
  previewUri: string;
  stateUri: string;
  createdAt: number;
  updatedAt: number;
  hasState: boolean;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  defaultBackgroundColor: string;
  autoSave: boolean;
  defaultBrushSize: number;
  defaultEraserSize: number;
}