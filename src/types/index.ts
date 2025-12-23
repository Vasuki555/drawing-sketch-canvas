// TypeScript interfaces for the drawing app
export interface DrawingPath {
  path: string;
  color: string;
  strokeWidth: number;
}

export interface SavedDrawing {
  id: string;
  uri: string;
  jsonUri: string; // JSON file path for drawing state
  timestamp: number;
  name: string;
  isEditable: boolean; // 🆕 Indicates if drawing can be edited
}

export interface NavigationProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
    replace: (screen: string) => void;
    goBack: () => void;
    addListener: (event: string, callback: () => void) => () => void;
  };
}

export interface ColorOption {
  name: string;
  value: string;
}