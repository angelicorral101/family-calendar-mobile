# Voice Commands Debugging Guide

## Common Issues and Solutions

### 1. **API Connection Issues**

**Symptoms:**
- "Network error" message
- "API endpoint not found" error
- Connection timeout

**Debugging Steps:**
1. **Test API Connection**: Use the "Test API Connection" button in the app
2. **Check API Server**: Ensure your AI playground API is running on the correct port
3. **Verify URL**: Check the API_BASE_URL in `services/api.ts`
   - iOS Simulator: `http://localhost:8000`
   - Android Emulator: `http://10.0.2.2:8000`
   - Physical Device: Use your computer's IP address

**Solutions:**
```bash
# Check if API server is running
curl http://localhost:8000/health

# If using a different port, update services/api.ts
const API_BASE_URL = 'http://localhost:YOUR_PORT';
```

### 2. **Microphone Permission Issues**

**Symptoms:**
- "Permission Error" alert
- Recording doesn't start
- Silent recording

**Debugging Steps:**
1. Check device settings for microphone permissions
2. Restart the app after granting permissions
3. Check console logs for permission status

**Solutions:**
- iOS: Settings → Privacy & Security → Microphone
- Android: Settings → Apps → Family Calendar → Permissions

### 3. **Audio Recording Issues**

**Symptoms:**
- "Error reading audio file" message
- Recording stops immediately
- No audio captured

**Debugging Steps:**
1. Check console logs for audio blob size and type
2. Verify microphone is working in other apps
3. Test with different recording durations

**Solutions:**
- Ensure microphone is not muted
- Try recording in a quieter environment
- Check if other apps can record audio

### 4. **API Response Format Issues**

**Symptoms:**
- "Server error" messages
- Unexpected response format
- JSON parsing errors

**Debugging Steps:**
1. Check console logs for API response details
2. Verify the API endpoint expects the correct format
3. Test with a simple text command first

**Expected API Response Format:**
```json
{
  "success": true,
  "message": "Your calendar shows 3 meetings today",
  "calendar_response": {
    "success": true,
    "message": "Events retrieved successfully",
    "events": [...]
  },
  "confidence": 0.95,
  "suggestions": ["Try asking about tomorrow's schedule"]
}
```

### 5. **FormData Issues**

**Symptoms:**
- "Invalid audio data format" error
- File upload failures
- 413 Payload Too Large errors

**Debugging Steps:**
1. Check audio file size in console logs
2. Verify audio format is supported
3. Test with shorter recordings

**Solutions:**
- Keep recordings under 10 seconds for testing
- Ensure audio format is WAV, MP3, or M4A
- Check API server file size limits

## Console Logging

The app now includes extensive console logging. Check your development console for:

```
Processing voice command from URI: file://...
Audio blob created, size: 12345 type: audio/wav
API Service: Processing voice command
API Base URL: http://localhost:8000
FormData created, sending request to: http://localhost:8000/api/voice
Response status: 200
API Response parsed: {success: true, message: "..."}
```

## Testing Checklist

Before reporting an issue, please check:

- [ ] API server is running and accessible
- [ ] Microphone permissions are granted
- [ ] Internet connection is stable
- [ ] Audio recording works in other apps
- [ ] Console logs show no obvious errors
- [ ] Test API Connection button works

## Quick Fixes

### Reset Permissions (iOS)
```bash
# In iOS Simulator
Settings → General → Reset → Reset Location & Privacy
```

### Clear App Data (Android)
```bash
# In Android Studio
Device File Explorer → data/data/com.yourapp → Delete
```

### Restart Development Server
```bash
# Stop current server (Ctrl+C)
# Clear cache and restart
npx expo start --clear
```

## Getting Help

If you're still experiencing issues:

1. **Collect Debug Info:**
   - Screenshot of the error message
   - Console logs from the development tools
   - API server logs (if available)

2. **Test Steps:**
   - Try the "Test API Connection" button first
   - Record a short 3-5 second audio clip
   - Check if the issue is consistent or intermittent

3. **Environment Details:**
   - Device/Simulator type
   - iOS/Android version
   - Expo SDK version
   - API server details 