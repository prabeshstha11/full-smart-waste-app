import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    console.log('Index: Starting fresh session, going to onboarding');
    // Go directly to onboarding without any Clerk checks
    const timer = setTimeout(() => {
      console.log('Index: Navigating to onboarding');
      router.replace('/get-started');
    }, 500); // Brief 500ms delay to show loading

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