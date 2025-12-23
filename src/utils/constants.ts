// Constants for the Drawing & Sketch Canvas App

// Color palette - 25+ solid colors
export const COLORS = [
  // Basic colors
  '#000000', // Black
  '#FFFFFF', // White
  '#808080', // Gray
  '#C0C0C0', // Light Gray
  '#404040', // Dark Gray
  
  // Warm colors
  '#FF0000', // Red
  '#FF4500', // Orange Red
  '#FFA500', // Orange
  '#FFD700', // Gold
  '#FFFF00', // Yellow
  '#ADFF2F', // Green Yellow
  '#FF69B4', // Hot Pink
  '#FF1493', // Deep Pink
  '#DC143C', // Crimson
  
  // Cool colors
  '#0000FF', // Blue
  '#00BFFF', // Deep Sky Blue
  '#87CEEB', // Sky Blue
  '#00FFFF', // Cyan
  '#00FF7F', // Spring Green
  '#00FF00', // Lime
  '#32CD32', // Lime Green
  '#008000', // Green
  '#006400', // Dark Green
  '#4B0082', // Indigo
  '#8A2BE2', // Blue Violet
  '#9400D3', // Violet
  '#800080', // Purple
  '#8B4513', // Saddle Brown
  '#A0522D', // Sienna
  '#D2691E', // Chocolate
];

// Background colors
export const BACKGROUND_COLORS = [
  '#FFFFFF', // White
  '#F5F5F5', // White Smoke
  '#E6E6FA', // Lavender
  '#F0F8FF', // Alice Blue
  '#F5FFFA', // Mint Cream
  '#FFF8DC', // Cornsilk
  '#FFFACD', // Lemon Chiffon
  '#FFE4E1', // Misty Rose
];

// Drawing settings
export const BRUSH_SIZE_MIN = 1;
export const BRUSH_SIZE_MAX = 50;
export const ERASER_SIZE_MIN = 5;
export const ERASER_SIZE_MAX = 50;

// Tool types
export type Tool = 'brush' | 'eraser' | 'line' | 'rect' | 'square' | 'circle' | 'text' | 'fill';

// Color modes
export type ColorMode = 'stroke' | 'fill' | 'text';

// Default settings
export const DEFAULT_BRUSH_SIZE = 5;
export const DEFAULT_ERASER_SIZE = 10;
export const DEFAULT_BACKGROUND_COLOR = '#FFFFFF';
export const DEFAULT_STROKE_COLOR = '#000000';
export const DEFAULT_TEXT_SIZE = 16;

// File paths
export const DRAWINGS_FOLDER = 'drawings';
export const PREVIEW_FILENAME = 'preview.png';
export const STATE_FILENAME = 'state.json';

// Auto-save settings
export const AUTO_SAVE_DELAY = 3000; // 3 seconds of inactivity

// Animation settings
export const SPLASH_DURATION = 5000; // 5 seconds