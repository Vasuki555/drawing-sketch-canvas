// Navigation type definitions

export type RootStackParamList = {
  Splash: undefined;
  MainStack: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  Canvas: {
    editMode?: boolean;
    drawingId?: string;
    stateUri?: string;
  } | undefined;
  Gallery: undefined;
  Settings: undefined;
};