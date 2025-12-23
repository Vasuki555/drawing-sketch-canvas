import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Platform } from "react-native";
import LottieView from 'lottie-react-native';

export default function SplashScreen({ navigation }: any) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate to MainStack after 3 seconds (shorter for web)
    const timer = setTimeout(() => {
      navigation.replace("MainStack");
    }, Platform.OS === 'web' ? 2000 : 5000);

    return () => clearTimeout(timer);
  }, [navigation, fadeAnim, scaleAnim]);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Lottie Animation - Only on native platforms */}
        {Platform.OS !== 'web' && (
          <LottieView
            source={require('../../assets/splash-animation.json')}
            autoPlay
            loop
            style={styles.animation}
          />
        )}
        
        {/* Web fallback - Simple animated circle */}
        {Platform.OS === 'web' && (
          <Animated.View 
            style={[
              styles.webAnimation,
              {
                transform: [{ rotate: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }) }],
              }
            ]}
          />
        )}
        
        <Text style={styles.title}>Drawing & Sketch Canvas</Text>
        <Text style={styles.subtitle}>Professional Mobile Drawing App</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#1e1b4b", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  content: {
    alignItems: "center",
  },
  animation: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  webAnimation: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#a5b4fc",
    borderTopColor: "#fff",
    marginBottom: 20,
  },
  title: { 
    color: "#fff", 
    fontSize: 28, 
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    color: "#a5b4fc",
    fontSize: 16,
    textAlign: "center",
  },
});

