/**
 * SOSButton Component
 * 
 * A large, prominent emergency SOS button with countdown functionality.
 * 
 * Features:
 * - Large red SOS button for easy access in emergencies
 * - Visual countdown display
 * - Cancel button during countdown
 * - Status feedback (sending, completed, error states)
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Dimensions,
} from 'react-native';

import { useSOSButton } from '../hooks/useSOSButton';
import { SOSState, EmergencyContact, LocationData } from '../types/sos.types';

// Type for the location function provided by external module
type GetLocationFunction = () => Promise<LocationData>;

interface SOSButtonProps {
  /** Emergency contacts to send SOS to */
  emergencyContacts: EmergencyContact[];
  /** Countdown duration in seconds (default: 5) */
  countdownDuration?: number;
  /** Location getter function from external location module */
  getLocation?: GetLocationFunction;
  /** Custom size for the button (default: 200) */
  buttonSize?: number;
  /** Callback when SOS is triggered */
  onSOSTriggered?: () => void;
  /** Callback when SOS is cancelled */
  onSOSCancelled?: () => void;
  /** Callback when SOS completes */
  onSOSComplete?: () => void;
  /** Callback when an error occurs */
  onError?: (error: string) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DEFAULT_BUTTON_SIZE = Math.min(200, SCREEN_WIDTH * 0.5);

export function SOSButton({
  emergencyContacts,
  countdownDuration = 5,
  getLocation,
  buttonSize = DEFAULT_BUTTON_SIZE,
  onSOSTriggered,
  onSOSCancelled,
  onSOSComplete,
  onError,
}: SOSButtonProps): React.JSX.Element {
  // Hook configuration options (memoized to prevent unnecessary rerenders)
  const hookOptions = useMemo(
    () => ({
      emergencyContacts,
      countdownDuration,
      getLocation,
    }),
    [emergencyContacts, countdownDuration, getLocation]
  );

  // Use the SOS hook
  const {
    state,
    secondsRemaining,
    error,
    startSOS,
    cancelSOS,
    isCountingDown,
    isSending,
    canTrigger,
  } = useSOSButton(hookOptions);

  // Handle callbacks based on state changes
  React.useEffect(() => {
    switch (state) {
      case SOSState.COUNTDOWN:
        if (secondsRemaining === countdownDuration) {
          onSOSTriggered?.();
        }
        break;
      case SOSState.CANCELLED:
        onSOSCancelled?.();
        break;
      case SOSState.COMPLETED:
        onSOSComplete?.();
        break;
      case SOSState.ERROR:
        if (error) {
          onError?.(error);
        }
        break;
    }
  }, [state, secondsRemaining, error, countdownDuration, onSOSTriggered, onSOSCancelled, onSOSComplete, onError]);

  // Handle SOS button press
  const handleSOSPress = useCallback(() => {
    if (canTrigger) {
      startSOS();
    }
  }, [canTrigger, startSOS]);

  // Handle cancel button press
  const handleCancelPress = useCallback(() => {
    if (isCountingDown) {
      cancelSOS();
    }
  }, [isCountingDown, cancelSOS]);

  // Get status message based on current state
  const getStatusMessage = (): string => {
    switch (state) {
      case SOSState.IDLE:
        return 'Press for Emergency';
      case SOSState.COUNTDOWN:
        return `Sending alert in ${secondsRemaining}s`;
      case SOSState.CANCELLED:
        return 'Cancelled';
      case SOSState.SENDING:
        return 'Sending emergency alert...';
      case SOSState.COMPLETED:
        return 'Alert sent successfully!';
      case SOSState.ERROR:
        return error || 'An error occurred';
      default:
        return '';
    }
  };

  // Dynamic styles based on state
  const buttonStyles = useMemo(() => {
    const baseStyle = {
      width: buttonSize,
      height: buttonSize,
      borderRadius: buttonSize / 2,
    };

    switch (state) {
      case SOSState.COUNTDOWN:
        return { ...baseStyle, backgroundColor: '#FF6B6B' }; // Lighter red during countdown
      case SOSState.SENDING:
        return { ...baseStyle, backgroundColor: '#FFA500' }; // Orange when sending
      case SOSState.COMPLETED:
        return { ...baseStyle, backgroundColor: '#4CAF50' }; // Green on success
      case SOSState.ERROR:
        return { ...baseStyle, backgroundColor: '#9E9E9E' }; // Gray on error
      case SOSState.CANCELLED:
        return { ...baseStyle, backgroundColor: '#9E9E9E' }; // Gray when cancelled
      default:
        return { ...baseStyle, backgroundColor: '#FF0000' }; // Red (default)
    }
  }, [buttonSize, state]);

  // Determine if button should be disabled
  const isButtonDisabled = !canTrigger && state !== SOSState.COUNTDOWN;

  return (
    <View style={styles.container}>
      {/* Main SOS Button */}
      <TouchableOpacity
        style={[styles.sosButton, buttonStyles]}
        onPress={handleSOSPress}
        disabled={isButtonDisabled}
        activeOpacity={0.8}
        accessibilityLabel="SOS Emergency Button"
        accessibilityRole="button"
        accessibilityHint="Press and hold to send emergency alert"
      >
        {isSending ? (
          <ActivityIndicator size="large" color="#FFFFFF" />
        ) : isCountingDown ? (
          <View style={styles.countdownContainer}>
            <Text style={[styles.countdownText, { fontSize: buttonSize * 0.4 }]}>
              {secondsRemaining}
            </Text>
          </View>
        ) : (
          <Text style={[styles.sosText, { fontSize: buttonSize * 0.2 }]}>
            SOS
          </Text>
        )}
      </TouchableOpacity>

      {/* Status Message */}
      <Text style={[
        styles.statusText,
        state === SOSState.ERROR && styles.errorText,
        state === SOSState.COMPLETED && styles.successText,
      ]}>
        {getStatusMessage()}
      </Text>

      {/* Cancel Button (visible during countdown) */}
      {isCountingDown && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancelPress}
          activeOpacity={0.7}
          accessibilityLabel="Cancel SOS"
          accessibilityRole="button"
        >
          <Text style={styles.cancelButtonText}>CANCEL</Text>
        </TouchableOpacity>
      )}

      {/* Contact count indicator */}
      {state === SOSState.IDLE && (
        <Text style={styles.contactsInfo}>
          {emergencyContacts.length > 0
            ? `${emergencyContacts.length} emergency contact${emergencyContacts.length > 1 ? 's' : ''} configured`
            : 'No emergency contacts set'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  sosButton: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  sosText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  countdownContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  statusText: {
    marginTop: 20,
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    fontWeight: '500',
  },
  errorText: {
    color: '#FF0000',
  },
  successText: {
    color: '#4CAF50',
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 15,
    paddingHorizontal: 40,
    backgroundColor: '#333333',
    borderRadius: 30,
    elevation: 5,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  contactsInfo: {
    marginTop: 15,
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
});

export default SOSButton;
