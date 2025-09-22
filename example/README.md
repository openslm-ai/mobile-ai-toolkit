# Mobile AI Toolkit Example App

This example demonstrates all features of the Mobile AI Toolkit.

## Quick Start

```bash
# Clone the repo
git clone https://github.com/openslm-ai/mobile-ai-toolkit
cd mobile-ai-toolkit/example

# Install dependencies
npm install

# iOS
cd ios && pod install
npx react-native run-ios

# Android
npx react-native run-android
```

## Features Demonstrated

- **Text Sentiment Analysis** - Analyze emotions in text (on-device)
- **Smart Reply** - Generate contextual responses (on-device)
- **AI Chat** - Have conversations with AI (hybrid)
- **Device Capabilities** - Check what AI features are available

## Screenshots

The app shows:
1. Text input field
2. Multiple AI action buttons
3. Real-time results display
4. On-device vs cloud processing indicator
5. Device capabilities checker

## Key Points

- Most features run **completely free** on-device
- No API keys needed for basic features
- Works offline
- Privacy-first approach

## Customization

Edit `App.tsx` to:
- Add your proxy URL for cloud features
- Customize the UI
- Add more AI features
- Integrate with your backend