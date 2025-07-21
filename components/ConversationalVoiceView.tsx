import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { apiService, ConversationResponse, ConversationStartResponse } from '../services/api';

interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

const ConversationalVoiceView: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [voice, setVoice] = useState('alloy');
  const [model, setModel] = useState('gpt-4');

  useEffect(() => {
    requestPermissions();
    startNewConversation();
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

  const startNewConversation = async () => {
    try {
      setIsProcessing(true);
      console.log('Starting new conversation...');
      const response: ConversationStartResponse = await apiService.startConversation();
      
      if (response.success) {
        setConversationId(response.conversation_id);
        setConversation([{
          id: '1',
          type: 'assistant',
          content: response.message,
          timestamp: new Date(),
        }]);
        console.log('Conversation started:', response.conversation_id);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      Alert.alert('Error', 'Failed to start conversation');
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    try {
      if (!hasPermission) {
        await requestPermissions();
        return;
      }

      if (!conversationId) {
        await startNewConversation();
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          console.log('Recording status:', status);
        },
        100
      );
      
      setRecording(recording);
      setIsListening(true);
      console.log('Recording started for conversation');
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording || !conversationId) return;

    try {
      setIsListening(false);
      setIsProcessing(true);
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        await processVoiceMessage(uri);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Recording Error', 'Failed to stop recording');
      setIsProcessing(false);
    }
  };

  const processVoiceMessage = async (audioUri: string) => {
    try {
      console.log('Processing voice message for conversation:', conversationId);
      
      const response = await fetch(audioUri);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio file: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('Audio blob created, size:', blob.size, 'type:', blob.type);
      
      const result: ConversationResponse = await apiService.sendVoiceMessage(
        blob,
        conversationId!,
        voice,
        model
      );
      
      if (result.success) {
        // Add user message (transcription)
        const userMessage: ConversationMessage = {
          id: Date.now().toString(),
          type: 'user',
          content: result.message, // This should be the transcription
          timestamp: new Date(),
        };
        
        // Add assistant response
        const assistantMessage: ConversationMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: result.message, // This should be the AI response
          timestamp: new Date(),
          audioUrl: result.audio_url,
        };
        
        setConversation(prev => [...prev, userMessage, assistantMessage]);
        
        // Play audio response if available
        if (result.audio_url) {
          await playAudioResponse(result.audio_url);
        } else {
          // Fallback to text-to-speech
          await Speech.speak(result.message, {
            language: 'en',
            pitch: 1.0,
            rate: 0.9,
          });
        }
      }
    } catch (error) {
      console.error('Error processing voice message:', error);
      Alert.alert('Error', 'Failed to process voice message');
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudioResponse = async (audioUrl: string) => {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
      await sound.playAsync();
    } catch (error) {
      console.error('Error playing audio response:', error);
      // Fallback to text-to-speech
      await Speech.speak('Response received', {
        language: 'en',
        pitch: 1.0,
        rate: 0.9,
      });
    }
  };

  const handleVoiceCommand = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const clearConversation = () => {
    setConversation([]);
    startNewConversation();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Conversational Voice</Text>
      
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
        
        {conversationId && (
          <Text style={styles.conversationId}>
            Conversation: {conversationId.slice(0, 8)}...
          </Text>
        )}
      </View>

      <ScrollView style={styles.conversationContainer}>
        {conversation.map((message) => (
          <View 
            key={message.id} 
            style={[
              styles.messageContainer,
              message.type === 'user' ? styles.userMessage : styles.assistantMessage
            ]}
          >
            <Text style={styles.messageType}>
              {message.type === 'user' ? 'You' : 'Assistant'}
            </Text>
            <Text style={styles.messageContent}>{message.content}</Text>
            <Text style={styles.messageTime}>
              {message.timestamp.toLocaleTimeString()}
            </Text>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.clearButton} onPress={clearConversation}>
        <Text style={styles.clearButtonText}>New Conversation</Text>
      </TouchableOpacity>
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
    marginBottom: 20,
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
    marginBottom: 8,
  },
  conversationId: {
    fontSize: 12,
    color: '#999',
  },
  conversationContainer: {
    flex: 1,
    marginBottom: 20,
  },
  messageContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    maxWidth: '80%',
  },
  userMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-start',
  },
  messageType: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#666',
  },
  messageContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  clearButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#6c757d',
    borderRadius: 10,
    marginBottom: 20,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ConversationalVoiceView; 