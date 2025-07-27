import React, { useEffect, useState } from 'react';
import { TouchableOpacity, StyleSheet, View, Platform, Animated, Text, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useConversationalVoice } from './useConversationalVoice';

const FloatingMicButton: React.FC = () => {
  const { isListening, isProcessing, startListening, stopListening } = useConversationalVoice();
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    Dimensions.get('window').width > Dimensions.get('window').height ? 'landscape' : 'portrait'
  );

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      const newOrientation = window.width > window.height ? 'landscape' : 'portrait';
      setOrientation(newOrientation);
    });

    return () => subscription?.remove();
  }, []);

  const handlePress = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <View style={[
      styles.container,
      orientation === 'landscape' && styles.containerLandscape
    ]} pointerEvents="box-none">
      <TouchableOpacity
        style={[styles.button, isListening && styles.buttonGlow]}
        onPress={handlePress}
        activeOpacity={0.8}
        disabled={isProcessing}
      >
        <MaterialCommunityIcons name="microphone" size={32} color="#fff" />
      </TouchableOpacity>
      {isListening && (
        <View style={[
          styles.listeningOverlay,
          orientation === 'landscape' && styles.listeningOverlayLandscape
        ]}>
          <Text style={styles.listeningText}>Listening…</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 24,
    right: 24,
    zIndex: 100,
    elevation: 10,
    pointerEvents: 'box-none',
  },
  containerLandscape: {
    bottom: Platform.OS === 'ios' ? 20 : 16,
    right: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  buttonGlow: {
    shadowColor: '#00e6ff',
    shadowOpacity: 0.8,
    shadowRadius: 16,
    backgroundColor: '#00e6ff',
  },
  listeningOverlay: {
    position: 'absolute',
    bottom: 80,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  listeningOverlayLandscape: {
    bottom: 60,
  },
  listeningText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default FloatingMicButton; 