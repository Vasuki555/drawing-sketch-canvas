import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Dimensions,
  Alert,
  StatusBar,
  GestureResponderEvent,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

import { DrawingState, DrawingElement, ToolType, Transform } from '../types/Drawing';
import { saveDrawing } from '../utils/saveDrawing';
import { loadDrawingState, generateId, createDefaultTransform } from '../utils/loadDrawing';
import { SOLID_COLORS, DEFAULT_STROKE_COLOR } from '../constants/colors';
import { getPoint, isPathClosed } from '../utils/gestureUtils';
import { useSettings } from '../contexts/SettingsContext';
import Canvas, { CanvasRef } from '../components/Canvas';
import Toolbar from '../components/ToolBar';
import TopBar from '../components/TopBar';
import SettingsPanel from '../components/SettingsPanel';
import TextInputModal from '../components/TextInputModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CanvasScreenProps {
  navigation: any;
  route: any;
}

const CanvasScreen: React.FC<CanvasScreenProps> = ({ navigation, route }) => {
  // Get settings from context
  const { settings, theme } = useSettings();
  
  // Route params for edit mode
  const editMode = route?.params?.editMode || false;
  const drawingId = route?.params?.drawingId;
  const stateUri = route?.params?.stateUri;

  // Canvas state
  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [backgroundColor, setBackgroundColor] = useState(settings.defaultBackgroundColor);
  const [canvasTransform, setCanvasTransform] = useState<Transform>(createDefaultTransform());
  
  // Tool state - use settings for defaults
  const [selectedTool, setSelectedTool] = useState<ToolType>('brush');
  const [strokeColor, setStrokeColor] = useState(DEFAULT_STROKE_COLOR);
  const [brushSize, setBrushSize] = useState(settings.defaultBrushSize);
  const [eraserSize, setEraserSize] = useState(settings.defaultEraserSize);
  const [textSize, setTextSize] = useState(16);

  // Clear selection when switching tools
  const handleToolChange = useCallback((tool: ToolType) => {
    setSelectedTool(tool);
    setSelectedElementId(null); // Clear selection when switching tools
  }, []);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentShape, setCurrentShape] = useState<DrawingElement | null>(null);
  const [isErasing, setIsErasing] = useState(false);
  const [eraserPosition, setEraserPosition] = useState<{ x: number; y: number } | null>(null);
  const [eraserPressure, setEraserPressure] = useState(1); // For pressure-sensitive erasing
  const [lastEraserPosition, setLastEraserPosition] = useState<{ x: number; y: number } | null>(null);
  const [eraserAnimationScale, setEraserAnimationScale] = useState(1);
  const [currentEraserPath, setCurrentEraserPath] = useState<string | null>(null);
  
  // Selection and movement state
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragStartPosition, setDragStartPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Shape resize state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<'tl' | 'tr' | 'bl' | 'br' | null>(null);
  const [resizeStartBounds, setResizeStartBounds] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Zoom and pan - enhanced for better functionality
  const [isZooming, setIsZooming] = useState(false);
  const [initialDistance, setInitialDistance] = useState(0);
  const [initialScale, setInitialScale] = useState(1);
  const [initialCenter, setInitialCenter] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  // Text editing
  const [showTextModal, setShowTextModal] = useState(false);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textInputPosition, setTextInputPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Text-specific state for selected text
  const [selectedTextColor, setSelectedTextColor] = useState<string | null>(null);
  const [selectedTextSize, setSelectedTextSize] = useState<number | null>(null);
  const [isEditingTextContent, setIsEditingTextContent] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [lastTapElementId, setLastTapElementId] = useState<string | null>(null);
  
  // Shape-specific state for selected shape
  const [selectedShapeWidth, setSelectedShapeWidth] = useState<number | null>(null);
  const [selectedShapeHeight, setSelectedShapeHeight] = useState<number | null>(null);
  
  // Eraser batching state for undo/redo optimization
  const [eraserBatchTimeout, setEraserBatchTimeout] = useState<NodeJS.Timeout | null>(null);

  // UI state
  const [showSettings, setShowSettings] = useState(false);

  // History for undo/redo
  const [history, setHistory] = useState<DrawingState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Refs
  const canvasRef = useRef<CanvasRef>(null);
  const canvasViewRef = useRef<View>(null);

  // Initialize canvas
  useEffect(() => {
    const initializeCanvas = async () => {
      if (editMode && stateUri) {
        try {
          const state = await loadDrawingState(stateUri);
          if (state) {
            setElements(state.elements);
            setBackgroundColor(state.backgroundColor); // Keep existing drawing's background
            // Always reset zoom when loading a drawing
            setCanvasTransform({ scale: 1, translateX: 0, translateY: 0 });
            
            // Initialize history
            setHistory([state]);
            setHistoryIndex(0);
          }
        } catch (error) {
          console.error('Error loading drawing state:', error);
          Alert.alert('Error', 'Failed to load drawing. Starting with blank canvas.');
        }
      } else {
        // For new drawings, use settings defaults
        setBackgroundColor(settings.defaultBackgroundColor);
        setBrushSize(settings.defaultBrushSize);
        setEraserSize(settings.defaultEraserSize);
        
        // Initialize empty history for new drawing
        const initialState: DrawingState = {
          id: generateId(),
          name: `Drawing ${new Date().toLocaleDateString()}`,
          elements: [],
          backgroundColor: settings.defaultBackgroundColor,
          canvasTransform: createDefaultTransform(),
          canvasWidth: SCREEN_WIDTH,
          canvasHeight: SCREEN_HEIGHT - 135, // Updated: 60 (TopBar) + 75 (ToolBar) = 135px
          version: '1.0.0',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setHistory([initialState]);
        setHistoryIndex(0);
      }
    };

    initializeCanvas();
  }, [editMode, stateUri, settings.defaultBackgroundColor, settings.defaultBrushSize, settings.defaultEraserSize]);

  // Add to history
  const addToHistory = useCallback(() => {
    const newState: DrawingState = {
      id: drawingId || generateId(),
      name: `Drawing ${new Date().toLocaleDateString()}`,
      elements,
      backgroundColor,
      canvasTransform: { scale: 1, translateX: 0, translateY: 0 }, // Don't save zoom in history
      canvasWidth: SCREEN_WIDTH,
      canvasHeight: SCREEN_HEIGHT - 135, // Updated: 60 (TopBar) + 75 (ToolBar) = 135px
      version: '1.0.0',
      createdAt: editMode ? Date.now() : Date.now(),
      updatedAt: Date.now(),
    };

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    
    // Limit history size
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    
    setHistory(newHistory);
  }, [elements, backgroundColor, history, historyIndex, drawingId, editMode]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setElements(prevState.elements);
      setBackgroundColor(prevState.backgroundColor);
      // Don't restore canvasTransform to preserve zoom
      setHistoryIndex(historyIndex - 1);
      setSelectedElementId(null);
    }
  }, [history, historyIndex]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setElements(nextState.elements);
      setBackgroundColor(nextState.backgroundColor);
      // Don't restore canvasTransform to preserve zoom
      setHistoryIndex(historyIndex + 1);
      setSelectedElementId(null);
    }
  }, [history, historyIndex]);

  // Utility functions for hit detection
  const isPointInElement = (x: number, y: number, element: DrawingElement): boolean => {
    const { data, transform } = element;
    
    // Apply inverse transform to get local coordinates
    const localX = (x - transform.translateX) / transform.scale;
    const localY = (y - transform.translateY) / transform.scale;

    switch (element.type) {
      case 'shape':
        const shapeData = data;
        const tolerance = Math.max(element.strokeWidth, eraserSize / 2);
        
        if (shapeData.shape === 'line') {
          return distanceToLine(localX, localY, shapeData.x, shapeData.y, shapeData.x2 || 0, shapeData.y2 || 0) <= tolerance;
        } else if (shapeData.shape === 'circle') {
          const centerX = shapeData.x + shapeData.width / 2;
          const centerY = shapeData.y + shapeData.height / 2;
          const radius = Math.min(shapeData.width, shapeData.height) / 2;
          const distance = Math.sqrt((localX - centerX) ** 2 + (localY - centerY) ** 2);
          return distance <= radius + tolerance;
        } else {
          // Rectangle, square, ellipse
          return localX >= shapeData.x - tolerance && 
                 localX <= shapeData.x + shapeData.width + tolerance &&
                 localY >= shapeData.y - tolerance && 
                 localY <= shapeData.y + shapeData.height + tolerance;
        }

      case 'text':
        const textData = data;
        const textWidth = textData.text.length * textData.fontSize * 0.6;
        const textHeight = textData.fontSize * 1.2;
        const textTolerance = eraserSize / 2;
        return localX >= textData.x - textTolerance && 
               localX <= textData.x + textWidth + textTolerance &&
               localY >= textData.y - textHeight - textTolerance && 
               localY <= textData.y + textTolerance;

      case 'path':
        const pathData = data as any;
        if (pathData.d) {
          const coords = extractPathCoordinates(pathData.d);
          const pathTolerance = Math.max(element.strokeWidth, eraserSize / 2);
          
          for (let i = 0; i < coords.length - 1; i++) {
            const dist = distanceToLine(localX, localY, coords[i].x, coords[i].y, coords[i + 1].x, coords[i + 1].y);
            if (dist <= pathTolerance) {
              return true;
            }
          }
          
          for (const coord of coords) {
            const dist = Math.sqrt((localX - coord.x) ** 2 + (localY - coord.y) ** 2);
            if (dist <= pathTolerance) {
              return true;
            }
          }
        }
        return false;
    }
    return false;
  };

  // Extract coordinates from SVG path string
  const extractPathCoordinates = (pathString: string): { x: number; y: number }[] => {
    const coords: { x: number; y: number }[] = [];
    const numbers = pathString.match(/[-+]?[0-9]*\.?[0-9]+/g);
    if (!numbers) return coords;
    
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

  // Handle eraser - Two different modes: instant delete for shapes, partial erase for freehand
  const handleEraser = useCallback((x: number, y: number, pressure: number = 1) => {
    const canvasPoint = applyInverseTransform(x, y, canvasTransform);
    
    // Apply pressure-based size adjustment (0.5x to 2x based on pressure)
    const pressureMultiplier = Math.max(0.5, Math.min(2, pressure));
    const adjustedEraserSize = eraserSize * pressureMultiplier;
    
    // Update eraser pressure for visual feedback
    setEraserPressure(pressure);
    
    let hasChanges = false;
    const elementsToRemove: string[] = [];

    // Check for shapes and text - instant delete on hit (keep existing behavior)
    elements.forEach(element => {
      if ((element.type === 'shape' || element.type === 'text') && 
          isPointInElement(canvasPoint.x, canvasPoint.y, element)) {
        if (!elementsToRemove.includes(element.id)) {
          elementsToRemove.push(element.id);
          hasChanges = true;
        }
      }
    });

    // Remove shapes and text that were hit
    if (elementsToRemove.length > 0) {
      setElements(prev => prev.filter(element => !elementsToRemove.includes(element.id)));
      setSelectedElementId(null);
      hasChanges = true;
    }

    // For freehand paths - create eraser stroke for partial erasing
    if (!currentEraserPath) {
      // Start new eraser stroke
      const eraserStroke: DrawingElement = {
        id: generateId(),
        type: 'path',
        data: { d: `M${canvasPoint.x},${canvasPoint.y}` },
        strokeColor: '#000000', // Color doesn't matter for eraser strokes
        fillColor: undefined,
        strokeWidth: adjustedEraserSize,
        transform: createDefaultTransform(),
        timestamp: Date.now(),
        isEraser: true, // Mark as eraser stroke
      };
      
      setElements(prev => [...prev, eraserStroke]);
      setCurrentEraserPath(eraserStroke.id);
      hasChanges = true;
    }

    // Store current position for next interpolation
    setLastEraserPosition({ x, y });
    
    return hasChanges;
  }, [elements, canvasTransform, eraserSize, lastEraserPosition, currentEraserPath]);

  // Continue eraser stroke for freehand erasing
  const continueEraserStroke = useCallback((x: number, y: number, pressure: number = 1) => {
    if (!currentEraserPath) return false;
    
    const canvasPoint = applyInverseTransform(x, y, canvasTransform);
    const pressureMultiplier = Math.max(0.5, Math.min(2, pressure));
    const adjustedEraserSize = eraserSize * pressureMultiplier;
    
    // Continue the eraser path
    setElements(prev => prev.map(element => {
      if (element.id === currentEraserPath && element.type === 'path' && element.isEraser) {
        return {
          ...element,
          data: { ...element.data, d: `${element.data.d} L${canvasPoint.x},${canvasPoint.y}` },
          strokeWidth: adjustedEraserSize,
        };
      }
      return element;
    }));
    
    setLastEraserPosition({ x, y });
    return true;
  }, [currentEraserPath, canvasTransform, eraserSize]);

  // End eraser stroke
  const endEraserStroke = useCallback(() => {
    if (currentEraserPath) {
      setCurrentEraserPath(null);
      setLastEraserPosition(null);
      addToHistory(); // Add eraser stroke to history for undo/redo
    }
  }, [currentEraserPath, addToHistory]);

  // Get resize handles for selected shape
  const getResizeHandles = (element: DrawingElement): { x: number; y: number; handle: string }[] => {
    if (element.type !== 'shape') return [];
    
    const { x, y, width, height } = element.data;
    const handleSize = 12;
    
    return [
      { x: x - handleSize/2, y: y - handleSize/2, handle: 'tl' }, // top-left
      { x: x + width - handleSize/2, y: y - handleSize/2, handle: 'tr' }, // top-right
      { x: x - handleSize/2, y: y + height - handleSize/2, handle: 'bl' }, // bottom-left
      { x: x + width - handleSize/2, y: y + height - handleSize/2, handle: 'br' }, // bottom-right
    ];
  };

  // Check if point is on resize handle
  const getResizeHandleAt = (x: number, y: number, element: DrawingElement): string | null => {
    if (element.type !== 'shape') return null;
    
    const handles = getResizeHandles(element);
    const handleSize = 12;
    
    for (const handle of handles) {
      if (x >= handle.x && x <= handle.x + handleSize &&
          y >= handle.y && y <= handle.y + handleSize) {
        return handle.handle;
      }
    }
    return null;
  };

  // Handle shape resize
  const handleShapeResize = useCallback((x: number, y: number) => {
    if (!selectedElementId || !isResizing || !resizeHandle || !resizeStartBounds) return;
    
    const canvasPoint = applyInverseTransform(x, y, canvasTransform);
    const deltaX = canvasPoint.x - resizeStartBounds.x;
    const deltaY = canvasPoint.y - resizeStartBounds.y;
    
    let newX = resizeStartBounds.x;
    let newY = resizeStartBounds.y;
    let newWidth = resizeStartBounds.width;
    let newHeight = resizeStartBounds.height;
    
    // Calculate new bounds based on resize handle
    switch (resizeHandle) {
      case 'tl': // top-left
        newX = canvasPoint.x;
        newY = canvasPoint.y;
        newWidth = resizeStartBounds.width + (resizeStartBounds.x - canvasPoint.x);
        newHeight = resizeStartBounds.height + (resizeStartBounds.y - canvasPoint.y);
        break;
      case 'tr': // top-right
        newY = canvasPoint.y;
        newWidth = canvasPoint.x - resizeStartBounds.x;
        newHeight = resizeStartBounds.height + (resizeStartBounds.y - canvasPoint.y);
        break;
      case 'bl': // bottom-left
        newX = canvasPoint.x;
        newWidth = resizeStartBounds.width + (resizeStartBounds.x - canvasPoint.x);
        newHeight = canvasPoint.y - resizeStartBounds.y;
        break;
      case 'br': // bottom-right
        newWidth = canvasPoint.x - resizeStartBounds.x;
        newHeight = canvasPoint.y - resizeStartBounds.y;
        break;
    }
    
    // Ensure minimum size
    const minSize = 10;
    if (newWidth < minSize) {
      if (resizeHandle.includes('l')) newX = resizeStartBounds.x + resizeStartBounds.width - minSize;
      newWidth = minSize;
    }
    if (newHeight < minSize) {
      if (resizeHandle.includes('t')) newY = resizeStartBounds.y + resizeStartBounds.height - minSize;
      newHeight = minSize;
    }
    
    // Update element
    setElements(prev => prev.map(element => {
      if (element.id === selectedElementId && element.type === 'shape') {
        return {
          ...element,
          data: {
            ...element.data,
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
          }
        };
      }
      return element;
    }));
  }, [selectedElementId, isResizing, resizeHandle, resizeStartBounds, canvasTransform]);

  // End resize operation
  const endResize = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
      setResizeStartBounds(null);
      addToHistory(); // Make resize undoable
    }
  }, [isResizing, addToHistory]);

  // Handle text color change for selected text
  const handleTextColorChange = useCallback((color: string) => {
    if (selectedElementId) {
      const selectedElement = elements.find(el => el.id === selectedElementId);
      if (selectedElement && selectedElement.type === 'text') {
        setElements(prev => prev.map(element => 
          element.id === selectedElementId && element.type === 'text'
            ? { ...element, strokeColor: color }
            : element
        ));
        setSelectedTextColor(color);
        addToHistory();
      }
    }
  }, [selectedElementId, elements, addToHistory]);

  // Handle text size change for selected text
  const handleTextSizeChange = useCallback((size: number) => {
    if (selectedElementId) {
      const selectedElement = elements.find(el => el.id === selectedElementId);
      if (selectedElement && selectedElement.type === 'text') {
        setElements(prev => prev.map(element => 
          element.id === selectedElementId && element.type === 'text'
            ? { ...element, data: { ...element.data, fontSize: size } }
            : element
        ));
        setSelectedTextSize(size);
        addToHistory();
      }
    }
  }, [selectedElementId, elements, addToHistory]);

  const handleTextEdit = useCallback(() => {
    if (selectedElementId) {
      const selectedElement = elements.find(el => el.id === selectedElementId);
      if (selectedElement && selectedElement.type === 'text') {
        setEditingTextId(selectedElementId);
        setIsEditingTextContent(true);
        setShowTextModal(true);
      }
    }
  }, [selectedElementId, elements]);

  // Auto-save functionality
  useEffect(() => {
    if (!settings.autoSave || elements.length === 0) return;
    
    const autoSaveTimeout = setTimeout(async () => {
      try {
        if (!canvasViewRef.current) return;

        // Capture canvas as image
        const imageUri = await captureRef(canvasViewRef, {
          format: 'png',
          quality: 0.8,
        });

        if (!imageUri) return;

        // Determine if this is edit mode or new drawing
        const isEditMode = editMode && drawingId;
        const finalDrawingId = isEditMode ? drawingId : generateId();
        
        // Create drawing state
        const state: DrawingState = {
          id: finalDrawingId,
          name: isEditMode ? `Drawing ${finalDrawingId}` : `Drawing ${new Date().toLocaleDateString()}`,
          elements,
          backgroundColor,
          canvasTransform: { scale: 1, translateX: 0, translateY: 0 },
          canvasWidth: SCREEN_WIDTH,
          canvasHeight: SCREEN_HEIGHT - 135,
          version: '1.0.0',
          createdAt: isEditMode && history[0] ? history[0].createdAt : Date.now(),
          updatedAt: Date.now(),
        };

        // Auto-save the drawing
        await saveDrawing(finalDrawingId, state.name, imageUri, state);
        console.log('Auto-saved drawing');
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 2000); // Auto-save 2 seconds after last change

    return () => clearTimeout(autoSaveTimeout);
  }, [elements, backgroundColor, settings.autoSave, editMode, drawingId, history]);

  // Cleanup eraser timeout on unmount
  useEffect(() => {
    return () => {
      if (eraserBatchTimeout) {
        clearTimeout(eraserBatchTimeout);
      }
    };
  }, [eraserBatchTimeout]);

  // Update selected text properties when selection changes
  useEffect(() => {
    if (selectedElementId) {
      const selectedElement = elements.find(el => el.id === selectedElementId);
      if (selectedElement && selectedElement.type === 'text') {
        setSelectedTextColor(selectedElement.strokeColor);
        setSelectedTextSize(selectedElement.data.fontSize);
        setSelectedShapeWidth(null);
        setSelectedShapeHeight(null);
      } else if (selectedElement && selectedElement.type === 'shape') {
        setSelectedShapeWidth(selectedElement.data.width);
        setSelectedShapeHeight(selectedElement.data.height);
        setSelectedTextColor(null);
        setSelectedTextSize(null);
      } else {
        setSelectedTextColor(null);
        setSelectedTextSize(null);
        setSelectedShapeWidth(null);
        setSelectedShapeHeight(null);
      }
    } else {
      setSelectedTextColor(null);
      setSelectedTextSize(null);
      setSelectedShapeWidth(null);
      setSelectedShapeHeight(null);
    }
  }, [selectedElementId, elements]);

  // Check if tool allows dragging
  const canDragInCurrentTool = (): boolean => {
    // Dragging works when not actively drawing/erasing/filling
    return !isDrawing && !isErasing && selectedTool !== 'fill';
  };

  // Handle text placement
  const handleTextPlacement = useCallback((x: number, y: number) => {
    const canvasPoint = applyInverseTransform(x, y, canvasTransform);
    setTextInputPosition(canvasPoint);
    setEditingTextId(null);
    setShowTextModal(true);
  }, [canvasTransform]);

  // Find element at point for selection
  const findElementAtPoint = (x: number, y: number): DrawingElement | null => {
    const canvasPoint = applyInverseTransform(x, y, canvasTransform);
    
    // Check elements in reverse order (topmost first)
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      if (isPointInElement(canvasPoint.x, canvasPoint.y, element)) {
        return element;
      }
    }
    return null;
  };

  // Get element position for dragging
  const getElementPosition = (element: DrawingElement): { x: number; y: number } => {
    if (element.type === 'text') {
      return { x: element.data.x, y: element.data.y };
    } else if (element.type === 'shape') {
      return { x: element.data.x, y: element.data.y };
    }
    return { x: 0, y: 0 };
  };

  // Update element position
  const updateElementPosition = (elementId: string, newX: number, newY: number) => {
    setElements(prev => prev.map(element => {
      if (element.id === elementId) {
        const newData = { ...element.data };
        if (element.type === 'text' || element.type === 'shape') {
          newData.x = newX;
          newData.y = newY;
        }
        return { ...element, data: newData };
      }
      return element;
    }));
  };

  // Handle element selection
  const handleElementSelection = useCallback((x: number, y: number) => {
    if (!canDragInCurrentTool()) return false;
    
    const canvasPoint = applyInverseTransform(x, y, canvasTransform);
    
    // First check if clicking on resize handle of selected element
    if (selectedElementId) {
      const selectedElement = elements.find(el => el.id === selectedElementId);
      if (selectedElement && selectedElement.type === 'shape') {
        const handle = getResizeHandleAt(canvasPoint.x, canvasPoint.y, selectedElement);
        if (handle) {
          setIsResizing(true);
          setResizeHandle(handle as 'tl' | 'tr' | 'bl' | 'br');
          setResizeStartBounds({
            x: selectedElement.data.x,
            y: selectedElement.data.y,
            width: selectedElement.data.width,
            height: selectedElement.data.height,
          });
          return true;
        }
      }
    }
    
    // Then check for element selection
    const element = findElementAtPoint(x, y);
    if (element) {
      setSelectedElementId(element.id);
      const elementPos = getElementPosition(element);
      setDragOffset({
        x: canvasPoint.x - elementPos.x,
        y: canvasPoint.y - elementPos.y,
      });
      setDragStartPosition(elementPos);
      return true;
    } else {
      // Deselect if tapping on empty space
      setSelectedElementId(null);
      return false;
    }
  }, [elements, canvasTransform, selectedTool, isDrawing, selectedElementId, canvasTransform]);

  // Handle element dragging
  const handleElementDrag = useCallback((x: number, y: number) => {
    if (!selectedElementId) return;
    
    if (isResizing) {
      handleShapeResize(x, y);
    } else if (isDragging) {
      const canvasPoint = applyInverseTransform(x, y, canvasTransform);
      const newX = canvasPoint.x - dragOffset.x;
      const newY = canvasPoint.y - dragOffset.y;
      
      updateElementPosition(selectedElementId, newX, newY);
    }
  }, [selectedElementId, isDragging, isResizing, dragOffset, canvasTransform, handleShapeResize]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (isResizing) {
      endResize();
    } else if (isDragging && selectedElementId && dragStartPosition) {
      // Check if element actually moved
      const currentElement = elements.find(el => el.id === selectedElementId);
      if (currentElement) {
        const currentPos = getElementPosition(currentElement);
        const moved = Math.abs(currentPos.x - dragStartPosition.x) > 1 || 
                     Math.abs(currentPos.y - dragStartPosition.y) > 1;
        
        if (moved) {
          addToHistory(); // Add to history only if element actually moved
        }
      }
      
      setIsDragging(false);
      setDragStartPosition(null);
    }
  }, [isDragging, isResizing, selectedElementId, dragStartPosition, elements, addToHistory, endResize]);

  // Handle fill tool - only fill when explicitly using fill tool
  const handleFill = useCallback((x: number, y: number) => {
    const canvasPoint = applyInverseTransform(x, y, canvasTransform);
    
    // Find the topmost element at this point
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      
      // For fill tool, use more precise hit detection
      let isHit = false;
      
      if (element.type === 'shape') {
        const shapeData = element.data;
        
        // Check if point is inside the shape bounds (for filling)
        if (shapeData.shape === 'line') {
          // Lines can't be filled, skip
          continue;
        } else if (shapeData.shape === 'circle') {
          const centerX = shapeData.x + shapeData.width / 2;
          const centerY = shapeData.y + shapeData.height / 2;
          const radius = Math.min(shapeData.width, shapeData.height) / 2;
          const distance = Math.sqrt((canvasPoint.x - centerX) ** 2 + (canvasPoint.y - centerY) ** 2);
          isHit = distance <= radius;
        } else if (shapeData.shape === 'ellipse') {
          const centerX = shapeData.x + shapeData.width / 2;
          const centerY = shapeData.y + shapeData.height / 2;
          const rx = shapeData.width / 2;
          const ry = shapeData.height / 2;
          const dx = (canvasPoint.x - centerX) / rx;
          const dy = (canvasPoint.y - centerY) / ry;
          isHit = (dx * dx + dy * dy) <= 1;
        } else {
          // Rectangle, square, star - check if point is inside bounds
          isHit = canvasPoint.x >= shapeData.x && 
                  canvasPoint.x <= shapeData.x + shapeData.width &&
                  canvasPoint.y >= shapeData.y && 
                  canvasPoint.y <= shapeData.y + shapeData.height;
        }
      } else if (element.type === 'path' && isPathClosed(element.data.d)) {
        // For closed paths, use the existing hit detection
        isHit = isPointInElement(canvasPoint.x, canvasPoint.y, element);
      }
      
      if (isHit) {
        setElements(prev => prev.map(prevElement => 
          prevElement.id === element.id 
            ? { ...prevElement, fillColor: strokeColor }
            : prevElement
        ));
        addToHistory();
        break;
      }
    }
  }, [elements, canvasTransform, strokeColor, addToHistory, isPointInElement]);

  // Utility functions for zoom/pan
  const getDistance = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const [touch1, touch2] = touches;
    return Math.sqrt(
      Math.pow(touch2.pageX - touch1.pageX, 2) + 
      Math.pow(touch2.pageY - touch1.pageY, 2)
    );
  };

  const getCenter = (touches: any[]) => {
    if (touches.length < 2) return { x: 0, y: 0 };
    const [touch1, touch2] = touches;
    return {
      x: (touch1.pageX + touch2.pageX) / 2,
      y: (touch1.pageY + touch2.pageY) / 2,
    };
  };

  const applyInverseTransform = (x: number, y: number, transform: Transform) => {
    return {
      x: (x - transform.translateX) / transform.scale,
      y: (y - transform.translateY) / transform.scale,
    };
  };

  const constrainScale = (scale: number) => {
    return Math.max(0.5, Math.min(3, scale)); // Updated limits as per requirements
  };

  // Reset zoom to default
  const resetZoom = useCallback(() => {
    setCanvasTransform({
      scale: 1,
      translateX: 0,
      translateY: 0,
    });
  }, []);

  // Zoom in
  const zoomIn = useCallback(() => {
    setCanvasTransform(prev => {
      const newScale = constrainScale(prev.scale * 1.2);
      return {
        ...prev,
        scale: newScale,
      };
    });
  }, []);

  // Zoom out
  const zoomOut = useCallback(() => {
    setCanvasTransform(prev => {
      const newScale = constrainScale(prev.scale / 1.2);
      return {
        ...prev,
        scale: newScale,
      };
    });
  }, []);

  // Handle mouse wheel zoom for web
  const handleWheel = useCallback((event: any) => {
    if (Platform.OS !== 'web') return;
    
    event.preventDefault();
    const delta = event.deltaY;
    const zoomFactor = delta > 0 ? 0.9 : 1.1;
    
    setCanvasTransform(prev => ({
      ...prev,
      scale: constrainScale(prev.scale * zoomFactor),
    }));
  }, []);

  // Web mouse event handlers for better web compatibility
  const handleMouseDown = useCallback((evt: any) => {
    if (Platform.OS !== 'web') return;
    
    const point = getPoint(evt, canvasViewRef);
    const { x, y } = point;
    const canvasPoint = applyInverseTransform(x, y, canvasTransform);

    // Handle different tools
    switch (selectedTool) {
      case 'brush':
        if (canDragInCurrentTool() && handleElementSelection(x, y)) {
          setIsDragging(true);
          return;
        }
        setIsDrawing(true);
        setCurrentPath(`M${canvasPoint.x},${canvasPoint.y}`);
        break;

      case 'eraser':
        setIsErasing(true);
        setEraserPosition({ x, y });
        setLastEraserPosition(null);
        setEraserAnimationScale(1.2); // Scale up on touch
        
        // Extract pressure from touch event (if available)
        const pressure = evt.nativeEvent.force || 1;
        
        // Start eraser stroke - this handles both shapes and freehand
        const erased = handleEraser(x, y, pressure);
        
        if (erased) {
          // Batch history updates
          if (eraserBatchTimeout) {
            clearTimeout(eraserBatchTimeout);
          }
          const timeout = setTimeout(() => {
            addToHistory();
            setEraserBatchTimeout(null);
          }, 300);
          setEraserBatchTimeout(timeout);
        }
        break;

      case 'line':
      case 'rect':
      case 'square':
      case 'circle':
      case 'ellipse':
      case 'star':
        if (canDragInCurrentTool() && handleElementSelection(x, y)) {
          setIsDragging(true);
          return;
        }
        setIsDrawing(true);
        setStartPoint(canvasPoint);
        break;

      case 'text':
        if (canDragInCurrentTool() && handleElementSelection(x, y)) {
          const selectedElement = elements.find(el => el.id === selectedElementId);
          if (selectedElement && selectedElement.type === 'text') {
            const currentTime = Date.now();
            if (lastTapElementId === selectedElement.id && currentTime - lastTapTime < 500) {
              handleTextEdit();
              return;
            } else {
              setLastTapTime(currentTime);
              setLastTapElementId(selectedElement.id);
              setIsDragging(true);
              return;
            }
          }
        }
        handleTextPlacement(x, y);
        break;

      case 'fill':
        handleFill(x, y);
        break;

      default:
        if (handleElementSelection(x, y)) {
          setIsDragging(true);
        }
        break;
    }
  }, [selectedTool, canvasTransform, elements, selectedElementId, lastTapTime, lastTapElementId, eraserBatchTimeout, handleElementSelection, handleEraser, handleTextEdit, handleTextPlacement, handleFill, addToHistory]);

  const handleMouseMove = useCallback((evt: any) => {
    if (Platform.OS !== 'web') return;
    
    const point = getPoint(evt, canvasViewRef);
    const { x, y } = point;
    const canvasPoint = applyInverseTransform(x, y, canvasTransform);

    if (isDragging) {
      handleElementDrag(x, y);
    } else if (isDrawing) {
      switch (selectedTool) {
        case 'brush':
          setCurrentPath(prev => `${prev} L${canvasPoint.x},${canvasPoint.y}`);
          break;
        
        case 'line':
        case 'rect':
        case 'square':
        case 'circle':
        case 'ellipse':
        case 'star':
          if (startPoint) {
            // Update current shape preview
            const width = Math.abs(canvasPoint.x - startPoint.x);
            const height = Math.abs(canvasPoint.y - startPoint.y);
            
            // Ensure minimum size for visibility
            const minSize = 5;
            if (width < minSize && height < minSize) return;
            
            const size = selectedTool === 'square' ? Math.min(width, height) : undefined;
            
            const shapeData = {
              shape: selectedTool === 'rect' ? 'rect' : selectedTool === 'square' ? 'square' : selectedTool,
              x: Math.min(startPoint.x, canvasPoint.x),
              y: Math.min(startPoint.y, canvasPoint.y),
              width: size || width,
              height: size || height,
              ...(selectedTool === 'line' && {
                x2: canvasPoint.x,
                y2: canvasPoint.y,
              }),
            };

            const previewShape: DrawingElement = {
              id: 'preview',
              type: 'shape',
              data: shapeData,
              strokeColor,
              fillColor: undefined,
              strokeWidth: brushSize,
              transform: createDefaultTransform(),
              timestamp: Date.now(),
            };
            
            setCurrentShape(previewShape);
          }
          break;
      }
    } else if (isErasing) {
      setEraserPosition({ x, y });
      
      // Extract pressure from touch event (if available)
      const pressure = evt.nativeEvent.force || 1;
      
      // Continue eraser stroke for partial erasing
      const continued = continueEraserStroke(x, y, pressure);
      if (continued) {
        // Batch history updates during continuous erasing
        if (eraserBatchTimeout) {
          clearTimeout(eraserBatchTimeout);
        }
        const timeout = setTimeout(() => {
          addToHistory();
          setEraserBatchTimeout(null);
        }, 300);
        setEraserBatchTimeout(timeout);
      }
    }
  }, [selectedTool, canvasTransform, isDragging, isDrawing, isErasing, eraserBatchTimeout, handleElementDrag, handleEraser, addToHistory, startPoint, strokeColor, brushSize]);

  const handleMouseUp = useCallback((evt: any) => {
    if (Platform.OS !== 'web') return;
    
    const point = getPoint(evt, canvasViewRef);
    const { x, y } = point;
    const canvasPoint = applyInverseTransform(x, y, canvasTransform);

    if (isDragging) {
      handleDragEnd();
      return;
    }

    if (isErasing) {
      setIsErasing(false);
      setEraserPosition(null);
      setLastEraserPosition(null);
      setEraserAnimationScale(1); // Reset scale
      setEraserPressure(1); // Reset pressure
      
      // End eraser stroke if one was active
      endEraserStroke();
      
      // Ensure final history update for eraser session
      if (eraserBatchTimeout) {
        clearTimeout(eraserBatchTimeout);
        addToHistory();
        setEraserBatchTimeout(null);
      }
      return;
    }

    if (isDrawing) {
      switch (selectedTool) {
        case 'brush':
          if (currentPath && currentPath.length >= 4) {
            const newElement: DrawingElement = {
              id: generateId(),
              type: 'path',
              data: { d: currentPath },
              strokeColor,
              fillColor: undefined, // Paths don't have fill
              strokeWidth: brushSize,
              transform: createDefaultTransform(),
              timestamp: Date.now(),
            };
            setElements(prev => [...prev, newElement]);
            addToHistory();
          }
          break;

        case 'line':
        case 'rect':
        case 'square':
        case 'circle':
        case 'ellipse':
        case 'star':
          if (startPoint && currentShape) {
            // Only create shape if it has minimum size
            const { width, height } = currentShape.data;
            const minSize = 5;
            if (width >= minSize || height >= minSize) {
              // Create final shape from preview
              const finalShape: DrawingElement = {
                ...currentShape,
                id: generateId(),
              };
              setElements(prev => [...prev, finalShape]);
              addToHistory();
            }
          }
          break;
      }

      setIsDrawing(false);
      setCurrentPath('');
      setStartPoint(null);
      setCurrentShape(null);
    }
  }, [canvasTransform, isDragging, isErasing, isDrawing, currentPath, startPoint, selectedTool, strokeColor, brushSize, eraserBatchTimeout, handleDragEnd, addToHistory, currentShape]);

  // Handle text input
  const handleTextSave = useCallback((text: string) => {
    if (editingTextId) {
      // Edit existing text - preserve position, color, and size
      setElements(prev => prev.map(element => 
        element.id === editingTextId && element.type === 'text'
          ? { 
              ...element, 
              data: { ...element.data, text } 
            }
          : element
      ));
    } else {
      // Create new text
      const newElement: DrawingElement = {
        id: generateId(),
        type: 'text',
        data: {
          text,
          x: textInputPosition.x,
          y: textInputPosition.y,
          fontSize: textSize,
          fontFamily: 'System',
        },
        strokeColor,
        fillColor: undefined, // Text doesn't have fill
        strokeWidth: 1,
        transform: createDefaultTransform(),
        timestamp: Date.now(),
      };
      setElements(prev => [...prev, newElement]);
    }
    
    addToHistory();
    setShowTextModal(false);
    setEditingTextId(null);
    setIsEditingTextContent(false);
  }, [editingTextId, textInputPosition, strokeColor, textSize, addToHistory]);

  // Pan responder for canvas interactions - web-safe implementation
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,

    onPanResponderGrant: (evt: GestureResponderEvent) => {
      const point = getPoint(evt, canvasViewRef);
      const { x, y } = point;
      const { touches } = evt.nativeEvent;

      // Handle multi-touch for zoom (enabled on native, improved for web)
      if (touches.length === 2) {
        setIsZooming(true);
        setIsPanning(false);
        setInitialDistance(getDistance(touches));
        setInitialScale(canvasTransform.scale);
        setInitialCenter(getCenter(touches));
        
        // Disable drawing while zooming
        setIsDrawing(false);
        setIsErasing(false);
        setIsDragging(false);
        return;
      }

      // Single touch interactions
      setIsZooming(false);
      const canvasPoint = applyInverseTransform(x, y, canvasTransform);

      // Handle different tools
      switch (selectedTool) {
        case 'brush':
          // First check if we can select an element (when not actively drawing)
          if (canDragInCurrentTool() && handleElementSelection(x, y)) {
            setIsDragging(true);
            return;
          }
          // Otherwise start drawing
          setIsDrawing(true);
          setCurrentPath(`M${canvasPoint.x},${canvasPoint.y}`);
          break;

        case 'eraser':
          setIsErasing(true);
          setEraserPosition({ x, y });
          setLastEraserPosition(null); // Reset interpolation
          setEraserAnimationScale(1.2); // Scale up on touch
          
          // Extract pressure from touch event (if available)
          const pressure = evt.nativeEvent.force || 1;
          const erased = handleEraser(x, y, pressure);
          
          if (erased) {
            // Batch history updates to avoid too many undo entries
            if (eraserBatchTimeout) {
              clearTimeout(eraserBatchTimeout);
            }
            const timeout = setTimeout(() => {
              addToHistory();
              setEraserBatchTimeout(null);
            }, 300); // Add to history 300ms after last erase action
            setEraserBatchTimeout(timeout);
          }
          break;

        case 'line':
        case 'rect':
        case 'square':
        case 'circle':
        case 'ellipse':
        case 'star':
          // First check if we can select an element
          if (canDragInCurrentTool() && handleElementSelection(x, y)) {
            setIsDragging(true);
            return;
          }
          // Otherwise start drawing shape
          setIsDrawing(true);
          setStartPoint(canvasPoint);
          break;

        case 'text':
          // First check if we can select an element (for editing existing text)
          if (canDragInCurrentTool() && handleElementSelection(x, y)) {
            const selectedElement = elements.find(el => el.id === selectedElementId);
            if (selectedElement && selectedElement.type === 'text') {
              // Check for double-tap to edit text
              const currentTime = Date.now();
              if (lastTapElementId === selectedElement.id && currentTime - lastTapTime < 500) {
                // Double tap detected - edit text
                handleTextEdit();
                return;
              } else {
                // Single tap - prepare for dragging
                setLastTapTime(currentTime);
                setLastTapElementId(selectedElement.id);
                setIsDragging(true);
                return;
              }
            }
          }
          // Otherwise place new text
          handleTextPlacement(x, y);
          break;

        case 'fill':
          handleFill(x, y);
          break;

        default:
          // For any other tool or no tool, try to select an element
          if (handleElementSelection(x, y)) {
            setIsDragging(true);
          }
          break;
      }
    },

    onPanResponderMove: (evt: GestureResponderEvent) => {
      const point = getPoint(evt, canvasViewRef);
      const { x, y } = point;
      const { touches } = evt.nativeEvent;

      // Handle zoom (enabled on both native and web)
      if (isZooming && touches.length === 2) {
        const currentDistance = getDistance(touches);
        const currentCenter = getCenter(touches);
        
        if (initialDistance > 0) {
          const scale = constrainScale(initialScale * (currentDistance / initialDistance));
          
          // Calculate pan offset to zoom towards center
          const deltaX = (currentCenter.x - initialCenter.x) * 0.5;
          const deltaY = (currentCenter.y - initialCenter.y) * 0.5;
          
          setCanvasTransform({
            scale,
            translateX: canvasTransform.translateX + deltaX,
            translateY: canvasTransform.translateY + deltaY,
          });
        }
        return;
      }

      // Handle single finger pan when zoomed
      if (touches.length === 1 && canvasTransform.scale > 1 && !isDrawing && !isErasing && !isDragging) {
        if (!isPanning) {
          setIsPanning(true);
          setInitialCenter({ x, y });
          return;
        }
        
        // Pan the canvas
        const deltaX = x - initialCenter.x;
        const deltaY = y - initialCenter.y;
        
        setCanvasTransform(prev => ({
          ...prev,
          translateX: prev.translateX + deltaX,
          translateY: prev.translateY + deltaY,
        }));
        
        setInitialCenter({ x, y });
        return;
      }

      // Single touch interactions
      if (touches.length === 1) {
        const canvasPoint = applyInverseTransform(x, y, canvasTransform);

        if (isDragging) {
          // Handle element dragging
          handleElementDrag(x, y);
        } else if (isDrawing) {
          switch (selectedTool) {
            case 'brush':
              setCurrentPath(prev => `${prev} L${canvasPoint.x},${canvasPoint.y}`);
              break;
            
            case 'line':
            case 'rect':
            case 'square':
            case 'circle':
            case 'ellipse':
            case 'star':
              if (startPoint) {
                // Update current shape preview
                const width = Math.abs(canvasPoint.x - startPoint.x);
                const height = Math.abs(canvasPoint.y - startPoint.y);
                
                // Ensure minimum size for visibility
                const minSize = 5;
                if (width < minSize && height < minSize) return;
                
                const size = selectedTool === 'square' ? Math.min(width, height) : undefined;
                
                const shapeData = {
                  shape: selectedTool === 'rect' ? 'rect' : selectedTool === 'square' ? 'square' : selectedTool,
                  x: Math.min(startPoint.x, canvasPoint.x),
                  y: Math.min(startPoint.y, canvasPoint.y),
                  width: size || width,
                  height: size || height,
                  ...(selectedTool === 'line' && {
                    x2: canvasPoint.x,
                    y2: canvasPoint.y,
                  }),
                };

                const previewShape: DrawingElement = {
                  id: 'preview',
                  type: 'shape',
                  data: shapeData,
                  strokeColor,
                  fillColor: undefined,
                  strokeWidth: brushSize,
                  transform: createDefaultTransform(),
                  timestamp: Date.now(),
                };
                
                setCurrentShape(previewShape);
              }
              break;
          }
        } else if (isErasing) {
          // Continue erasing while dragging
          setEraserPosition({ x, y });
          
          // Extract pressure from touch event (if available)
          const pressure = evt.nativeEvent.force || 1;
          
          // Continue eraser stroke for partial erasing
          const continued = continueEraserStroke(x, y, pressure);
          if (continued) {
            // Batch history updates during continuous erasing
            if (eraserBatchTimeout) {
              clearTimeout(eraserBatchTimeout);
            }
            const timeout = setTimeout(() => {
              addToHistory();
              setEraserBatchTimeout(null);
            }, 300);
            setEraserBatchTimeout(timeout);
          }
        }
      }
    },

    onPanResponderRelease: (evt: GestureResponderEvent) => {
      const point = getPoint(evt, canvasViewRef);
      const { x, y } = point;
      const canvasPoint = applyInverseTransform(x, y, canvasTransform);

      if (isZooming) {
        setIsZooming(false);
        setIsPanning(false);
        return;
      }

      if (isPanning) {
        setIsPanning(false);
        return;
      }

      if (isDragging) {
        handleDragEnd();
        return;
      }

      if (isErasing) {
        setIsErasing(false);
        setEraserPosition(null);
        setLastEraserPosition(null); // Reset interpolation
        setEraserAnimationScale(1); // Reset scale
        setEraserPressure(1); // Reset pressure
        
        // End eraser stroke if one was active
        endEraserStroke();
        
        // Ensure final history update for eraser session
        if (eraserBatchTimeout) {
          clearTimeout(eraserBatchTimeout);
          addToHistory();
          setEraserBatchTimeout(null);
        }
        return;
      }

      if (isDrawing) {
        switch (selectedTool) {
          case 'brush':
            if (currentPath && currentPath.length >= 4) {
              const newElement: DrawingElement = {
                id: generateId(),
                type: 'path',
                data: { d: currentPath },
                strokeColor,
                strokeWidth: brushSize,
                transform: createDefaultTransform(),
                timestamp: Date.now(),
              };
              setElements(prev => [...prev, newElement]);
              addToHistory();
            }
            break;

          case 'line':
          case 'rect':
          case 'square':
          case 'circle':
          case 'ellipse':
          case 'star':
            if (startPoint && currentShape) {
              // Only create shape if it has minimum size
              const { width, height } = currentShape.data;
              const minSize = 5;
              if (width >= minSize || height >= minSize) {
                // Create final shape from preview
                const finalShape: DrawingElement = {
                  ...currentShape,
                  id: generateId(),
                };
                setElements(prev => [...prev, finalShape]);
                addToHistory();
              }
            }
            break;
        }

        setIsDrawing(false);
        setCurrentPath('');
        setStartPoint(null);
        setCurrentShape(null);
      }
    },
  });

  // Clear drawing
  const handleClear = useCallback(() => {
    Alert.alert(
      'Clear Drawing',
      'Are you sure you want to clear the entire canvas? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setElements([]);
            setSelectedElementId(null);
            addToHistory();
          },
        },
      ]
    );
  }, [addToHistory]);

  // Save drawing
  const handleSave = useCallback(async () => {
    if (elements.length === 0) {
      Alert.alert('Nothing to Save', 'Please create some content before saving.');
      return;
    }

    try {
      if (!canvasViewRef.current) {
        throw new Error('Canvas not ready');
      }

      // Capture canvas as image with retry logic
      let imageUri: string;
      try {
        imageUri = await captureRef(canvasViewRef, {
          format: 'png',
          quality: 0.8,
        });
      } catch (captureError) {
        console.error('Canvas capture failed:', captureError);
        throw new Error('Failed to capture canvas image');
      }

      // Guard against null or empty image URI
      if (!imageUri || imageUri.trim() === '') {
        throw new Error('Image export failed - no image URI returned');
      }

      // Determine if this is edit mode or new drawing
      const isEditMode = editMode && drawingId;
      const finalDrawingId = isEditMode ? drawingId : generateId();
      
      console.log(`Save operation: ${isEditMode ? 'EDIT' : 'NEW'} mode, ID: ${finalDrawingId}`);
      
      // Create drawing state
      const state: DrawingState = {
        id: finalDrawingId,
        name: isEditMode ? `Drawing ${finalDrawingId}` : `Drawing ${new Date().toLocaleDateString()}`,
        elements,
        backgroundColor,
        canvasTransform: { scale: 1, translateX: 0, translateY: 0 }, // Always save with default transform
        canvasWidth: SCREEN_WIDTH,
        canvasHeight: SCREEN_HEIGHT - 135, // Updated: 60 (TopBar) + 75 (ToolBar) = 135px
        version: '1.0.0',
        createdAt: isEditMode && history[0] ? history[0].createdAt : Date.now(),
        updatedAt: Date.now(),
      };

      // Save the drawing (this handles both new and existing drawings)
      await saveDrawing(finalDrawingId, state.name, imageUri, state);

      Alert.alert(
        'Success',
        isEditMode ? 'Drawing updated successfully!' : 'Drawing saved successfully!',
        [
          { text: 'OK' },
          {
            text: 'View Gallery',
            onPress: () => navigation.navigate('Gallery'),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving drawing:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to save drawing: ${errorMessage}. Please try again.`);
    }
  }, [elements, backgroundColor, canvasTransform, editMode, drawingId, navigation, history]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={settings.theme === 'dark' ? "light-content" : "dark-content"} backgroundColor={theme.background} />
      
      {/* Compact Top Bar - Fixed Height */}
      <TopBar
        onBack={() => navigation.goBack()}
        onUndo={undo}
        onRedo={redo}
        onSave={handleSave}
        onClear={handleClear}
        onSettings={() => setShowSettings(true)}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        zoomLevel={canvasTransform.scale}
      />

      {/* Horizontal Tool Bar - Fixed Height */}
      <Toolbar
        selectedTool={selectedTool}
        onToolSelect={handleToolChange}
      />

      {/* Canvas Container - Maximum Space */}
      <View style={styles.canvasContainer}>
        <View
          ref={canvasViewRef}
          style={styles.canvas}
          {...panResponder.panHandlers}
          // Add mouse event handlers for web
          {...(Platform.OS === 'web' && {
            onMouseDown: handleMouseDown,
            onMouseMove: handleMouseMove,
            onMouseUp: handleMouseUp,
            onWheel: handleWheel,
          })}
        >
          {/* Transform wrapper for zoom */}
          <View
            style={[
              styles.canvasTransform,
              {
                transform: [
                  { translateX: canvasTransform.translateX },
                  { translateY: canvasTransform.translateY },
                  { scale: canvasTransform.scale },
                ],
              },
            ]}
          >
            <Canvas
              ref={canvasRef}
              elements={elements}
              backgroundColor={backgroundColor}
              canvasTransform={{ scale: 1, translateX: 0, translateY: 0 }} // Reset transform for inner canvas
              currentPath={selectedTool === 'eraser' && currentEraserPath ? '' : currentPath} // Show eraser path as element
              currentPathColor={strokeColor}
              currentPathWidth={selectedTool === 'eraser' ? eraserSize : brushSize}
              currentPathIsEraser={selectedTool === 'eraser' && isErasing && !currentEraserPath}
              currentShape={currentShape}
              selectedElementId={selectedElementId}
              isDragging={isDragging}
              width={SCREEN_WIDTH}
              height={SCREEN_HEIGHT - 135} // Updated: 60 (TopBar) + 75 (ToolBar) = 135px
              key={elements.length} // Force re-render on state change for web
            />
          </View>
          
          {/* Enhanced Eraser Indicator */}
          {selectedTool === 'eraser' && eraserPosition && (
            <View
              style={[
                styles.eraserIndicator,
                {
                  left: eraserPosition.x - eraserSize / 2,
                  top: eraserPosition.y - eraserSize / 2,
                  width: eraserSize,
                  height: eraserSize,
                  borderRadius: eraserSize / 2,
                },
              ]}
            />
          )}
        </View>
      </View>

      {/* Settings Panel - Hidden by default, opens as bottom sheet */}
      <SettingsPanel
        isVisible={showSettings}
        onClose={() => setShowSettings(false)}
        selectedTool={selectedTool}
        brushSize={brushSize}
        eraserSize={eraserSize}
        onBrushSizeChange={setBrushSize}
        onEraserSizeChange={setEraserSize}
        strokeColor={strokeColor}
        backgroundColor={backgroundColor}
        onStrokeColorChange={setStrokeColor}
        onBackgroundColorChange={setBackgroundColor}
        textSize={textSize}
        onTextSizeChange={setTextSize}
        selectedElementId={selectedElementId}
        selectedTextColor={selectedTextColor}
        selectedTextSize={selectedTextSize}
        onTextColorChange={handleTextColorChange}
        onSelectedTextSizeChange={handleTextSizeChange}
        onTextEdit={handleTextEdit}
        selectedShapeWidth={selectedShapeWidth}
        selectedShapeHeight={selectedShapeHeight}
        onShapeResize={handleShapeResize}
        onClear={handleClear}
        onResetZoom={resetZoom}
      />

      {/* Text Input Modal */}
      <TextInputModal
        visible={showTextModal}
        initialText={editingTextId ? elements.find(el => el.id === editingTextId)?.data?.text || '' : ''}
        onSave={handleTextSave}
        onCancel={() => {
          setShowTextModal(false);
          setEditingTextId(null);
          setIsEditingTextContent(false);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  canvasContainer: {
    flex: 1,
    margin: 12,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  canvas: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
  },
  canvasTransform: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  eraserIndicator: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    pointerEvents: 'none',
    elevation: 3,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
});

export default CanvasScreen;