/**
 * SOSScreen
 * 
 * Example screen demonstrating how to use the SOS feature.
 * This can be integrated into your app's navigation.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
} from 'react-native';

import { SOSButton } from '../components';
import { EmergencyContact, LocationData } from '../types';

/**
 * Mock location function - Replace with actual location module
 * 
 * The other developer will implement this function.
 * It should return a Promise with latitude and longitude.
 */
async function getCurrentLocation(): Promise<LocationData> {
  // TODO: Replace with actual location module implementation
  // This is a placeholder that simulates location fetching
  
  return new Promise((resolve, reject) => {
    // Simulate network delay
    setTimeout(() => {
      // For testing, return a sample location
      // In production, this would use the actual device location
      resolve({
        latitude: 12.9716,  // Example: Bangalore
        longitude: 77.5946,
      });
      
      // Uncomment to test location failure scenario:
      // reject(new Error('Location unavailable'));
    }, 1000);
  });
}

/**
 * SOSScreen Component
 * 
 * Displays the SOS button and handles emergency triggers
 */
export function SOSScreen(): React.JSX.Element {
  // Emergency contacts - In production, load from storage/settings
  const [emergencyContacts] = useState<EmergencyContact[]>([
    {
      id: '1',
      name: 'Emergency Contact 1',
      phoneNumber: '+1234567890', // Replace with actual number
    },
    {
      id: '2',
      name: 'Emergency Contact 2',
      phoneNumber: '+0987654321', // Replace with actual number
    },
  ]);

  // Event handlers
  const handleSOSTriggered = useCallback(() => {
    console.log('[SOSScreen] SOS triggered - countdown started');
  }, []);

  const handleSOSCancelled = useCallback(() => {
    console.log('[SOSScreen] SOS cancelled by user');
    Alert.alert('Cancelled', 'Emergency alert was cancelled.');
  }, []);

  const handleSOSComplete = useCallback(() => {
    console.log('[SOSScreen] SOS complete - messages sent');
    Alert.alert(
      'Alert Sent',
      'Emergency messages have been sent to your contacts.',
      [{ text: 'OK' }]
    );
  }, []);

  const handleError = useCallback((error: string) => {
    console.error('[SOSScreen] SOS error:', error);
    Alert.alert('Error', error);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Emergency SOS</Text>
          <Text style={styles.subtitle}>
            Press the button below in case of emergency
          </Text>
        </View>

        {/* SOS Button */}
        <View style={styles.buttonContainer}>
          <SOSButton
            emergencyContacts={emergencyContacts}
            countdownDuration={5}
            getLocation={getCurrentLocation}
            buttonSize={200}
            onSOSTriggered={handleSOSTriggered}
            onSOSCancelled={handleSOSCancelled}
            onSOSComplete={handleSOSComplete}
            onError={handleError}
          />
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>1</Text>
            <Text style={styles.infoText}>Press the SOS button</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>2</Text>
            <Text style={styles.infoText}>5-second countdown with alarm</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>3</Text>
            <Text style={styles.infoText}>Cancel if pressed by mistake</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>4</Text>
            <Text style={styles.infoText}>SMS sent with your location</Text>
          </View>
        </View>

        {/* Emergency Contacts Preview */}
        <View style={styles.contactsSection}>
          <Text style={styles.contactsTitle}>Emergency Contacts:</Text>
          {emergencyContacts.map((contact) => (
            <View key={contact.id} style={styles.contactItem}>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.contactPhone}>{contact.phoneNumber}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 5,
    textAlign: 'center',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    minHeight: 350,
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF0000',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: 'bold',
    marginRight: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#555555',
    flex: 1,
  },
  contactsSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  contactsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  contactItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  contactName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  contactPhone: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
});

export default SOSScreen;
