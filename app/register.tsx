import { useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { UserService } from '../utils/userService';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [clerkLoaded, setClerkLoaded] = useState(false);
  
  const signUpHook = useSignUp();
  const router = useRouter();

  // Debug logging
  useEffect(() => {
    console.log('=== REGISTER DEBUG ===');
    console.log('Register: useSignUp hook result:', signUpHook);
    console.log('Register: isLoaded:', signUpHook.isLoaded);
    console.log('Register: signUp object:', signUpHook);
    console.log('Register: setActive function:', signUpHook?.signUp?.setActive);
    console.log('Register: Hook keys:', Object.keys(signUpHook || {}));
    
    // Set clerk loaded when isLoaded becomes true
    if (signUpHook.isLoaded) {
      setClerkLoaded(true);
    }
  }, [signUpHook]);

  // Show loading screen while Clerk is loading
  if (!clerkLoaded) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading...</Text>
        <Text style={styles.subtitle}>Please wait while we set up authentication</Text>
      </View>
    );
  }

  const handleSignUp = async () => {
    if (!email || !password || !firstName || !lastName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Wait for Clerk to be loaded
    if (!signUpHook.isLoaded) {
      Alert.alert('Error', 'Authentication is still loading. Please wait a moment and try again.');
      return;
    }

    // Wait a bit for Clerk to be ready
    if (!signUpHook.signUp) {
      console.error('Register: signUp is undefined!');
      console.error('Register: signUp state:', signUpHook.signUp);
      console.error('Register: isLoaded state:', signUpHook.isLoaded);
      Alert.alert('Error', 'SignUp service not available. Please try again.');
      return;
    }

    setLoading(true);
    try {
      console.log('Register: Starting sign up process...');
      
      // Step 1: Create the user
      const result = await signUpHook.signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
      });

      console.log('Register: User created successfully:', result);
      
      if (result.status === 'complete') {
        console.log('Register: Sign up completed, redirecting to OTP verification');
        router.push('/otp-verify');
      } else if (result.status === 'missing_requirements') {
        console.log('Register: Missing requirements, preparing email verification');
        try {
          console.log('Preparing email verification...');
          await signUpHook.signUp.prepareEmailAddressVerification();
          console.log('Email verification prepared successfully');
          router.push('/otp-verify');
        } catch (verificationError) {
          console.error('Register: Error preparing email verification:', verificationError);
          Alert.alert('Error', 'Failed to prepare email verification. Please try again.');
        }
      } else {
        console.error('Register: Unexpected sign up status:', result.status);
        Alert.alert('Error', 'Sign up failed. Please try again.');
      }
    } catch (error) {
      console.error('Register: Sign up error:', error);
      Alert.alert('Error', 'Sign up failed. Please check your information and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleIncompleteRegistration = async (result: any, email: string, firstName: string, lastName: string) => {
    try {
      // Try to use the SignUp ID as fallback if user ID is not available
      const userId = result.createdUserId || result.id;
      
      // Sync to database
      await syncUserToDatabase(userId, email, firstName, lastName, 'customer');
      
      // Don't persist session - users must sign in manually
      console.log('Registration completed without session persistence');
      
      Alert.alert('Success', 'Registration completed! Please check your email to verify your account.');
      router.push('/choose-role');
    } catch (error) {
      console.error('Error handling incomplete registration:', error);
      Alert.alert('Success', 'Registration completed! Please check your email to verify your account.');
      router.push('/choose-role');
    }
  };

  const syncUserToDatabase = async (userId: string, email: string, firstName: string, lastName: string, role: string) => {
    try {
      const user = await UserService.syncUserToDatabase({
        id: userId,
        emailAddresses: [{ emailAddress: email }],
        firstName,
        lastName,
        unsafeMetadata: { firstName, lastName, role },
        role,
      });
      console.log('User synced to database:', user);
    } catch (error) {
      console.error('Error syncing user to database:', error);
      // Don't fail registration if database sync fails
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="First Name"
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.push('/signin')}
        >
          <Text style={styles.linkText}>Already have an account? Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#4caf50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  linkButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  linkText: {
    color: '#4caf50',
    fontSize: 16,
  },
}); 