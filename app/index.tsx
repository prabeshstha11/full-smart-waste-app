import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import SplashAndOnboarding from './SplashAndOnboarding';

export default function Index() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLoaded && !isLoading) {
      if (isSignedIn) {
        // User is signed in, go to hello user page
        router.replace('/hello-user');
      } else if (showOnboarding) {
        // Show onboarding for new users
        // The onboarding will be shown in the current component
      } else {
        // User has seen onboarding, go to get-started
        router.replace('/get-started');
      }
    }
  }, [isSignedIn, isLoaded, isLoading, showOnboarding]);

  // Show loading screen
  if (isLoading || !isLoaded) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Show onboarding for new users who are not signed in
  if (!isSignedIn && showOnboarding) {
    return <SplashAndOnboarding onComplete={() => setShowOnboarding(false)} />;
  }

  // Show loading while redirecting
  return (
    <View style={styles.container}>
      <Text style={styles.loadingText}>Redirecting...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
}); 