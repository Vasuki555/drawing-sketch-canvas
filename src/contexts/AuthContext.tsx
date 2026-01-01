import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth } from '../config/firebase';

interface AuthContextType {
  currentUser: User | null;
  userId: string | null;
  email: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      if (!auth) {
        throw new Error('Firebase authentication is not available. Please check your configuration.');
      }
      console.log('Attempting login for:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful for user:', userCredential.user.uid);
    } catch (error: any) {
      console.error('Login error:', error);
      // Preserve original Firebase error codes and messages
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<void> => {
    try {
      if (!auth) {
        throw new Error('Firebase authentication is not available. Please check your configuration.');
      }
      console.log('Attempting registration for:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Registration successful for user:', userCredential.user.uid);
      
      // Update the user's display name
      await updateProfile(userCredential.user, {
        displayName: name
      });
      console.log('Profile updated with display name:', name);
    } catch (error: any) {
      console.error('Registration error:', error);
      // Preserve original Firebase error codes
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (!auth) {
        // Just clear the user state if Firebase is not available
        setCurrentUser(null);
        return;
      }
      await signOut(auth);
    } catch (error: any) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    // Check if Firebase auth is available
    if (!auth) {
      console.warn('Firebase auth not available, running in demo mode');
      setIsLoading(false);
      return;
    }

    console.log('Setting up Firebase auth listener');
    
    try {
      unsubscribe = onAuthStateChanged(
        auth, 
        (user) => {
          console.log('Auth state changed:', user ? 'authenticated' : 'not authenticated');
          setCurrentUser(user);
          setIsLoading(false);
        },
        (error) => {
          console.error('Auth state change error:', error);
          setCurrentUser(null);
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('Failed to set up auth listener:', error);
      setCurrentUser(null);
      setIsLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []); // Remove dependencies to prevent re-running

  const value: AuthContextType = {
    currentUser,
    userId: currentUser?.uid || null,
    email: currentUser?.email || null,
    isAuthenticated: !!currentUser,
    isLoading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};