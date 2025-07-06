import { ClerkProvider } from '@clerk/clerk-expo';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import DatabaseInitializer from '../components/DatabaseInitializer';
import SplashAndOnboarding from './SplashAndOnboarding';

// Get Clerk publishable key from environment variables
const CLERK_PUBLISHABLE_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_aW5zcGlyZWQtd2FsbGV5ZS04Ni5jbGVyay5hY2NvdW50cy5kZXYk';

export default function RootLayout() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user has seen onboarding (you can use AsyncStorage for persistence)
    // For now, we'll show onboarding for new users
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SplashAndOnboarding onComplete={() => {}} />;
  }

  return (
    <DatabaseInitializer>
      <ClerkProvider 
        publishableKey={CLERK_PUBLISHABLE_KEY}
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
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
        </Stack>
      </ClerkProvider>
    </DatabaseInitializer>
  );
}
