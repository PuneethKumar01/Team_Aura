/**
 * SOS Service - Main Orchestrator
 * 
 * This is the central state machine that coordinates the entire SOS flow:
 * 1. Starting the countdown
 * 2. Playing the alarm
 * 3. Handling cancellation
 * 4. Getting location and sending SMS
 * 
 * States: IDLE -> COUNTDOWN -> SENDING -> COMPLETED
 *                    |
 *                    v
 *               CANCELLED
 */

import { countdownService } from './countdownService';
import { alarmService } from './alarmService';
import { smsService } from './smsService';
import {
  SOSState,
  SOSServiceState,
  SOSTriggerResult,
  EmergencyContact,
  LocationData,
  DEFAULT_SOS_CONFIG,
} from '../types/sos.types';

// Type for the location function provided by external module
type GetLocationFunction = () => Promise<LocationData>;

// State change listener type
type StateChangeListener = (state: SOSServiceState) => void;

class SOSService {
  private state: SOSState = SOSState.IDLE;
  private secondsRemaining: number = 0;
  private error: string | null = null;
  private listeners: Set<StateChangeListener> = new Set();
  private emergencyContacts: EmergencyContact[] = [];
  private countdownDuration: number = DEFAULT_SOS_CONFIG.countdownDuration;
  private getLocationFn: GetLocationFunction | null = null;

  /**
   * Configure the SOS service
   */
  configure(options: {
    emergencyContacts?: EmergencyContact[];
    countdownDuration?: number;
    getLocation?: GetLocationFunction;
  }): void {
    if (options.emergencyContacts) {
      this.emergencyContacts = options.emergencyContacts;
    }
    if (options.countdownDuration) {
      this.countdownDuration = options.countdownDuration;
    }
    if (options.getLocation) {
      this.getLocationFn = options.getLocation;
    }
    
    console.log('[SOSService] Configured with', {
      contactsCount: this.emergencyContacts.length,
      countdownDuration: this.countdownDuration,
      hasLocationFn: !!this.getLocationFn,
    });
  }

  /**
   * Set emergency contacts
   */
  setEmergencyContacts(contacts: EmergencyContact[]): void {
    this.emergencyContacts = contacts;
    console.log(`[SOSService] Set ${contacts.length} emergency contacts`);
  }

  /**
   * Set the location getter function (provided by external location module)
   */
  setLocationGetter(fn: GetLocationFunction): void {
    this.getLocationFn = fn;
    console.log('[SOSService] Location getter configured');
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: StateChangeListener): () => void {
    this.listeners.add(listener);
    
    // Immediately notify with current state
    listener(this.getCurrentState());
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current service state
   */
  getCurrentState(): SOSServiceState {
    return {
      state: this.state,
      secondsRemaining: this.secondsRemaining,
      error: this.error,
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    const currentState = this.getCurrentState();
    this.listeners.forEach((listener) => listener(currentState));
  }

  /**
   * Update internal state and notify listeners
   */
  private setState(
    newState: SOSState,
    secondsRemaining?: number,
    error?: string | null
  ): void {
    this.state = newState;
    
    if (secondsRemaining !== undefined) {
      this.secondsRemaining = secondsRemaining;
    }
    
    if (error !== undefined) {
      this.error = error;
    }
    
    console.log(`[SOSService] State: ${newState}`, {
      secondsRemaining: this.secondsRemaining,
      error: this.error,
    });
    
    this.notifyListeners();
  }

  /**
   * Start the SOS countdown
   */
  startSOS(): boolean {
    // Prevent starting if already active
    if (this.state === SOSState.COUNTDOWN || this.state === SOSState.SENDING) {
      console.warn('[SOSService] SOS already in progress');
      return false;
    }

    // Check if we have contacts
    if (this.emergencyContacts.length === 0) {
      console.warn('[SOSService] No emergency contacts configured');
      this.setState(SOSState.ERROR, 0, 'No emergency contacts configured');
      
      // Reset to idle after showing error
      setTimeout(() => {
        this.setState(SOSState.IDLE, 0, null);
      }, 3000);
      
      return false;
    }

    console.log('[SOSService] Starting SOS countdown');
    
    // Clear any previous error
    this.error = null;
    
    // Start alarm
    alarmService.playAlarm();
    
    // Start countdown
    this.setState(SOSState.COUNTDOWN, this.countdownDuration);
    
    countdownService.startCountdown(
      this.countdownDuration,
      // On tick
      (remaining) => {
        this.setState(SOSState.COUNTDOWN, remaining);
      },
      // On complete
      () => {
        this.handleCountdownComplete();
      }
    );

    return true;
  }

  /**
   * Cancel the SOS
   */
  cancelSOS(): boolean {
    if (this.state !== SOSState.COUNTDOWN) {
      console.warn('[SOSService] Cannot cancel - not in countdown state');
      return false;
    }

    console.log('[SOSService] Cancelling SOS');
    
    // Stop countdown
    countdownService.cancelCountdown();
    
    // Stop alarm
    alarmService.stopAlarm();
    
    // Update state
    this.setState(SOSState.CANCELLED, 0);
    
    // Reset to idle after a brief moment
    setTimeout(() => {
      this.setState(SOSState.IDLE, 0, null);
    }, 1000);

    return true;
  }

  /**
   * Handle countdown completion - trigger emergency
   */
  private async handleCountdownComplete(): Promise<void> {
    console.log('[SOSService] Countdown complete - triggering emergency');
    
    // Stop alarm
    alarmService.stopAlarm();
    
    // Update state to sending
    this.setState(SOSState.SENDING, 0);
    
    try {
      // Get location (if available)
      let location: LocationData | null = null;
      
      if (this.getLocationFn) {
        try {
          console.log('[SOSService] Getting location...');
          location = await this.getLocationFn();
          console.log('[SOSService] Location obtained:', location);
        } catch (locationError) {
          console.warn('[SOSService] Failed to get location:', locationError);
          // Continue without location
        }
      } else {
        console.warn('[SOSService] No location getter configured');
      }

      // Get phone numbers from contacts
      const phoneNumbers = this.emergencyContacts.map((c) => c.phoneNumber);
      
      // Send SMS
      console.log('[SOSService] Sending SMS to contacts...');
      const smsResults = await smsService.sendSOS(phoneNumbers, location);
      
      // Check results
      const successCount = smsResults.filter((r) => r.success).length;
      const totalCount = smsResults.length;
      
      if (successCount > 0) {
        console.log(`[SOSService] SOS completed: ${successCount}/${totalCount} messages sent`);
        this.setState(SOSState.COMPLETED, 0);
      } else {
        console.error('[SOSService] All SMS failed');
        this.setState(SOSState.ERROR, 0, 'Failed to send emergency messages');
      }
      
      // Reset to idle after delay
      setTimeout(() => {
        this.setState(SOSState.IDLE, 0, null);
      }, 5000);
      
    } catch (error) {
      console.error('[SOSService] Error during SOS trigger:', error);
      this.setState(
        SOSState.ERROR,
        0,
        error instanceof Error ? error.message : 'Failed to send emergency'
      );
      
      // Reset to idle after delay
      setTimeout(() => {
        this.setState(SOSState.IDLE, 0, null);
      }, 5000);
    }
  }

  /**
   * Trigger SOS immediately (skip countdown)
   * Useful for testing or extreme emergencies
   */
  async triggerImmediately(): Promise<SOSTriggerResult> {
    if (this.state !== SOSState.IDLE) {
      return {
        success: false,
        smsResults: [],
        location: null,
        error: 'SOS already in progress',
      };
    }

    if (this.emergencyContacts.length === 0) {
      return {
        success: false,
        smsResults: [],
        location: null,
        error: 'No emergency contacts configured',
      };
    }

    this.setState(SOSState.SENDING, 0);
    
    let location: LocationData | null = null;
    
    if (this.getLocationFn) {
      try {
        location = await this.getLocationFn();
      } catch {
        // Continue without location
      }
    }

    const phoneNumbers = this.emergencyContacts.map((c) => c.phoneNumber);
    const smsResults = await smsService.sendSOS(phoneNumbers, location);
    
    const success = smsResults.some((r) => r.success);
    
    this.setState(success ? SOSState.COMPLETED : SOSState.ERROR, 0);
    
    setTimeout(() => {
      this.setState(SOSState.IDLE, 0, null);
    }, 5000);

    return {
      success,
      smsResults,
      location,
      error: success ? undefined : 'Failed to send some or all messages',
    };
  }

  /**
   * Check if SOS can be triggered
   */
  canTrigger(): boolean {
    return (
      this.state === SOSState.IDLE &&
      this.emergencyContacts.length > 0
    );
  }

  /**
   * Reset service to initial state
   */
  reset(): void {
    countdownService.cancelCountdown();
    alarmService.stopAlarm();
    this.setState(SOSState.IDLE, 0, null);
  }

  /**
   * Cleanup service resources
   */
  destroy(): void {
    this.reset();
    this.listeners.clear();
    countdownService.destroy();
    alarmService.release();
  }
}

// Export singleton instance
export const sosService = new SOSService();

// Export class for testing purposes
export { SOSService };
