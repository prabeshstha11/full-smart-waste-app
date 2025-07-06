import { useRouter } from 'expo-router';
import React from 'react';
import SplashAndOnboarding from './SplashAndOnboarding';

export default function GetStarted() {
  const router = useRouter();

  const handleOnboardingComplete = () => {
    console.log('Onboarding completed, navigating to register');
    router.replace('/register');
  };

  return <SplashAndOnboarding onComplete={handleOnboardingComplete} />;
} 