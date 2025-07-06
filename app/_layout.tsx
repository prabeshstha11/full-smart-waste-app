import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-expo';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
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
    <ClerkProvider 
      publishableKey={CLERK_PUBLISHABLE_KEY}
      tokenCache={{
        async getToken(key) {
          try {
            return null;
          } catch (err) {
            return null;
          }
        },
        async saveToken(key, token) {
          try {
            // Save token logic here if needed
          } catch (err) {
            // Handle error
          }
        },
      }}
    >
      <SignedIn>
        <Stack>
          <Stack.Screen name="home" options={{ headerShown: false }} />
          <Stack.Screen name="get-started" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="signin" options={{ headerShown: false }} />
          <Stack.Screen name="choose-role" options={{ headerShown: false }} />
          <Stack.Screen name="otp-verify" options={{ headerShown: false }} />
          <Stack.Screen name="otp-verified" options={{ headerShown: false }} />
        </Stack>
      </SignedIn>
      
      <SignedOut>
        {showOnboarding ? (
          <SplashAndOnboarding onComplete={() => setShowOnboarding(false)} />
        ) : (
          <Stack>
            <Stack.Screen name="get-started" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ headerShown: false }} />
            <Stack.Screen name="signin" options={{ headerShown: false }} />
            <Stack.Screen name="choose-role" options={{ headerShown: false }} />
            <Stack.Screen name="otp-verify" options={{ headerShown: false }} />
            <Stack.Screen name="otp-verified" options={{ headerShown: false }} />
          </Stack>
        )}
      </SignedOut>
    </ClerkProvider>
  );
}
