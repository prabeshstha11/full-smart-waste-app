import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Short loading time for app initialization
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
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
  }, [isSignedIn, isLoaded, isLoading, showOnboarding, router]);


    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4caf50" />
      <Text style={styles.loadingText}>Starting fresh session...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
}); 