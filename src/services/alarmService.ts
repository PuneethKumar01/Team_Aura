/**
 * Alarm Service
 * 
 * Handles playing and stopping the emergency alarm sound.
 * Uses react-native-sound for audio playback on Android.
 * 
 * Note: Requires react-native-sound package to be installed:
 * npm install react-native-sound
 */

import Sound from 'react-native-sound';

// Enable playback in silence mode (iOS) - not needed for Android but good practice
Sound.setCategory('Playback');

class AlarmService {
  private alarmSound: Sound | null = null;
  private isPlaying: boolean = false;
  private isLoaded: boolean = false;

  constructor() {
    this.initializeSound();
  }

  /**
   * Initialize the alarm sound
   * The alarm.mp3 file should be placed in android/app/src/main/res/raw/
   */
  private initializeSound(): void {
    // Load sound from Android raw resources
    // File should be at: android/app/src/main/res/raw/alarm.mp3
    this.alarmSound = new Sound('alarm.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.error('[AlarmService] Failed to load alarm sound:', error);
        this.isLoaded = false;
        return;
      }
      
      this.isLoaded = true;
      console.log('[AlarmService] Alarm sound loaded successfully');
      
      // Configure for looping alarm
      this.alarmSound?.setNumberOfLoops(-1); // -1 = infinite loop
      this.alarmSound?.setVolume(1.0); // Max volume
    });
  }

  /**
   * Play the emergency alarm sound
   * Loops continuously until stopped
   */
  playAlarm(): void {
    if (this.isPlaying) {
      console.warn('[AlarmService] Alarm is already playing');
      return;
    }

    if (!this.isLoaded || !this.alarmSound) {
      console.error('[AlarmService] Alarm sound not loaded, attempting reload');
      this.initializeSound();
      
      // Try to play after a short delay to allow loading
      setTimeout(() => {
        this.attemptPlay();
      }, 500);
      return;
    }

    this.attemptPlay();
  }

  /**
   * Attempt to play the sound
   */
  private attemptPlay(): void {
    if (!this.alarmSound) {
      console.error('[AlarmService] Cannot play - sound not initialized');
      return;
    }

    this.alarmSound.play((success) => {
      if (!success) {
        console.error('[AlarmService] Playback failed');
        this.isPlaying = false;
      }
    });

    this.isPlaying = true;
    console.log('[AlarmService] Alarm started');
  }

  /**
   * Stop the alarm sound
   */
  stopAlarm(): void {
    if (!this.isPlaying) {
      console.warn('[AlarmService] Alarm is not playing');
      return;
    }

    if (this.alarmSound) {
      this.alarmSound.stop(() => {
        console.log('[AlarmService] Alarm stopped');
      });
      // Reset to beginning for next play
      this.alarmSound.setCurrentTime(0);
    }

    this.isPlaying = false;
  }

  /**
   * Check if alarm is currently playing
   */
  isAlarmPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Release sound resources
   * Call this when the service is no longer needed
   */
  release(): void {
    this.stopAlarm();
    
    if (this.alarmSound) {
      this.alarmSound.release();
      this.alarmSound = null;
    }
    
    this.isLoaded = false;
    console.log('[AlarmService] Resources released');
  }

  /**
   * Reinitialize the sound (useful after release or errors)
   */
  reinitialize(): void {
    this.release();
    this.initializeSound();
  }
}

// Export singleton instance
export const alarmService = new AlarmService();

// Export class for testing purposes
export { AlarmService };
