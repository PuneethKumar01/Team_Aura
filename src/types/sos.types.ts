/**
 * SOS Feature Type Definitions
 * 
 * Contains all TypeScript types and interfaces for the SOS system
 */

// SOS State Machine States
export enum SOSState {
  IDLE = 'IDLE',
  COUNTDOWN = 'COUNTDOWN',
  CANCELLED = 'CANCELLED',
  SENDING = 'SENDING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

// Emergency Contact
export interface EmergencyContact {
  id: string;
  name: string;
  phoneNumber: string;
}

// Location data structure (provided by external location module)
export interface LocationData {
  latitude: number;
  longitude: number;
}

// SOS Message Result
export interface SMSResult {
  success: boolean;
  phoneNumber: string;
  error?: string;
}

// SOS Trigger Result
export interface SOSTriggerResult {
  success: boolean;
  smsResults: SMSResult[];
  location: LocationData | null;
  error?: string;
}

// Countdown callback types
export type CountdownTickCallback = (secondsRemaining: number) => void;
export type CountdownCompleteCallback = () => void;

// SOS Service State
export interface SOSServiceState {
  state: SOSState;
  secondsRemaining: number;
  error: string | null;
}

// SOS Hook Return Type
export interface UseSOSButtonReturn {
  state: SOSState;
  secondsRemaining: number;
  error: string | null;
  startSOS: () => void;
  cancelSOS: () => void;
  isCountingDown: boolean;
  isSending: boolean;
  canTrigger: boolean;
}

// SMS Permission Status
export interface SMSPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
}

// SOS Configuration
export interface SOSConfig {
  countdownDuration: number; // in seconds
  emergencyContacts: EmergencyContact[];
  enableAlarm: boolean;
  messageTemplate: string;
  locationUnavailableMessage: string;
}

// Default SOS Configuration
export const DEFAULT_SOS_CONFIG: SOSConfig = {
  countdownDuration: 5,
  emergencyContacts: [],
  enableAlarm: true,
  messageTemplate: `🚨 EMERGENCY ALERT

I need help right now.

Location:
{{LOCATION_URL}}`,
  locationUnavailableMessage: `🚨 EMERGENCY ALERT

I need help right now.
Location unavailable.`,
};
