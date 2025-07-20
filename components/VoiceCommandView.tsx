import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { apiService, AgentResponse } from '../services/api';

const VoiceCommandView: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [lastCommand, setLastCommand] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Permission Error', 'Unable to access microphone');
    }
  };

  const startRecording = async () => {
    try {
      if (!hasPermission) {
        await requestPermissions();
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          // Log recording status for debugging
          console.log('Recording status:', status);
        },
        100 // Update interval in milliseconds
      );
      
      setRecording(recording);
      setIsListening(true);
      console.log('Recording started successfully');
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsListening(false);
      setIsProcessing(true);
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        await processVoiceCommand(uri);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Recording Error', 'Failed to stop recording');
      setIsProcessing(false);
    }
  };

  const processVoiceCommand = async (audioUri: string) => {
    try {
      console.log('Processing voice command from URI:', audioUri);
      console.log('Audio URI type:', typeof audioUri);
      console.log('Audio URI path:', audioUri);
      
      // Convert audio file to blob for API
      const response = await fetch(audioUri);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio file: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('Audio blob created, size:', blob.size, 'type:', blob.type);
      console.log('Audio blob details:', {
        size: blob.size,
        type: blob.type,
        lastModified: new Date().getTime()
      });
      
      // Send to AI playground API
      console.log('Sending to API endpoint...');
      const result: AgentResponse = await apiService.processVoiceCommand(blob);
      console.log('API response received:', result);
      
      setLastResponse(result.message);
      
      // Speak the response if it's successful
      if (result.success && result.message) {
        await Speech.speak(result.message, {
          language: 'en',
          pitch: 1.0,
          rate: 0.9,
        });
      }

      // Handle calendar actions if any
      if (result.calendar_response) {
        handleCalendarResponse(result.calendar_response);
      }

    } catch (error) {
      console.error('Error processing voice command:', error);
      
      let errorMessage = 'Sorry, I couldn\'t process your voice command. Please try again.';
      
      // Provide more specific error messages based on the error type
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage = 'Network error: Please check your internet connection and try again.';
        } else if (error.message.includes('HTTP error! status: 404')) {
          errorMessage = 'API endpoint not found. Please check the server configuration.';
        } else if (error.message.includes('HTTP error! status: 500')) {
          errorMessage = 'Server error: The voice processing service is temporarily unavailable.';
        } else if (error.message.includes('HTTP error! status: 413')) {
          errorMessage = 'Audio file too large. Please try a shorter recording.';
        } else if (error.message.includes('Failed to fetch audio file')) {
          errorMessage = 'Error reading audio file. Please try recording again.';
        }
      }
      
      setLastResponse(`Error: ${errorMessage}`);
      
      // Don't speak the error message to avoid confusion
      // await Speech.speak(errorMessage, {
      //   language: 'en',
      //   pitch: 1.0,
      //   rate: 0.9,
      // });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCalendarResponse = (calendarResponse: any) => {
    if (calendarResponse.success) {
      // Handle successful calendar operations
      console.log('Calendar operation successful:', calendarResponse.message);
    } else {
      // Handle calendar errors
      console.error('Calendar operation failed:', calendarResponse.error);
    }
  };

  const handleVoiceCommand = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const clearHistory = () => {
    setLastCommand('');
    setLastResponse('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Voice Commands</Text>
      
      <View style={styles.voiceSection}>
        <TouchableOpacity 
          style={[
            styles.micButton, 
            isListening && styles.micButtonListening,
            isProcessing && styles.micButtonProcessing
          ]}
          onPress={handleVoiceCommand}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <Text style={styles.micIcon}>🎤</Text>
          )}
        </TouchableOpacity>
        
        <Text style={styles.voiceStatus}>
          {isProcessing 
            ? 'Processing...' 
            : isListening 
              ? 'Listening... Tap to stop' 
              : 'Tap to speak'
          }
        </Text>
      </View>

      {lastResponse && (
        <View style={styles.responseSection}>
          <Text style={styles.sectionTitle}>Last Response:</Text>
          <View style={styles.responseBox}>
            <Text style={styles.responseText}>{lastResponse}</Text>
          </View>
          <TouchableOpacity style={styles.clearButton} onPress={clearHistory}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.suggestionsSection}>
        <Text style={styles.sectionTitle}>Voice Recording Tips:</Text>
        <Text style={styles.tipText}>• Speak clearly and at a normal volume</Text>
        <Text style={styles.tipText}>• Record in a quiet environment</Text>
        <Text style={styles.tipText}>• Keep recordings between 3-10 seconds</Text>
        <Text style={styles.tipText}>• Hold device close to your mouth</Text>
        
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Try saying:</Text>
        <Text style={styles.suggestionText}>• "What do I have tomorrow?"</Text>
        <Text style={styles.suggestionText}>• "Add meeting on Friday at 3 PM"</Text>
        <Text style={styles.suggestionText}>• "Show me this week's schedule"</Text>
        <Text style={styles.suggestionText}>• "What's on my calendar today?"</Text>
        <Text style={styles.suggestionText}>• "Schedule a doctor appointment"</Text>
        <Text style={styles.suggestionText}>• "When is my next meeting?"</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  voiceSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  micButtonListening: {
    backgroundColor: '#FF3B30',
  },
  micButtonProcessing: {
    backgroundColor: '#FF9500',
  },
  micIcon: {
    fontSize: 32,
  },
  voiceStatus: {
    fontSize: 16,
    color: '#666',
  },
  responseSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#495057',
  },
  responseBox: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    marginBottom: 12,
  },
  responseText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  clearButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#6c757d',
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  suggestionsSection: {
    paddingHorizontal: 0,
  },
  suggestionText: {
    fontSize: 14,
    color: '#1976d2',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
});

export default VoiceCommandView;
 