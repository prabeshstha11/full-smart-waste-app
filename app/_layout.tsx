import DatabaseInitializer from '@/components/DatabaseInitializer';
import { Stack } from 'expo-router';
import React from 'react';

export default function RootLayout() {
  return (
    <>
      <DatabaseInitializer />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="choose-role" options={{ headerShown: false }} />
        <Stack.Screen name="customer-home" options={{ headerShown: false }} />
        <Stack.Screen name="dealer-home" options={{ headerShown: false }} />
        <Stack.Screen name="rider-home" options={{ headerShown: false }} />
        <Stack.Screen name="pickup-schedule" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
