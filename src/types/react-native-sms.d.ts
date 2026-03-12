/**
 * Type declaration for react-native-sms
 * 
 * This library doesn't have official TypeScript types,
 * so we provide our own declarations.
 */

declare module 'react-native-sms' {
  interface SendSMSOptions {
    /** The message body */
    body: string;
    /** Array of recipient phone numbers */
    recipients: string[];
    /** Success types for Android */
    successTypes?: ('sent' | 'queued')[];
    /** Allow sending without read permission on Android */
    allowAndroidSendWithoutReadPermission?: boolean;
  }

  type SendSMSCallback = (
    completed: boolean,
    cancelled: boolean,
    error: boolean
  ) => void;

  interface SendSMS {
    send: (options: SendSMSOptions, callback: SendSMSCallback) => void;
  }

  const SendSMS: SendSMS;
  export default SendSMS;
}
