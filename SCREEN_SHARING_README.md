# Screen Sharing with OCR for ElevenLabs Voice Agent

This implementation adds screen sharing capabilities with OCR (Optical Character Recognition) to your ElevenLabs voice agent application.

## Features

1. **Screen Sharing**: Users can share their screen during voice conversations
2. **OCR Analysis**: The agent can analyze screen content and read text
3. **Voice Integration**: Users can ask the agent to analyze their screen
4. **Real-time Updates**: Agent is notified when screen sharing starts/stops

## How It Works

### 1. Screen Sharing
- Click the screen share button (monitor icon) during a voice call
- Browser prompts to select what to share (screen, window, or tab)
- Red indicator shows active screen sharing
- Click again to stop sharing

### 2. OCR Analysis
- During a call, say: "Can you analyze my screen?" or "What do you see?"
- The agent calls the `analyzeScreenContent` client tool
- Current screen frame is captured and processed with Tesseract.js OCR
- Extracted text is returned to the agent for conversation

### 3. Technical Implementation

#### Key Components:
- **Tesseract.js**: Performs OCR directly in the browser
- **MediaDevices API**: Captures screen content
- **ElevenLabs Client Tools**: Enables agent to trigger screen analysis
- **React State Management**: Tracks screen sharing status

#### Data Flow:
1. User clicks screen share button
2. Browser requests screen capture permission
3. Screen stream is stored in component state
4. User asks agent to analyze screen
5. Agent calls `analyzeScreenContent` tool
6. Tool captures frame and runs OCR
7. Extracted text is returned to agent
8. Agent incorporates findings into conversation

## Usage Examples

### Starting Screen Share
```
User: "I'd like to share my screen so you can see this document"
(After clicking screen share button)
User: "Go ahead and analyze what you see"
Agent: "I can see the following text on your screen: 'Project Status Report - Q1 2025...'
```

### Document Review
```
User: "Can you help me summarize this email?"
(After sharing email window)
User: "Please analyze my screen"
Agent: "I see an email from your manager about the quarterly review..."
```

## Privacy & Security

- All processing happens locally in the browser
- Screen content never leaves the user's device
- No server-side storage of screen captures
- Users control when sharing is active

## Limitations

- OCR works best with clear, high-contrast text
- Complex layouts or low-quality screens may reduce accuracy
- Only text content is analyzed (no image recognition)
- Performance depends on user's device capabilities

## Future Enhancements

1. **Layout Analysis**: Better understanding of screen structure
2. **UI Element Detection**: Identify buttons, forms, navigation
3. **Image Recognition**: Identify charts, photos, icons
4. **Backend Processing**: Send screenshots to advanced AI models
5. **Multi-language Support**: OCR for languages beyond English

## Troubleshooting

### Screen Share Button Not Working
- Ensure browser supports Screen Capture API (Chrome, Edge, Firefox)
- Check browser permissions for screen capture
- Verify HTTPS is used (required for screen capture)

### OCR Not Returning Results
- Check if screen has readable text content
- Ensure good contrast between text and background
- Try sharing a different window or tab

### Agent Not Responding to Screen Requests
- Verify `analyzeScreenContent` tool is registered
- Check browser console for errors
- Ensure ElevenLabs agent is configured to use client tools
