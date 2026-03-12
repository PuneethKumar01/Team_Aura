/**
 * useSOSButton Hook
 * 
 * Custom React hook that manages SOS button state and actions.
 * Provides a clean interface for components to interact with the SOS service.
 */

import { useEffect, useState, useCallback } from 'react';
import { sosService } from '../services/sosService';
import {
  SOSState,
  SOSServiceState,
  UseSOSButtonReturn,
  EmergencyContact,
  LocationData,
} from '../types/sos.types';

// Type for the location function provided by external module
type GetLocationFunction = () => Promise<LocationData>;

interface UseSOSButtonOptions {
  emergencyContacts?: EmergencyContact[];
  countdownDuration?: number;
  getLocation?: GetLocationFunction;
}

/**
 * Hook for managing SOS button state
 */
export function useSOSButton(options?: UseSOSButtonOptions): UseSOSButtonReturn {
  const [serviceState, setServiceState] = useState<SOSServiceState>(
    sosService.getCurrentState()
  );

  // Configure service when options change
  useEffect(() => {
    if (options) {
      sosService.configure({
        emergencyContacts: options.emergencyContacts,
        countdownDuration: options.countdownDuration,
        getLocation: options.getLocation,
      });
    }
  }, [options?.emergencyContacts, options?.countdownDuration, options?.getLocation]);

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = sosService.subscribe((state) => {
      setServiceState(state);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't destroy the service on unmount - it should persist
      // Only cancel if in countdown state when unmounting
      if (sosService.getCurrentState().state === SOSState.COUNTDOWN) {
        sosService.cancelSOS();
      }
    };
  }, []);

  // Memoized action handlers
  const startSOS = useCallback(() => {
    sosService.startSOS();
  }, []);

  const cancelSOS = useCallback(() => {
    sosService.cancelSOS();
  }, []);

  // Derived state helpers
  const isCountingDown = serviceState.state === SOSState.COUNTDOWN;
  const isSending = serviceState.state === SOSState.SENDING;
  const canTrigger = serviceState.state === SOSState.IDLE;

  return {
    state: serviceState.state,
    secondsRemaining: serviceState.secondsRemaining,
    error: serviceState.error,
    startSOS,
    cancelSOS,
    isCountingDown,
    isSending,
    canTrigger,
  };
}

export default useSOSButton;
