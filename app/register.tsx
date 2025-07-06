import { useOAuth, useSignUp } from '@clerk/clerk-expo';
import { AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { UserService } from '../utils/userService';

WebBrowser.maybeCompleteAuthSession();

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signUp, setActive } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const router = useRouter();

  const handleSignUp = async () => {
    if (!email || !password || !firstName || !lastName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      console.log('=== REGISTRATION START ===');
      console.log('Input data:', { email, firstName, lastName });
      
      // Step 1: Create the user
      const result = await signUp.create({
        emailAddress: email,
        password,
        unsafeMetadata: {
          firstName,
          lastName,
        },
      });

      console.log('=== SIGNUP RESULT ===');
      console.log('Status:', result.status);
      console.log('Created user ID:', result.createdUserId);
      console.log('Created session ID:', result.createdSessionId);
      console.log('SignUp ID:', result.id);

      // Step 2: Handle different status scenarios
      if (result.status === 'complete') {
        // User created successfully with session
        await setActive({ session: result.createdSessionId });
        console.log('Session activated successfully');
        
        // Sync to database
        await syncUserToDatabase(result.createdUserId!, email, firstName, lastName, 'customer');
        router.push('/choose-role');
        
      } else if (result.status === 'missing_requirements') {
        console.log('=== HANDLING MISSING REQUIREMENTS ===');
        console.log('Missing fields:', result.missingFields);
        console.log('Unverified fields:', result.unverifiedFields);
        
        // Check if email needs verification
        if (result.unverifiedFields?.includes('email_address')) {
          try {
            console.log('Preparing email verification...');
            await signUp.prepareEmailAddressVerification();
            console.log('Email verification prepared successfully');
            router.push('/otp-verify');
          } catch (verificationError) {
            console.error('Email verification failed:', verificationError);
            // Continue anyway - user can verify later
            await handleIncompleteRegistration(result, email, firstName, lastName);
          }
        } else {
          // No email verification needed, complete registration
          await handleIncompleteRegistration(result, email, firstName, lastName);
        }
      } else {
        console.log('Unexpected status:', result.status);
        Alert.alert('Error', `Registration status: ${result.status}`);
      }
    } catch (err) {
      console.error('=== REGISTRATION ERROR ===', err);
      Alert.alert('Error', err.message || 'Registration failed');
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
      
      // Try to set session if available
      if (result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
      }
      
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

  const handleGoogleSignUp = async () => {
    try {
      console.log('Starting Google OAuth flow...');
      const { createdSessionId, signUp: googleSignUp, setActive: setGoogleActive } = await startOAuthFlow();
      if (createdSessionId) {
        await setGoogleActive({ session: createdSessionId });
        // Sync Google user to database
        if (googleSignUp?.createdUserId) {
          await UserService.syncUserToDatabase({
            id: googleSignUp.createdUserId,
            emailAddresses: [{ emailAddress: googleSignUp.emailAddress || '' }],
            firstName: googleSignUp.firstName || '',
            lastName: googleSignUp.lastName || '',
            unsafeMetadata: { firstName: googleSignUp.firstName || '', lastName: googleSignUp.lastName || '' },
            role: 'customer',
          });
        }
        router.push('/choose-role');
      } else {
        Alert.alert('Error', 'Failed to create session from Google OAuth');
      }
    } catch (err) {
      console.error('Google OAuth error:', err);
      Alert.alert('Google OAuth Error', 'Google sign-in failed.');
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
          style={styles.googleButton}
          onPress={handleGoogleSignUp}
        >
          <AntDesign name="google" size={20} color="#4285F4" style={styles.googleIcon} />
          <Text style={styles.googleButtonText}>Continue with Google</Text>
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

  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 