# NexusAI Video Call Demo - UI Implementation

## Overview
A complete frontend-only AI video call demo integrated into NexusAI. No backend required - all interactions are simulated client-side using browser APIs and localStorage.

## Features
- **6 AI Personas**: Health Coach, Dietitian, Skincare Expert, Education Tutor, Therapy Assistant, Hustle Coach
- **Voice Interaction**: Uses Web Speech API (SpeechSynthesis for TTS, SpeechRecognition for STT)
- **Recording & Playback**: Client-side recording simulation with transcript sync
- **Meeting Intelligence**: Auto-generated summaries and contextual Ask-AI functionality
- **Local Persistence**: All data stored in localStorage

## Components Added
- `VideoCallButton.tsx` - Start call & view recordings buttons
- `CreateCallModal.tsx` - Persona selection and call setup
- `VideoCallScreen.tsx` - Main video call interface
- `RecordingList.tsx` - Saved recordings with playback
- `MeetingSummary.tsx` - Post-call summary and Ask-AI
- `personas.ts` - Client-side persona definitions and responses

## Integration Points
Added to the NexusAI hero section:
- "Start AI Video Call" button opens persona selection modal
- "View Recordings" button shows saved call recordings
- Both buttons have "Demo" badges indicating frontend-only simulation

## Demo Behaviors
- **Simulated AI Responses**: Pre-written responses based on persona + keyword matching
- **TTS Playback**: Uses browser SpeechSynthesis API with selectable voices
- **Speech Recognition**: Falls back to text input if browser doesn't support STT
- **Recording Simulation**: Saves transcript + metadata to localStorage
- **Summary Generation**: Extracts key points using simple text analysis
- **Ask-AI**: Searches transcript for context and returns persona-appropriate responses

## Browser Requirements
- Modern browser with SpeechSynthesis support (widely available)
- Optional: SpeechRecognition support for voice input (Chrome, Edge)
- localStorage enabled for data persistence

## Demo Notice
All components clearly labeled as "Demo Mode" with notices that this is frontend-only simulation using no real LLMs or servers.

## Usage
1. Click "Start AI Video Call" on the homepage
2. Select persona, enter meeting title, configure voice settings
3. Start call and interact via text or voice (if supported)
4. End call to generate automatic summary
5. View recordings list to replay past sessions
6. Use Ask-AI to query meeting content contextually