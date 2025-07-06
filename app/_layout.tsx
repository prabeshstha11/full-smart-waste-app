import { tokenCache } from '@/utils/cache';
import { ClerkProvider } from '@clerk/clerk-expo';
import { Stack } from 'expo-router';
import React from 'react';

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  console.log(CLERK_PUBLISHABLE_KEY);
  throw new Error("Missing Publishable Key");
}

export default function RootLayout() {
  return (
    <ClerkProvider 
      publishableKey={CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="choose-role" options={{ headerShown: false }} />
        <Stack.Screen name="customer-home" options={{ headerShown: false }} />
        <Stack.Screen name="dealer-home" options={{ headerShown: false }} />
        <Stack.Screen name="rider-home" options={{ headerShown: false }} />
      </Stack>
    </ClerkProvider>
  );
}
