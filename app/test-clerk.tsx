import { useAuth, useSignIn, useSignUp } from '@clerk/clerk-expo';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function TestClerk() {
  const auth = useAuth();
  const signIn = useSignIn();
  const signUp = useSignUp();

  useEffect(() => {
    console.log('=== CLERK TEST ===');
    console.log('Auth:', auth);
    console.log('SignIn:', signIn);
    console.log('SignUp:', signUp);
  }, [auth, signIn, signUp]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clerk Test Page</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Auth Hook:</Text>
        <Text>isLoaded: {String(auth?.isLoaded)}</Text>
        <Text>isSignedIn: {String(auth?.isSignedIn)}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SignIn Hook:</Text>
        <Text>isLoaded: {String(signIn?.isLoaded)}</Text>
        <Text>signIn: {signIn?.signIn ? 'Available' : 'Undefined'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SignUp Hook:</Text>
        <Text>isLoaded: {String(signUp?.isLoaded)}</Text>
        <Text>signUp: {signUp?.signUp ? 'Available' : 'Undefined'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
}); 