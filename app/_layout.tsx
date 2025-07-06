import { Stack } from 'expo-router';
import { useState } from 'react';
import SplashAndOnboarding from './SplashAndOnboarding';

export default function RootLayout() {
  const [showOnboarding, setShowOnboarding] = useState(true);

  if (showOnboarding) {
    return <SplashAndOnboarding onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <Stack>
      <Stack.Screen name="home" options={{ headerShown: false }} />
    </Stack>
  );
}
