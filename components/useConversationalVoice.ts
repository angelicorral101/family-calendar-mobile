import { useState, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { apiService, ConversationResponse, ConversationStartResponse } from '../services/api';
import { useCalendar } from './CalendarContext';

export function useConversationalVoice() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const { setSelectedDate, setCurrentPage } = useCalendar();
  const { setMonthRange } = useCalendar();
  const setCurrentPageRef = useRef(setCurrentPage);

  // Always keep the ref up to date
  useEffect(() => {
    setCurrentPageRef.current = setCurrentPage;
  }, [setCurrentPage]);

  // Start listening (recording)
  const startListening = async () => {
    try {
      setIsListening(true);
      setIsProcessing(false);
      // Start a new conversation if needed
      if (!conversationId) {
        const conv: ConversationStartResponse = await apiService.startConversation();
        setConversationId(conv.conversation_id);
      }
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

  // Stop listening and process
  const stopListening = async () => {
    if (!recordingRef.current) return;
    setIsListening(false);
    setIsProcessing(true);
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      if (uri) {
        await processVoiceMessage(uri);
      }
    } catch (error) {
      setIsProcessing(false);
      throw error;
    }
  };

  // Process the recorded voice message
  const processVoiceMessage = async (audioUri: string) => {
    try {
      const response = await fetch(audioUri);
      if (!response.ok) throw new Error('Failed to fetch audio file');
      const blob = await response.blob();
      if (!conversationId) throw new Error('No conversation ID');
      const result: ConversationResponse = await apiService.sendVoiceMessage(
        blob,
        conversationId,
        'alloy',
        'gpt-4'
      );
      // Use the structured queried_view and queried_date from the backend if available
      let requestedView: string | undefined = (result as any).queried_view;
      let requestedDate: Date | null = null;
      if (result.queried_date && result.queried_date.length > 0) {
        requestedDate = new Date(result.queried_date[0]);
        console.log('[ConversationalVoice] Using queried_date from backend:', requestedDate);
      }
      if (requestedView === 'week') {
        setCurrentPageRef.current(2); // Switch to WeekView (index 2)
        // Optionally, you could store the week range in context for WeekView to use
      } else if (requestedView === 'month') {
        if (result.queried_date && result.queried_date.length >= 2 && setMonthRange) {
          setMonthRange([
            new Date(result.queried_date[0]),
            new Date(result.queried_date[1])
          ]);
        }
        setCurrentPageRef.current(3); // Switch to MonthView (index 3)
        // Optionally, you could store the month range in context for MonthView to use
      } else if (requestedDate) {
        setSelectedDate(requestedDate);
        setCurrentPageRef.current(1); // Switch to TodayView (index 1)
      }
      // Play audio response or TTS
      if (result.audio_url) {
        await playAudioResponse(result.audio_url);
      } else {
        await Speech.speak(result.message, {
          language: 'en',
          pitch: 1.0,
          rate: 0.9,
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Play audio response
  const playAudioResponse = async (audioUrl: string) => {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
      await sound.playAsync();
    } catch {
      // fallback to nothing
    }
  };

  // Helper: Extract date from text (same as before)
  function extractDateFromText(text: string): Date | null {
    const today = new Date();
    const lower = text.toLowerCase();
    if (lower.includes('today')) return today;
    if (lower.includes('tomorrow')) {
      const d = new Date(today);
      d.setDate(today.getDate() + 1);
      return d;
    }
    if (lower.includes('yesterday')) {
      const d = new Date(today);
      d.setDate(today.getDate() - 1);
      return d;
    }
    const weekdays = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    for (let i = 0; i < weekdays.length; i++) {
      const wd = weekdays[i];
      const nextPattern = new RegExp(`next ${wd}`);
      const thisPattern = new RegExp(`\b${wd}\b`);
      if (nextPattern.test(lower)) {
        const d = new Date(today);
        const daysToAdd = ((7 - d.getDay() + i) % 7) + 7;
        d.setDate(d.getDate() + daysToAdd);
        return d;
      } else if (thisPattern.test(lower)) {
        const d = new Date(today);
        let daysToAdd = (i - d.getDay() + 7) % 7;
        if (daysToAdd === 0) daysToAdd = 7;
        d.setDate(d.getDate() + daysToAdd);
        return d;
      }
    }
    const dateRegex = /(\d{4}-\d{2}-\d{2})|([A-Za-z]+ \d{1,2}(?:st|nd|rd|th)?(?:,? \d{4})?)/;
    const match = text.match(dateRegex);
    if (match) {
      const dateStr = match[0];
      const iso = Date.parse(dateStr);
      if (!isNaN(iso)) return new Date(iso);
      const md = Date.parse(dateStr + ' ' + today.getFullYear());
      if (!isNaN(md)) return new Date(md);
    }
    return null;
  }

  // Optionally, expose a way to reset the conversation
  const resetConversation = () => setConversationId(null);

  return {
    isListening,
    isProcessing,
    startListening,
    stopListening,
    resetConversation,
  };
} 