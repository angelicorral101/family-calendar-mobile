# Family Calendar Mobile App

A React Native mobile app for family calendar management with voice command capabilities.

## Features

### Voice Commands
The app includes a voice command interface that integrates with the AI playground API to process natural language commands for calendar management.

#### How to Use Voice Commands:
1. Navigate to the Voice tab (first tab in the app)
2. Tap the microphone button to start recording
3. Speak your command clearly
4. Tap the microphone button again to stop recording
5. The app will process your command and respond with voice feedback

#### Example Voice Commands:
- "What do I have tomorrow?"
- "Add meeting on Friday at 3 PM"
- "Show me this week's schedule"
- "What's on my calendar today?"
- "Schedule a doctor appointment"
- "When is my next meeting?"

#### Features:
- **Real-time Recording**: Visual feedback during recording
- **Voice Response**: The app speaks back the response
- **Error Handling**: Graceful handling of recording and API errors
- **Permission Management**: Automatic microphone permission requests
- **Response History**: View and clear previous responses

## Technical Implementation

### Dependencies
- `expo-av`: Audio recording and playback
- `expo-speech`: Text-to-speech functionality
- `react-native-gesture-handler`: Swipe navigation
- `react-native-reanimated`: Smooth animations

### API Integration
The voice commands are processed through the AI playground API endpoint:
- **Endpoint**: `/api/voice`
- **Method**: POST
- **Input**: Audio blob
- **Output**: JSON response with calendar actions and voice feedback

### Permissions
The app requires microphone permissions for voice recording:
- iOS: `NSMicrophoneUsageDescription`
- Android: `android.permission.RECORD_AUDIO`

## Development

### Setup
```bash
npm install
```

### Running the App
```bash
npm start
```

### Building
```bash
npm run android  # For Android
npm run ios      # For iOS
```

## Project Structure

```
family-calendar-mobile/
├── components/
│   ├── VoiceCommandView.tsx    # Voice commands interface
│   ├── TodayView.tsx           # Today's calendar view
│   ├── WeekView.tsx            # Weekly calendar view
│   └── MonthView.tsx           # Monthly calendar view
├── services/
│   └── api.ts                  # API service for voice commands
├── App.tsx                     # Main app component
└── app.json                    # Expo configuration
```

## API Configuration

The app is configured to connect to the AI playground API:
- **Development**: `http://localhost:8000` (iOS) / `http://10.0.2.2:8000` (Android)
- **Production**: Update the `API_BASE_URL` in `services/api.ts`

## Troubleshooting

### Voice Recording Issues
1. Ensure microphone permissions are granted
2. Check that the device microphone is working
3. Verify API endpoint is accessible

### API Connection Issues
1. Check the API server is running
2. Verify the correct API base URL is configured
3. Ensure network connectivity 