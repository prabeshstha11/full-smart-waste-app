import { useSignIn } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [clerkLoaded, setClerkLoaded] = useState(false);
  
  const signInHook = useSignIn();
  const router = useRouter();

  // Debug logging
  useEffect(() => {
    console.log('=== SIGNIN DEBUG ===');
    console.log('SignIn: useSignIn hook result:', signInHook);
    console.log('SignIn: isLoaded:', signInHook.isLoaded);
    console.log('SignIn: signIn object:', signInHook);
    console.log('SignIn: setActive function:', signInHook?.setActive);
    console.log('SignIn: Hook keys:', Object.keys(signInHook || {}));
    
    // Set clerk loaded when isLoaded becomes true
    if (signInHook.isLoaded) {
      setClerkLoaded(true);
    }
  }, [signInHook]);

  // Show loading screen while Clerk is loading
  if (!clerkLoaded) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading...</Text>
        <Text style={styles.subtitle}>Please wait while we set up authentication</Text>
      </View>
    );
  }

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Wait for Clerk to be loaded
    if (!signInHook.isLoaded) {
      Alert.alert('Error', 'Authentication is still loading. Please wait a moment and try again.');
      return;
    }

    // Wait a bit for Clerk to be ready
    if (!signInHook) {
      console.error('SignIn: signIn is undefined!');
      console.error('SignIn: signIn state:', signInHook);
      console.error('SignIn: isLoaded state:', signInHook.isLoaded);
      Alert.alert('Error', 'SignIn service not available. Please try again.');
      return;
    }

    setLoading(true);
    try {
      console.log('SignIn: Attempting to sign in with email:', email);
      const result = await signInHook.create({
        identifier: email,
        password,
      });

      console.log('SignIn: Sign in result:', result);
      
      if (result.status === 'complete') {
        console.log('SignIn: Sign in completed successfully');
        router.push('/choose-role');
      } else if (result.status === 'needs_first_factor') {
        console.log('SignIn: Needs first factor authentication');
        Alert.alert('Error', 'Additional authentication required. Please try again.');
      } else {
        console.error('SignIn: Unexpected sign in status:', result.status);
        Alert.alert('Error', 'Sign in failed. Please check your credentials and try again.');
      }
    } catch (error) {
      console.error('SignIn: Sign in error:', error);
      Alert.alert('Error', 'Sign in failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="log-in" size={80} color="#4caf50" />
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#666" />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity
          style={[styles.signInButton, loading && styles.signInButtonDisabled]}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="log-in" size={20} color="#fff" />
              <Text style={styles.signInButtonText}>Sign In</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.forgotPasswordButton}
          onPress={() => Alert.alert('Info', 'Password reset feature coming soon!')}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => router.push('/register')}>
          <Text style={styles.signUpLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 80,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333',
  },
  signInButton: {
    backgroundColor: '#4caf50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  signInButtonDisabled: {
    backgroundColor: '#ccc',
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  forgotPasswordButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  forgotPasswordText: {
    color: '#4caf50',
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 40,
  },
  footerText: {
    fontSize: 16,
    color: '#666',
  },
  signUpLink: {
    fontSize: 16,
    color: '#4caf50',
    fontWeight: 'bold',
  },
}); 