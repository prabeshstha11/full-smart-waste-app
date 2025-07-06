import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import SplashAndOnboarding from './SplashAndOnboarding';

export default function Index() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const router = useRouter();

  // Always show onboarding first
  if (showOnboarding) {
    console.log('Index: Showing onboarding');
    return <SplashAndOnboarding onComplete={() => {
      console.log('Index: Onboarding completed, redirecting to register');
      setShowOnboarding(false);
      router.replace('/register');
    }} />;
  }

  // This should not be reached, but just in case
  console.log('Index: Fallback case reached');
  return null;
} 