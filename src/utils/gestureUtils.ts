// Gesture utilities for canvas interactions

import { Transform, CanvasItem } from './drawingState';
import { Platform } from 'react-native';

// Get pointer coordinates - unified helper for web and native
export const getPoint = (evt: any, canvasRef?: any): { x: number; y: number } => {
  if (Platform.OS === 'web') {
    // Web-specific pointer handling
    const rect = canvasRef?.current?.getBoundingClientRect() || evt.target.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top,
    };
  }
  
  // Native touch handling - use locationX/locationY which are relative to the receiving view
  return {
    x: evt.nativeEvent.locationX || 0,
    y: evt.nativeEvent.locationY || 0,
  };
};

// Check if a point is inside a canvas item
export const isPointInItem = (x: number, y: number, item: CanvasItem): boolean => {
  const { data, transform } = item;
  
  // Apply inverse transform to get local coordinates
  const localX = (x - transform.translateX) / transform.scale;
  const localY = (y - transform.translateY) / transform.scale;

  switch (item.type) {
    case 'shape':
      const shapeData = data;
      if (shapeData.shape === 'line') {
        // Line hit detection with tolerance
        const tolerance = Math.max(item.strokeWidth * 2, 15);
        return distanceToLine(localX, localY, shapeData.x, shapeData.y, shapeData.x2 || 0, shapeData.y2 || 0) <= tolerance;
      } else if (shapeData.shape === 'circle') {
        const centerX = shapeData.x + shapeData.width / 2;
        const centerY = shapeData.y + shapeData.height / 2;
        const radius = Math.min(shapeData.width, shapeData.height) / 2;
        const distance = Math.sqrt((localX - centerX) ** 2 + (localY - centerY) ** 2);
        return distance <= radius + item.strokeWidth;
      } else {
        // Rectangle, square - expand hit area by stroke width
        const tolerance = item.strokeWidth / 2;
        return localX >= shapeData.x - tolerance && 
               localX <= shapeData.x + shapeData.width + tolerance &&
               localY >= shapeData.y - tolerance && 
               localY <= shapeData.y + shapeData.height + tolerance;
      }

    case 'text':
      const textData = data;
      // Approximate text bounds with better estimation
      const textWidth = textData.text.length * textData.fontSize * 0.6;
      const textHeight = textData.fontSize * 1.2;
      const tolerance = 10; // Extra padding for easier text selection
      return localX >= textData.x - tolerance && 
             localX <= textData.x + textWidth + tolerance &&
             localY >= textData.y - textHeight - tolerance && 
             localY <= textData.y + tolerance;

    case 'path':
      // For paths, use a simplified bounding box approach with path parsing
      const pathData = data as any;
      if (pathData.d) {
        // Extract coordinates from path string
        const coords = extractPathCoordinates(pathData.d);
        if (coords.length === 0) return false;
        
        // Check if point is near any segment of the path
        const tolerance = Math.max(item.strokeWidth * 2, 10);
        
        for (let i = 0; i < coords.length - 1; i++) {
          const dist = distanceToLine(localX, localY, coords[i].x, coords[i].y, coords[i + 1].x, coords[i + 1].y);
          if (dist <= tolerance) {
            return true;
          }
        }
        
        // Also check individual points for very short paths
        for (const coord of coords) {
          const dist = Math.sqrt((localX - coord.x) ** 2 + (localY - coord.y) ** 2);
          if (dist <= tolerance) {
            return true;
          }
        }
      }
      return false;
  }

  return false;
};

// Extract coordinates from SVG path string
export const extractPathCoordinates = (pathString: string): { x: number; y: number }[] => {
  const coords: { x: number; y: number }[] = [];
  
  // Simple regex to extract numbers from path
  const numbers = pathString.match(/[-+]?[0-9]*\.?[0-9]+/g);
  if (!numbers) return coords;
  
  // Parse coordinates in pairs
  for (let i = 0; i < numbers.length - 1; i += 2) {
    const x = parseFloat(numbers[i]);
    const y = parseFloat(numbers[i + 1]);
    if (!isNaN(x) && !isNaN(y)) {
      coords.push({ x, y });
    }
  }
  
  return coords;
};

// Distance from point to line segment
const distanceToLine = (px: number, py: number, x1: number, y1: number, x2: number, y2: number): number => {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) {
    // Line is actually a point
    return Math.sqrt(A * A + B * B);
  }

  let param = dot / lenSq;
  
  let xx, yy;
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;
  return Math.sqrt(dx * dx + dy * dy);
};

// Apply transform to canvas coordinates
export const applyTransform = (x: number, y: number, transform: Transform): { x: number; y: number } => {
  return {
    x: x * transform.scale + transform.translateX,
    y: y * transform.scale + transform.translateY,
  };
};

// Apply inverse transform to screen coordinates
export const applyInverseTransform = (x: number, y: number, transform: Transform): { x: number; y: number } => {
  return {
    x: (x - transform.translateX) / transform.scale,
    y: (y - transform.translateY) / transform.scale,
  };
};

// Constrain zoom scale
export const constrainScale = (scale: number, minScale: number = 0.1, maxScale: number = 5): number => {
  return Math.max(minScale, Math.min(maxScale, scale));
};

// Check if path is closed (for fill detection)
export const isPathClosed = (pathData: string): boolean => {
  return pathData.trim().toUpperCase().endsWith('Z');
};

// Get bounding box of a canvas item
export const getItemBounds = (item: CanvasItem): { x: number; y: number; width: number; height: number } => {
  const { data, transform } = item;

  let bounds = { x: 0, y: 0, width: 0, height: 0 };

  switch (item.type) {
    case 'shape':
      const shapeData = data;
      if (shapeData.shape === 'line') {
        const x1 = Math.min(shapeData.x, shapeData.x2 || 0);
        const y1 = Math.min(shapeData.y, shapeData.y2 || 0);
        const x2 = Math.max(shapeData.x, shapeData.x2 || 0);
        const y2 = Math.max(shapeData.y, shapeData.y2 || 0);
        bounds = { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
      } else {
        bounds = { x: shapeData.x, y: shapeData.y, width: shapeData.width, height: shapeData.height };
      }
      break;

    case 'text':
      const textData = data;
      const textWidth = textData.text.length * textData.fontSize * 0.6;
      const textHeight = textData.fontSize * 1.2;
      bounds = { x: textData.x, y: textData.y - textHeight, width: textWidth, height: textHeight };
      break;

    case 'path':
      // For paths, we'd need to parse the SVG path data to get accurate bounds
      // This is a simplified version
      bounds = { x: 0, y: 0, width: 100, height: 100 };
      break;
  }

  // Apply transform
  return {
    x: bounds.x * transform.scale + transform.translateX,
    y: bounds.y * transform.scale + transform.translateY,
    width: bounds.width * transform.scale,
    height: bounds.height * transform.scale,
  };
};