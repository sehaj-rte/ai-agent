# Screen Sharing Demo Script

This script demonstrates the screen sharing feature with OCR in the ElevenLabs voice agent application.

## Setup

1. Start the application: `npm run dev`
2. Open browser to http://localhost:5000
3. Ensure you have a valid ElevenLabs API key and agent configured

## Demo Flow

### 1. Basic Screen Sharing

**Steps:**
1. Click the green phone button to start a voice call
2. Click the monitor icon (screen share button) in the call controls
3. Select a window or tab to share
4. Observe the red indicator showing active screen sharing
5. Click the monitor icon again to stop sharing

**Expected Result:**
- Screen sharing starts and stops successfully
- Red indicator appears when sharing is active
- Agent receives contextual updates about sharing status

### 2. Screen Analysis with OCR

**Steps:**
1. Start a voice call
2. Share your screen (show a document or webpage with text)
3. Say to the agent: "Can you analyze my screen?"
4. Wait for the agent's response

**Expected Result:**
- Agent calls the `analyzeScreenContent` tool
- OCR processes the screen content
- Agent responds with text found on screen
- Example response: "I can see the following text on your screen: 'Project Status Report - Q1 2025...'"

### 3. Contextual Conversation

**Steps:**
1. Share a document with specific content
2. Ask questions about the content
3. Observe how the agent references the screen content

**Example Conversation:**
```
User: "I've shared my project plan. Can you summarize it?"
Agent: "I can see your project plan shows three main tasks..."
User: "What's the timeline for the design phase?"
Agent: "According to the document, the design phase is scheduled for 3 weeks..."
```

## Troubleshooting Common Issues

### Issue: Screen share button doesn't work
**Solution:** Ensure you're using a supported browser (Chrome, Edge, Firefox) and have granted screen capture permissions.

### Issue: OCR doesn't find text
**Solution:** Make sure the shared screen has readable text with good contrast. Try sharing a different window with clearer text.

### Issue: Agent doesn't respond to screen analysis requests
**Solution:** Verify the ElevenLabs agent is configured with the `analyzeScreenContent` client tool and that the tool is set to wait for a response.

## Advanced Demo

### Multi-window Analysis
1. Share one window, ask for analysis
2. Switch to a different window
3. Ask for another analysis
4. Compare agent responses

### Real-world Scenario
1. Share an email client
2. Ask agent to summarize an important email
3. Share a document editor
4. Request help with document content

## Technical Details

### How It Works
1. Screen capture uses the browser's MediaDevices API
2. OCR is performed by Tesseract.js running locally
3. ElevenLabs client tools enable agent-triggered analysis
4. All processing happens in the user's browser (no server required)

### Privacy
- Screen content never leaves the user's device
- No server-side storage of screen captures
- Users maintain full control over sharing

This demo showcases how voice agents can be enhanced with visual capabilities for more natural and helpful interactions.
