import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useConversationalVoice } from './useConversationalVoice';
import { useCalendar } from './CalendarContext';

interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

const ConversationalVoiceView: React.FC = () => {
  // Only keep chat history state here
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const { isListening, isProcessing, startListening, stopListening } = useConversationalVoice();
  const { setTriggerMic } = useCalendar();
  const startListeningRef = useRef(startListening);
  startListeningRef.current = startListening;

  // Memoize startListening to avoid infinite update loop
  // const memoizedStartListening = useCallback(() => {
  //   startListening();
  // }, [startListening]);

  // Register the global mic trigger
  useEffect(() => {
    setTriggerMic(() => startListeningRef.current);
    return () => setTriggerMic(() => {});
  }, [setTriggerMic]);

  // The rest of the chat UI remains as is
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
          onPress={isListening ? stopListening : startListening}
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
            : 'Tap to speak'}
        </Text>
      </View>
      {/* Chat history UI can remain here if you want */}
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
      {/* ...rest of the component (clear button, etc.) ... */}
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
});

export default ConversationalVoiceView; 