import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import React from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/context/AuthContext'
import { CartProvider } from './src/context/CartProvider';
import RootNavigator from './src/navigation/RootNavigator';

// Define geofencing task for mohalla alerts (mobile only)
if (Platform.OS !== 'web') {
  TaskManager.defineTask('MOHALLA_ALERTS', ({ data: { eventType, region }, error }) => {
    if (error) {
      console.error('Geofencing error:', error);
      return;
    }
    if (eventType === Location.GeofencingEventType.Enter) {
      console.log('A vendor entered your Mohalla!');
      // TODO: Trigger push notification here
    }
  });
}

/**
 * Main App Component
 * Wraps the app with necessary providers and navigation
 */
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <CartProvider>
          <RootNavigator />
        </CartProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}