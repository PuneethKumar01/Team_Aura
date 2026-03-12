/**
 * Countdown Service
 * 
 * Handles the 5-second countdown timer for SOS activation.
 * Provides start, cancel, and tick callback functionality.
 */

import type { CountdownTickCallback, CountdownCompleteCallback } from '../types/sos.types';

class CountdownService {
  private timerId: ReturnType<typeof setInterval> | null = null;
  private secondsRemaining: number = 0;
  private isRunning: boolean = false;
  private onTick: CountdownTickCallback | null = null;
  private onComplete: CountdownCompleteCallback | null = null;

  /**
   * Start the countdown timer
   * @param durationSeconds - Duration of countdown in seconds
   * @param onTick - Callback fired every second with remaining time
   * @param onComplete - Callback fired when countdown reaches zero
   */
  startCountdown(
    durationSeconds: number,
    onTick: CountdownTickCallback,
    onComplete: CountdownCompleteCallback
  ): void {
    // Prevent multiple simultaneous countdowns
    if (this.isRunning) {
      console.warn('[CountdownService] Countdown already running, ignoring start request');
      return;
    }

    this.secondsRemaining = durationSeconds;
    this.isRunning = true;
    this.onTick = onTick;
    this.onComplete = onComplete;

    // Fire initial tick
    this.onTick(this.secondsRemaining);

    // Start interval
    this.timerId = setInterval(() => {
      this.secondsRemaining -= 1;

      if (this.secondsRemaining <= 0) {
        this.handleComplete();
      } else {
        this.onTick?.(this.secondsRemaining);
      }
    }, 1000);
  }

  /**
   * Cancel the current countdown
   */
  cancelCountdown(): void {
    if (!this.isRunning) {
      console.warn('[CountdownService] No countdown to cancel');
      return;
    }

    this.cleanup();
    console.log('[CountdownService] Countdown cancelled');
  }

  /**
   * Check if countdown is currently running
   */
  isCountdownRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get remaining seconds
   */
  getRemainingSeconds(): number {
    return this.secondsRemaining;
  }

  /**
   * Handle countdown completion
   */
  private handleComplete(): void {
    const completeCallback = this.onComplete;
    this.cleanup();
    completeCallback?.();
  }

  /**
   * Cleanup timer and reset state
   */
  private cleanup(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.isRunning = false;
    this.secondsRemaining = 0;
    this.onTick = null;
    this.onComplete = null;
  }

  /**
   * Destroy the service (cleanup on unmount)
   */
  destroy(): void {
    this.cleanup();
  }
}

// Export singleton instance
export const countdownService = new CountdownService();

// Export class for testing purposes
export { CountdownService };
