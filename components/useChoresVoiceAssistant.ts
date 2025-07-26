import { useState, useRef } from 'react';
import { Audio } from 'expo-av';
import { useAuth } from './AuthContext';
import { apiService } from '../services/api';

export function useChoresVoiceAssistant(onResult?: (result: any) => void) {
  const { token } = useAuth();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const startListening = async () => {
    try {
      setIsListening(true);
      setIsProcessing(false);
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
    } catch (error) {
      setIsListening(false);
      setIsProcessing(false);
      throw error;
    }
  };

  const stopListening = async () => {
    if (!recordingRef.current) return;
    setIsListening(false);
    setIsProcessing(true);
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      if (uri && token) {
        await processVoiceCommand(uri, token);
      }
    } catch (error) {
      setIsProcessing(false);
      throw error;
    }
  };

  const processVoiceCommand = async (audioUri: string, token: string) => {
    try {
      const response = await fetch(audioUri);
      if (!response.ok) throw new Error('Failed to fetch audio file');
      const blob = await response.blob();
      const result = await apiService.choresVoiceCommand(blob, token);
      setLastResult(result);
      if (onResult) onResult(result);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isListening,
    isProcessing,
    startListening,
    stopListening,
    lastResult,
  };
} 