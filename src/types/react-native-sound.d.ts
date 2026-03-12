/**
 * Type declaration for react-native-sound
 * 
 * This library has types available via @types/react-native-sound,
 * but we include basic declarations here as a fallback.
 */

declare module 'react-native-sound' {
  type SoundCallback = (error: Error | null) => void;
  type PlayCallback = (success: boolean) => void;

  class Sound {
    static MAIN_BUNDLE: string;
    static DOCUMENT: string;
    static LIBRARY: string;
    static CACHES: string;

    static setCategory(category: string, mixWithOthers?: boolean): void;
    static setMode(mode: string): void;
    static setActive(active: boolean): void;
    static enable(enabled: boolean): void;

    constructor(
      filename: string,
      basePath?: string,
      onError?: SoundCallback
    );

    play(onEnd?: PlayCallback): this;
    pause(callback?: () => void): this;
    stop(callback?: () => void): this;
    reset(): this;
    release(): this;

    setVolume(value: number): this;
    getVolume(): number;

    setNumberOfLoops(value: number): this;
    getNumberOfLoops(): number;

    setCurrentTime(value: number): this;
    getCurrentTime(callback: (seconds: number, isPlaying: boolean) => void): void;

    getDuration(): number;
    isLoaded(): boolean;
    isPlaying(): boolean;

    setSpeed(value: number): void;
    setPan(value: number): this;
    setPitch(value: number): void;
  }

  export default Sound;
}
