import React from 'react';
import { View, Text, Platform, Dimensions } from 'react-native';
import Svg, { Path, Rect, Circle, Line, G } from 'react-native-svg';
import { CanvasItem, Transform, PathData, ShapeData, TextData } from '../utils/drawingState';

interface CanvasRendererProps {
  items: CanvasItem[];
  canvasTransform: Transform;
  backgroundColor: string;
  currentPath?: string;
  currentPathColor?: string;
  currentPathWidth?: number;
  selectedItemId?: string | null;
  width: string | number;
  height: string | number;
}

const CanvasRenderer: React.FC<CanvasRendererProps> = ({
  items,
  canvasTransform,
  backgroundColor,
  currentPath,
  currentPathColor,
  currentPathWidth,
  selectedItemId,
  width,
  height,
}) => {
  const renderItem = (item: CanvasItem) => {
    const isSelected = item.id === selectedItemId;
    const transform = `translate(${item.transform.translateX}, ${item.transform.translateY}) scale(${item.transform.scale})`;

    switch (item.type) {
      case 'path':
        const pathData = item.data as PathData;
        // Validate path data before rendering
        if (!pathData.d || pathData.d.length < 5) return null;
        
        return (
          <G key={item.id} transform={transform}>
            <Path
              d={pathData.d}
              stroke={item.strokeColor}
              strokeWidth={item.strokeWidth}
              fill={item.fillColor || 'none'}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={isSelected ? 0.7 : 1}
            />
            {isSelected && (
              <Path
                d={pathData.d}
                stroke="#007AFF"
                strokeWidth={item.strokeWidth + 2}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.3}
              />
            )}
          </G>
        );

      case 'shape':
        const shapeData = item.data as ShapeData;
        const commonProps = {
          stroke: item.strokeColor,
          strokeWidth: item.strokeWidth,
          fill: item.fillColor || 'none',
          opacity: isSelected ? 0.7 : 1,
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

          default:
            return null;
        }

        return (
          <G key={item.id} transform={transform}>
            {shapeElement}
            {isSelected && (
              <Rect
                x={shapeData.x - 5}
                y={shapeData.y - 5}
                width={shapeData.width + 10}
                height={shapeData.height + 10}
                stroke="#007AFF"
                strokeWidth={2}
                fill="none"
                strokeDasharray="5,5"
                opacity={0.7}
              />
            )}
          </G>
        );

      case 'text':
        // Text is rendered outside SVG for better control
        return null;

      default:
        return null;
    }
  };

  const renderTextItems = () => {
    return items
      .filter(item => item.type === 'text')
      .map(item => {
        const textData = item.data as TextData;
        const isSelected = item.id === selectedItemId;
        
        return (
          <View
            key={item.id}
            style={{
              position: 'absolute',
              left: (textData.x + item.transform.translateX) * canvasTransform.scale + canvasTransform.translateX,
              top: (textData.y + item.transform.translateY) * canvasTransform.scale + canvasTransform.translateY,
              transform: [{ scale: item.transform.scale * canvasTransform.scale }],
            }}
          >
            <Text
              style={{
                color: item.strokeColor,
                fontSize: textData.fontSize,
                fontFamily: textData.fontFamily || 'System',
                opacity: isSelected ? 0.7 : 1,
                backgroundColor: isSelected ? 'rgba(0, 122, 255, 0.1)' : 'transparent',
                padding: isSelected ? 4 : 0,
                borderRadius: isSelected ? 4 : 0,
              }}
            >
              {textData.text}
            </Text>
          </View>
        );
      });
  };

  return (
    <View style={{ 
      flex: 1, 
      backgroundColor,
      // Ensure canvas has real size on web
      minHeight: Platform.OS === 'web' ? Dimensions.get('window').height : undefined,
    }}>
      {/* SVG Canvas - Fixed for web rendering */}
      <Svg
        width={width}
        height={height}
        key={items.length} // Force re-render on state change
        style={Platform.OS === 'web' ? undefined : { position: 'absolute', top: 0, left: 0 }}
      >
        <G transform={`translate(${canvasTransform.translateX}, ${canvasTransform.translateY}) scale(${canvasTransform.scale})`}>
          {items.filter(item => item.type !== 'text').map(renderItem)}
          
          {/* Current drawing path - validate before rendering */}
          {currentPath && currentPath.length >= 5 && (
            <Path
              d={currentPath}
              stroke={currentPathColor || '#000000'}
              strokeWidth={currentPathWidth || 2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.8}
            />
          )}
        </G>
      </Svg>

      {/* Text items rendered as React Native Text components */}
      {renderTextItems()}
    </View>
  );
};

export default CanvasRenderer;