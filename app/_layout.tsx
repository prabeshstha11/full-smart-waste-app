import { ClerkProvider } from '@clerk/clerk-expo';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import React from 'react';
import DatabaseInitializer from '../components/DatabaseInitializer';

// Get Clerk publishable key from environment variables
const CLERK_PUBLISHABLE_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_aW5zcGlyZWQtd2FsbGV5ZS04Ni5jbGVyay5hY2NvdW50cy5kZXYk';

console.log('Clerk key details:', {
  fromEnv: Constants.expoConfig?.extra?.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
  fallback: 'pk_test_aW5zcGlyZWQtd2FsbGV5ZS04Ni5jbGVyay5hY2NvdW50cy5kZXYk',
  final: CLERK_PUBLISHABLE_KEY,
  hasKey: !!CLERK_PUBLISHABLE_KEY
});

export default function RootLayout() {
  console.log('Layout: Rendering RootLayout with Clerk key:', !!CLERK_PUBLISHABLE_KEY);
  console.log('Layout: Full Clerk key:', CLERK_PUBLISHABLE_KEY);
  
  return (
    <DatabaseInitializer>
      <ClerkProvider 
        publishableKey={CLERK_PUBLISHABLE_KEY}
        onError={(error) => {
          console.error('ClerkProvider error:', error);
        }}
        onLoaded={() => {
          console.log('ClerkProvider: Clerk has been loaded successfully');
        }}
      >
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="dashboard" options={{ headerShown: false }} />
          <Stack.Screen name="get-started" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="signin" options={{ headerShown: false }} />
          <Stack.Screen name="choose-role" options={{ headerShown: false }} />
          <Stack.Screen name="otp-verify" options={{ headerShown: false }} />
          <Stack.Screen name="otp-verified" options={{ headerShown: false }} />
          <Stack.Screen name="hello-user" options={{ headerShown: false }} />
          <Stack.Screen name="test-user" options={{ headerShown: false }} />
          <Stack.Screen name="test-clerk" options={{ headerShown: false }} />
          <Stack.Screen name="success" options={{ headerShown: false }} />
          <Stack.Screen name="customer-home" options={{ headerShown: false }} />
          <Stack.Screen name="dealer-home" options={{ headerShown: false }} />
          <Stack.Screen name="rider-home" options={{ headerShown: false }} />
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
        </Stack>
      </ClerkProvider>
    </DatabaseInitializer>
  );
}
