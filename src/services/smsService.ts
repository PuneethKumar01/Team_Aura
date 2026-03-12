/**
 * SMS Service
 * 
 * Handles sending SMS messages for emergency alerts.
 * Uses react-native-sms for Android SMS functionality.
 * 
 * Note: Requires react-native-sms package to be installed:
 * npm install react-native-sms
 * 
 * Also requires SEND_SMS permission in AndroidManifest.xml
 */

import { PermissionsAndroid, Platform } from 'react-native';
import SendSMS from 'react-native-sms';
import type { SMSResult, SMSPermissionStatus, LocationData } from '../types/sos.types';

class SMSService {
  /**
   * Check if SMS permission is granted
   */
  async checkPermission(): Promise<SMSPermissionStatus> {
    if (Platform.OS !== 'android') {
      return { granted: false, canAskAgain: false };
    }

    try {
      const result = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.SEND_SMS
      );

      return {
        granted: result,
        canAskAgain: true,
      };
    } catch (error) {
      console.error('[SMSService] Error checking permission:', error);
      return { granted: false, canAskAgain: false };
    }
  }

  /**
   * Request SMS permission from user
   */
  async requestPermission(): Promise<SMSPermissionStatus> {
    if (Platform.OS !== 'android') {
      return { granted: false, canAskAgain: false };
    }

    try {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.SEND_SMS,
        {
          title: 'SMS Permission Required',
          message:
            'This app needs SMS permission to send emergency alerts to your contacts.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        }
      );

      return {
        granted: result === PermissionsAndroid.RESULTS.GRANTED,
        canAskAgain: result !== PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN,
      };
    } catch (error) {
      console.error('[SMSService] Error requesting permission:', error);
      return { granted: false, canAskAgain: false };
    }
  }

  /**
   * Ensure SMS permission is available
   */
  async ensurePermission(): Promise<boolean> {
    const status = await this.checkPermission();
    
    if (status.granted) {
      return true;
    }

    if (status.canAskAgain) {
      const requestResult = await this.requestPermission();
      return requestResult.granted;
    }

    return false;
  }

  /**
   * Build the emergency message with location
   */
  buildEmergencyMessage(location: LocationData | null): string {
    if (location) {
      const mapsUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
      return `🚨 EMERGENCY ALERT

I need help right now.

Location:
${mapsUrl}`;
    }

    return `🚨 EMERGENCY ALERT

I need help right now.
Location unavailable.`;
  }

  /**
   * Send SOS message to a single phone number
   */
  private sendToNumber(phoneNumber: string, message: string): Promise<SMSResult> {
    return new Promise((resolve) => {
      SendSMS.send(
        {
          body: message,
          recipients: [phoneNumber],
          successTypes: ['sent', 'queued'],
          allowAndroidSendWithoutReadPermission: true,
        },
        (completed: boolean, cancelled: boolean, error: boolean) => {
          if (completed) {
            console.log(`[SMSService] SMS sent successfully to ${phoneNumber}`);
            resolve({
              success: true,
              phoneNumber,
            });
          } else if (cancelled) {
            console.warn(`[SMSService] SMS cancelled for ${phoneNumber}`);
            resolve({
              success: false,
              phoneNumber,
              error: 'SMS was cancelled',
            });
          } else if (error) {
            console.error(`[SMSService] SMS failed for ${phoneNumber}`);
            resolve({
              success: false,
              phoneNumber,
              error: 'Failed to send SMS',
            });
          } else {
            resolve({
              success: false,
              phoneNumber,
              error: 'Unknown error',
            });
          }
        }
      );
    });
  }

  /**
   * Send SOS message to multiple phone numbers
   * @param phoneNumbers - Array of phone numbers to send to
   * @param message - The emergency message to send
   */
  async sendSOSMessage(phoneNumbers: string[], message: string): Promise<SMSResult[]> {
    if (phoneNumbers.length === 0) {
      console.warn('[SMSService] No phone numbers provided');
      return [];
    }

    // Check/request permission first
    const hasPermission = await this.ensurePermission();
    
    if (!hasPermission) {
      console.error('[SMSService] SMS permission denied');
      return phoneNumbers.map((phoneNumber) => ({
        success: false,
        phoneNumber,
        error: 'SMS permission denied',
      }));
    }

    // Send to all numbers
    console.log(`[SMSService] Sending SOS to ${phoneNumbers.length} contacts`);
    
    const results: SMSResult[] = [];
    
    // Send messages sequentially to avoid overwhelming the SMS system
    for (const phoneNumber of phoneNumbers) {
      const result = await this.sendToNumber(phoneNumber, message);
      results.push(result);
    }

    const successCount = results.filter((r) => r.success).length;
    console.log(`[SMSService] SMS sending complete: ${successCount}/${phoneNumbers.length} succeeded`);

    return results;
  }

  /**
   * Send SOS with automatic message generation
   */
  async sendSOS(
    phoneNumbers: string[],
    location: LocationData | null
  ): Promise<SMSResult[]> {
    const message = this.buildEmergencyMessage(location);
    return this.sendSOSMessage(phoneNumbers, message);
  }
}

// Export singleton instance
export const smsService = new SMSService();

// Export class for testing purposes
export { SMSService };
