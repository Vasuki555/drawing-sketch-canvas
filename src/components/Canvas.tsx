import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, StyleSheet, Text, Platform, Dimensions } from 'react-native';
import Svg, { Path, Rect, Circle, Ellipse, Line, G, Defs, Mask } from 'react-native-svg';
import { DrawingElement, Transform } from '../types/Drawing';

interface CanvasProps {
  elements: DrawingElement[];
  backgroundColor: string;
  canvasTransform: Transform;
  currentPath?: string;
  currentPathColor?: string;
  currentPathWidth?: number;
  currentPathIsEraser?: boolean;
  currentShape?: DrawingElement | null;
  selectedElementId?: string | null;
  isDragging?: boolean;
  width: number;
  height: number;
  onLayout?: (event: any) => void;
}

export interface CanvasRef {
  captureCanvas: () => Promise<string>;
}

const Canvas = forwardRef<CanvasRef, CanvasProps>(({
  elements,
  backgroundColor,
  canvasTransform,
  currentPath,
  currentPathColor,
  currentPathWidth,
  currentPathIsEraser,
  currentShape,
  selectedElementId,
  isDragging = false,
  width,
  height,
  onLayout,
}, ref) => {
  const canvasRef = useRef<View>(null);

  useImperativeHandle(ref, () => ({
    captureCanvas: async () => {
      // This will be implemented with react-native-view-shot
      return '';
    },
  }));

  const renderElement = (element: DrawingElement) => {
    const isSelected = element.id === selectedElementId;
    const isDraggingThis = isSelected && isDragging;
    const transform = `translate(${element.transform.translateX}, ${element.transform.translateY}) scale(${element.transform.scale})`;

    switch (element.type) {
      case 'path':
        // Validate path data before rendering
        if (!element.data.d || element.data.d.length < 5) return null;
        
        // Skip eraser strokes completely - they should not exist in this approach
        if (element.isEraser === true) return null;
        
        return (
          <G key={element.id} transform={transform}>
            <Path
              d={element.data.d}
              stroke={element.strokeColor}
              strokeWidth={element.strokeWidth}
              fill={element.fillColor || 'transparent'}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={isDraggingThis ? 0.8 : isSelected ? 0.9 : 1}
            />
            {isSelected && (
              <Path
                d={element.data.d}
                stroke="#007AFF"
                strokeWidth={element.strokeWidth + 2}
                fill="transparent"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.3}
              />
            )}
          </G>
        );

      case 'shape':
        const shapeData = element.data;
        const commonProps = {
          stroke: element.strokeColor,
          strokeWidth: element.strokeWidth,
          fill: element.fillColor || 'transparent',
          opacity: isDraggingThis ? 0.8 : isSelected ? 0.9 : 1,
        };

        let shapeElement;
        switch (shapeData.shape) {
          case 'line':
            shapeElement = (
              <Line
                x1={shapeData.x}
                y1={shapeData.y}
                x2={shapeData.x2 || shapeData.x}
                y2={shapeData.y2 || shapeData.y}
                {...commonProps}
              />
            );
            break;

          case 'rect':
            shapeElement = (
              <Rect
                x={shapeData.x}
                y={shapeData.y}
                width={shapeData.width}
                height={shapeData.height}
                {...commonProps}
              />
            );
            break;

          case 'square':
            const size = Math.min(shapeData.width, shapeData.height);
            shapeElement = (
              <Rect
                x={shapeData.x}
                y={shapeData.y}
                width={size}
                height={size}
                {...commonProps}
              />
            );
            break;

          case 'circle':
            const radius = Math.min(shapeData.width, shapeData.height) / 2;
            shapeElement = (
              <Circle
                cx={shapeData.x + shapeData.width / 2}
                cy={shapeData.y + shapeData.height / 2}
                r={radius}
                {...commonProps}
              />
            );
            break;

          case 'ellipse':
            shapeElement = (
              <Ellipse
                cx={shapeData.x + shapeData.width / 2}
                cy={shapeData.y + shapeData.height / 2}
                rx={shapeData.width / 2}
                ry={shapeData.height / 2}
                {...commonProps}
              />
            );
            break;

          case 'star':
            // Create a simple 5-pointed star path
            const centerX = shapeData.x + shapeData.width / 2;
            const centerY = shapeData.y + shapeData.height / 2;
            const outerRadius = Math.min(shapeData.width, shapeData.height) / 2;
            const innerRadius = outerRadius * 0.4;
            
            let starPath = '';
            for (let i = 0; i < 10; i++) {
              const angle = (i * Math.PI) / 5 - Math.PI / 2;
              const radius = i % 2 === 0 ? outerRadius : innerRadius;
              const x = centerX + radius * Math.cos(angle);
              const y = centerY + radius * Math.sin(angle);
              starPath += (i === 0 ? 'M' : 'L') + x + ',' + y;
            }
            starPath += 'Z';
            
            shapeElement = (
              <Path
                d={starPath}
                {...commonProps}
              />
            );
            break;

          default:
            return null;
        }

        return (
          <G key={element.id} transform={transform}>
            {shapeElement}
            {isSelected && (
              <>
                {/* Selection border */}
                <Rect
                  x={shapeData.x - 5}
                  y={shapeData.y - 5}
                  width={shapeData.width + 10}
                  height={shapeData.height + 10}
                  stroke="#007AFF"
                  strokeWidth={2}
                  fill="transparent"
                  strokeDasharray="5,5"
                  opacity={0.7}
                />
                {/* Resize handles */}
                <Rect
                  x={shapeData.x - 6}
                  y={shapeData.y - 6}
                  width={12}
                  height={12}
                  fill="#007AFF"
                  stroke="#fff"
                  strokeWidth={2}
                />
                <Rect
                  x={shapeData.x + shapeData.width - 6}
                  y={shapeData.y - 6}
                  width={12}
                  height={12}
                  fill="#007AFF"
                  stroke="#fff"
                  strokeWidth={2}
                />
                <Rect
                  x={shapeData.x - 6}
                  y={shapeData.y + shapeData.height - 6}
                  width={12}
                  height={12}
                  fill="#007AFF"
                  stroke="#fff"
                  strokeWidth={2}
                />
                <Rect
                  x={shapeData.x + shapeData.width - 6}
                  y={shapeData.y + shapeData.height - 6}
                  width={12}
                  height={12}
                  fill="#007AFF"
                  stroke="#fff"
                  strokeWidth={2}
                />
              </>
            )}
          </G>
        );

      case 'text':
        // Text will be rendered as React Native Text component outside SVG
        return null;

      default:
        return null;
    }
  };

  const renderTextElements = () => {
    return elements
      .filter(element => element.type === 'text')
      .map(element => {
        const textData = element.data;
        const isSelected = element.id === selectedElementId;
        const isDraggingThis = isSelected && isDragging;
        
        return (
          <View
            key={element.id}
            style={[
              styles.textElement,
              {
                left: (textData.x + element.transform.translateX) * canvasTransform.scale + canvasTransform.translateX,
                top: (textData.y + element.transform.translateY) * canvasTransform.scale + canvasTransform.translateY,
                transform: [{ scale: element.transform.scale * canvasTransform.scale }],
              },
            ]}
          >
            <View
              style={[
                styles.textContainer,
                {
                  backgroundColor: isDraggingThis ? 'rgba(0, 122, 255, 0.2)' : isSelected ? 'rgba(0, 122, 255, 0.1)' : 'transparent',
                  borderRadius: isSelected ? 4 : 0,
                  padding: isSelected ? 4 : 0,
                  borderWidth: isDraggingThis ? 2 : 0,
                  borderColor: '#007AFF',
                },
              ]}
            >
              <Text
                style={[
                  styles.text,
                  {
                    color: element.strokeColor,
                    fontSize: textData.fontSize,
                    fontFamily: textData.fontFamily || 'System',
                    opacity: isDraggingThis ? 0.8 : isSelected ? 0.9 : 1,
                  },
                ]}
              >
                {textData.text}
              </Text>
            </View>
          </View>
        );
      });
  };

  return (
    <View
      ref={canvasRef}
      style={[
        styles.container, 
        { 
          backgroundColor, 
          width, 
          height,
          // Ensure canvas has real size on web
          minHeight: Platform.OS === 'web' ? Dimensions.get('window').height : undefined,
        }
      ]}
      onLayout={onLayout}
    >
      {/* SVG Canvas - With eraser masking for partial erasing */}
      <Svg
        width={width}
        height={height}
        key={elements.length} // Force re-render on state change
        style={Platform.OS === 'web' ? undefined : StyleSheet.absoluteFillObject}
      >
        <Defs>
          {/* Create mask for eraser strokes */}
          <Mask id="eraserMask">
            {/* White background allows everything through */}
            <Rect x="0" y="0" width={width} height={height} fill="white" />
            {/* Black eraser strokes block content (create holes) */}
            <G transform={`translate(${canvasTransform.translateX}, ${canvasTransform.translateY}) scale(${canvasTransform.scale})`}>
              {elements
                .filter(element => element.type === 'path' && element.isEraser === true)
                .map(element => (
                  <Path
                    key={element.id}
                    d={element.data.d}
                    stroke="black"
                    strokeWidth={element.strokeWidth}
                    fill="transparent"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    transform={`translate(${element.transform.translateX}, ${element.transform.translateY}) scale(${element.transform.scale})`}
                  />
                ))}
              {/* Current eraser path - add to mask */}
              {currentPath && currentPathIsEraser && (
                <Path
                  d={currentPath}
                  stroke="black"
                  strokeWidth={currentPathWidth || 2}
                  fill="transparent"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </G>
          </Mask>
        </Defs>
        
        {/* Only apply mask to freehand paths, not shapes */}
        <G transform={`translate(${canvasTransform.translateX}, ${canvasTransform.translateY}) scale(${canvasTransform.scale})`}>
          {/* Render shapes without mask (so they can be deleted instantly) */}
          {elements.filter(element => element.type === 'shape').map(renderElement)}
          
          {/* Render freehand paths with mask (for partial erasing) */}
          <G mask="url(#eraserMask)">
            {elements.filter(element => element.type === 'path' && !element.isEraser).map(renderElement)}
          </G>
          
          {/* Current drawing path - validate before rendering */}
          {currentPath && currentPath.length >= 5 && !currentPathIsEraser && (
            <Path
              d={currentPath}
              stroke={currentPathColor || '#000000'}
              strokeWidth={currentPathWidth || 2}
              fill="transparent"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.8}
            />
          )}
          
          {/* Current shape preview - render while drawing shapes */}
          {currentShape && (
            <G opacity={0.6}>
              {renderElement(currentShape)}
            </G>
          )}
        </G>
      </Svg>

      {/* Text elements rendered as React Native Text */}
      {renderTextElements()}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  textElement: {
    position: 'absolute',
  },
  textContainer: {
    // Container for text with selection styling
  },
  text: {
    // Text styling will be applied inline
  },
});

export default Canvas;