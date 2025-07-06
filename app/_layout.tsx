import { ClerkProvider } from '@clerk/clerk-expo';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import React from 'react';
import DatabaseInitializer from '../components/DatabaseInitializer';

// Get Clerk publishable key from environment variables
const CLERK_PUBLISHABLE_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize app - this can be used for any app-level initialization
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
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
