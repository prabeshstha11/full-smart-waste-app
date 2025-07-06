import Constants from 'expo-constants';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function TestEnv() {
  const clerkKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Environment Variables Test</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Clerk Key Exists:</Text>
        <Text style={styles.value}>{clerkKey ? 'Yes' : 'No'}</Text>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Clerk Key Length:</Text>
        <Text style={styles.value}>{clerkKey?.length || 0}</Text>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Clerk Key Starts With:</Text>
        <Text style={styles.value}>{clerkKey?.substring(0, 10) || 'none'}</Text>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.label}>From Constants:</Text>
        <Text style={styles.value}>{Constants.expoConfig?.extra?.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'Yes' : 'No'}</Text>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.label}>From process.env:</Text>
        <Text style={styles.value}>{process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'Yes' : 'No'}</Text>
      </View>
      
      <Text style={styles.note}>
        If Clerk Key Exists is "No", check your .env file and restart the development server.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  label: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  note: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 30,
    fontStyle: 'italic',
  },
}); 