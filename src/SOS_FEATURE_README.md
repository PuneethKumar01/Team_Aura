# SOS Feature Documentation

## Overview

The SOS feature provides a one-tap emergency alert system that:
1. Initiates a 5-second countdown with alarm
2. Allows cancellation during countdown
3. Sends SMS with location to emergency contacts

## Architecture

```
src/
├── components/
│   ├── SOSButton.tsx        # Main UI component
│   └── index.ts
├── hooks/
│   ├── useSOSButton.ts      # React hook for SOS state
│   └── index.ts
├── services/
│   ├── sosService.ts        # Main orchestrator (state machine)
│   ├── smsService.ts        # SMS sending logic
│   ├── alarmService.ts      # Audio playback
│   ├── countdownService.ts  # Timer management
│   └── index.ts
├── screens/
│   ├── SOSScreen.tsx        # Example usage screen
│   └── index.ts
└── types/
    ├── sos.types.ts         # TypeScript definitions
    ├── react-native-sms.d.ts
    ├── react-native-sound.d.ts
    └── index.ts
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install react-native-sms react-native-sound
```

### 2. Add Alarm Sound

Place an alarm sound file at:
```
android/app/src/main/res/raw/alarm.mp3
```

> **Note:** You can download a free alarm sound or use any MP3 file. Rename it to `alarm.mp3`.

### 3. Android Permissions

The following permissions have been added to `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.SEND_SMS" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

### 4. Link Native Modules (if needed)

For React Native 0.84+, auto-linking should work. If not:

```bash
cd android && ./gradlew clean
cd ..
npm run android
```

## Usage

### Basic Usage

```tsx
import { SOSButton } from './src/components';

function App() {
  const emergencyContacts = [
    { id: '1', name: 'Mom', phoneNumber: '+1234567890' },
    { id: '2', name: 'Dad', phoneNumber: '+0987654321' },
  ];

  return (
    <SOSButton
      emergencyContacts={emergencyContacts}
      countdownDuration={5}
      getLocation={getCurrentLocation}
    />
  );
}
```

### With Callbacks

```tsx
<SOSButton
  emergencyContacts={contacts}
  getLocation={getCurrentLocation}
  onSOSTriggered={() => console.log('SOS started')}
  onSOSCancelled={() => console.log('Cancelled')}
  onSOSComplete={() => console.log('Messages sent')}
  onError={(error) => console.error(error)}
/>
```

### Using the Hook Directly

```tsx
import { useSOSButton } from './src/hooks';

function CustomSOSComponent() {
  const {
    state,
    secondsRemaining,
    startSOS,
    cancelSOS,
    isCountingDown,
    isSending,
  } = useSOSButton({
    emergencyContacts: contacts,
    getLocation: getCurrentLocation,
  });

  // Build your custom UI
}
```

## State Machine

```
IDLE → COUNTDOWN → SENDING → COMPLETED
           ↓
       CANCELLED

States:
- IDLE: Ready to trigger
- COUNTDOWN: 5-second countdown active
- CANCELLED: User cancelled
- SENDING: Sending SMS
- COMPLETED: Successfully sent
- ERROR: Something went wrong
```

## Location Integration

The location module is provided by another developer. The expected interface:

```typescript
async function getCurrentLocation(): Promise<{
  latitude: number;
  longitude: number;
}>;
```

Pass this function to the SOSButton:

```tsx
<SOSButton
  getLocation={getCurrentLocation}
  // ... other props
/>
```

If location fails, SMS is still sent with "Location unavailable" message.

## SMS Message Format

**With Location:**
```
🚨 EMERGENCY ALERT

I need help right now.

Location:
https://maps.google.com/?q=12.9716,77.5946
```

**Without Location:**
```
🚨 EMERGENCY ALERT

I need help right now.
Location unavailable.
```

## Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| Multiple SOS presses | Ignored while countdown/sending active |
| Cancel at last second | Countdown stops, state resets |
| Location fails | SMS sent without location |
| No contacts | Error message displayed |
| SMS permission denied | Error with guidance |

## File Descriptions

### SOSButton.tsx
Main UI component with:
- Large red SOS button
- Countdown display
- Cancel button
- Status messages

### sosService.ts
State machine orchestrator that:
- Manages SOS state transitions
- Coordinates countdown, alarm, and SMS
- Provides subscription-based state updates

### smsService.ts
SMS functionality:
- Permission handling
- Message building
- Multi-recipient sending

### countdownService.ts
Timer management:
- Start/cancel countdown
- Tick callbacks
- Completion callback

### alarmService.ts
Audio playback:
- Load alarm sound
- Play/stop with looping
- Resource management

## Testing

```bash
npm test
```

For manual testing:
1. Set up test phone numbers
2. Run on Android device/emulator
3. Press SOS button
4. Verify countdown and alarm
5. Let it complete or cancel
6. Check SMS delivery

## Troubleshooting

### Alarm not playing
- Ensure `alarm.mp3` exists in `android/app/src/main/res/raw/`
- Rebuild the app after adding the file

### SMS not sending
- Check SMS permission in device settings
- Verify phone numbers are valid format
- Test on real device (emulator may not support SMS)

### Permission issues
- Run `npx react-native run-android` to rebuild
- Clear app data and reinstall if permissions stuck

## Dependencies

- `react-native-sms`: ^1.11.0
- `react-native-sound`: ^0.11.2

## Author

Team Aura - Hackathon 2026
