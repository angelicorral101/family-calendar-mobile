import { Platform } from 'react-native';

// API Configuration
const API_BASE_URL = __DEV__
  ? Platform.OS === 'ios'
    ? 'http://localhost:8000'
    : 'http://10.0.2.2:8000' // Android emulator
  : 'https://your-production-api.com'; // Change this for production

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  attendees?: string[];
  calendar_id?: string;
}

export interface CalendarResponse {
  success: boolean;
  message: string;
  event_id?: string;
  events?: CalendarEvent[];
  error?: string;
  calendars?: any[];
}

export interface AgentResponse {
  success: boolean;
  message: string;
  calendar_response?: CalendarResponse;
  confidence: number;
  suggestions?: string[];
}

export interface ConversationResponse {
  success: boolean;
  conversation_id: string;
  message: string;
  audio_url?: string;
  calendar_response?: CalendarResponse;
  confidence: number;
  queried_date?: string[];
}

export interface ConversationStartResponse {
  success: boolean;
  conversation_id: string;
  message: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  // Process text command
  async processTextCommand(message: string, userId?: string): Promise<AgentResponse> {
    const formData = new FormData();
    formData.append('message', message);
    if (userId) {
      formData.append('user_id', userId);
    }
    const response = await fetch(`${this.baseUrl}/api/text`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }

  // Process voice command (audio file as base64 string or blob)
  async processVoiceCommand(audioData: Blob | string): Promise<AgentResponse> {
    try {
      console.log('API Service: Processing voice command');
      console.log('API Base URL:', this.baseUrl);
      console.log('Audio data type:', typeof audioData);
      
      if (audioData instanceof Blob) {
        console.log('Audio blob size:', audioData.size, 'type:', audioData.type);
      }
      
      let blob: Blob;
      
      // Handle different audio data formats
      if (audioData instanceof Blob) {
        blob = audioData;
      } else if (typeof audioData === 'string') {
        // If it's a base64 string, convert to blob first
        const response = await fetch(audioData);
        blob = await response.blob();
      } else {
        throw new Error('Invalid audio data format');
      }
      
      console.log('Final blob size:', blob.size, 'type:', blob.type);
      
      // Send as binary data directly
      const response = await fetch(`${this.baseUrl}/api/voice`, {
        method: 'POST',
        body: blob,
        headers: {
          'Content-Type': blob.type || 'audio/mp4',
          'X-Filename': 'voice_command.m4a',
        },
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Log response body for debugging
      const responseText = await response.text();
      console.log('Response body:', responseText);
      
      if (!response.ok) {
        console.error('API Error Response:', responseText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${responseText}`);
      }
      
      const result = JSON.parse(responseText);
      console.log('API Response parsed:', result);
      
      return result;
    } catch (error) {
      console.error('API Service Error:', error);
      throw error;
    }
  }

  // Get calendar events
  async getEvents(startDate?: Date, endDate?: Date, maxResults: number = 50): Promise<CalendarEvent[]> {
    const params = new URLSearchParams();
    if (startDate) {
      params.append('start_date', startDate.toISOString());
    }
    if (endDate) {
      params.append('end_date', endDate.toISOString());
    }
    params.append('max_results', maxResults.toString());
    const response = await fetch(`${this.baseUrl}/api/events?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.events || [];
  }

  // Get events for today
  async getTodayEvents(): Promise<CalendarEvent[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    return this.getEvents(startOfDay, endOfDay);
  }

  // Get events for this week
  async getWeekEvents(): Promise<CalendarEvent[]> {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
    endOfWeek.setHours(23, 59, 59, 999);
    return this.getEvents(startOfWeek, endOfWeek);
  }

  // Get events for this month
  async getMonthEvents(): Promise<CalendarEvent[]> {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    return this.getEvents(startOfMonth, endOfMonth);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Start a new conversation
  async startConversation(): Promise<ConversationStartResponse> {
    const response = await fetch(`${this.baseUrl}/api/conversation/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }

  // Send voice message and get voice response
  async sendVoiceMessage(
    audioData: Blob,
    conversationId: string,
    voice: string = 'alloy',
    model: string = 'gpt-4'
  ): Promise<ConversationResponse> {
    try {
      console.log('Sending voice message to conversation:', conversationId);
      console.log('Voice:', voice, 'Model:', model);
      
      const response = await fetch(`${this.baseUrl}/api/conversation/voice`, {
        method: 'POST',
        body: audioData,
        headers: {
          'Content-Type': audioData.type || 'audio/mp4',
          'X-Conversation-ID': conversationId,
          'X-Filename': 'voice_message.m4a',
          'X-Voice': voice,
          'X-Model': model,
        },
      });
      
      console.log('Voice response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Voice conversation response:', result);
      
      return result;
    } catch (error) {
      console.error('Voice conversation error:', error);
      throw error;
    }
  }

  // Send text message and get voice response
  async sendTextMessage(
    conversationId: string,
    message: string,
    voice: string = 'alloy',
    model: string = 'gpt-4'
  ): Promise<ConversationResponse> {
    const response = await fetch(`${this.baseUrl}/api/conversation/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        message: message,
        voice: voice,
        model: model,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  }

  // Register
  async register(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    const response = await fetch(`${this.baseUrl}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return await response.json();
  }

  // Login
  async login(email: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> {
    const response = await fetch(`${this.baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return await response.json();
  }

  // Get chores for a specific date
  async getChores(date: string, token: string): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/api/chores?date=${date}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return await response.json();
  }

  // Assign a chore to a user
  async assignChore(chore_id: string, user: string, token: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/chores/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ chore_id, user }),
    });
    return await response.json();
  }

  // Mark a chore as complete
  async completeChore(chore_id: string, token: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/chores/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ chore_id }),
    });
    return await response.json();
  }

  // Delete a chore
  async deleteChore(chore_id: string, token: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/chores/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ chore_id }),
    });
    return await response.json();
  }

  // Create a new chore
  async createChore(description: string, date: string, token: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/chores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ description, date }),
    });
    return await response.json();
  }

  // Chores voice assistant endpoint
  async choresVoiceCommand(audioData: Blob | string, token: string): Promise<any> {
    try {
      console.log('API Service: Processing chores voice command');
      console.log('API Base URL:', this.baseUrl);
      console.log('Audio data type:', typeof audioData);
      if (audioData instanceof Blob) {
        console.log('Audio blob size:', audioData.size, 'type:', audioData.type);
      }
      let blob: Blob;
      if (audioData instanceof Blob) {
        blob = audioData;
      } else if (typeof audioData === 'string') {
        const response = await fetch(audioData);
        blob = await response.blob();
      } else {
        throw new Error('Invalid audio data format');
      }
      console.log('Final blob size:', blob.size, 'type:', blob.type);
      const response = await fetch(`${this.baseUrl}/api/chores/voice`, {
        method: 'POST',
        body: blob,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': blob.type || 'audio/mp4',
          'X-Filename': 'voice_command.m4a',
        },
      });
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      const responseText = await response.text();
      console.log('Response body:', responseText);
      if (!response.ok) {
        console.error('API Error Response:', responseText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${responseText}`);
      }
      const result = JSON.parse(responseText);
      console.log('API Response parsed:', result);
      return result;
    } catch (error) {
      console.error('API Service Error:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
export default apiService; 