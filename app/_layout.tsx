import { ClerkProvider } from '@clerk/clerk-expo';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import React from 'react';
import DatabaseInitializer from '../components/DatabaseInitializer';

// Get Clerk publishable key from environment variables
const CLERK_PUBLISHABLE_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

console.log('=== CLERK DEBUG INFO ===');
console.log('Layout: Constants.expoConfig?.extra?.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY:', Constants.expoConfig?.extra?.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY);
console.log('Layout: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY:', process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY);
console.log('Layout: Final CLERK_PUBLISHABLE_KEY:', CLERK_PUBLISHABLE_KEY);
console.log('Layout: Clerk key exists:', !!CLERK_PUBLISHABLE_KEY);
console.log('Layout: Clerk key length:', CLERK_PUBLISHABLE_KEY?.length || 0);
console.log('Layout: Clerk key starts with:', CLERK_PUBLISHABLE_KEY?.substring(0, 10) || 'none');
console.log('Layout: Clerk key ends with:', CLERK_PUBLISHABLE_KEY?.substring(-10) || 'none');

if (!CLERK_PUBLISHABLE_KEY) {
  console.error('Layout: No Clerk publishable key found!');
  console.error('Layout: Please check your .env file and restart the development server');
}

export default function RootLayout() {
  console.log('Layout: Rendering RootLayout with Clerk key:', !!CLERK_PUBLISHABLE_KEY);
  
  return (
    <DatabaseInitializer>
      <ClerkProvider 
        publishableKey={CLERK_PUBLISHABLE_KEY!}
        onError={(error) => {
          console.error('ClerkProvider error:', error);
        }}
      >
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="get-started" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="signin" options={{ headerShown: false }} />
          <Stack.Screen name="choose-role" options={{ headerShown: false }} />
          <Stack.Screen name="otp-verify" options={{ headerShown: false }} />
          <Stack.Screen name="otp-verified" options={{ headerShown: false }} />
          <Stack.Screen name="UserPage" options={{ headerShown: false }} />
          <Stack.Screen name="DealerPage" options={{ headerShown: false }} />
          <Stack.Screen name="RiderPage" options={{ headerShown: false }} />
          <Stack.Screen name="test-user" options={{ headerShown: false }} />
          <Stack.Screen name="test-env" options={{ headerShown: false }} />
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
        </Stack>
      </ClerkProvider>
    </DatabaseInitializer>
  );
}
