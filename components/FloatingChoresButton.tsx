import React from 'react';
import { TouchableOpacity, StyleSheet, View, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const FloatingChoresButton: React.FC<{ onPress: () => void }> = ({ onPress }) => (
  <View style={styles.container} pointerEvents="box-none">
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <MaterialCommunityIcons name="broom" size={28} color="#fff" />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 24,
    zIndex: 100,
    elevation: 10,
    pointerEvents: 'box-none',
  },
  button: {
    backgroundColor: '#4CAF50',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
});

export default FloatingChoresButton; 