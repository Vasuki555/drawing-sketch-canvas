// Navigation type definitions

export type RootStackParamList = {
  Splash: undefined;
  AuthStack: undefined;
  MainStack: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
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