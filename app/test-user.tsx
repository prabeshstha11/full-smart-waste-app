import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TestUser() {
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (isLoaded && user) {
      setUserData({
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        metadata: user.unsafeMetadata,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    }
  }, [user, isLoaded]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/get-started');
  };

  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading user data...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No user found</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/get-started')}>
          <Text style={styles.buttonText}>Go to Get Started</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hello {userData?.email}!</Text>
        <Text style={styles.subtitle}>Clerk User Information</Text>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Basic Information</Text>
          <Text style={styles.infoText}>ID: {userData?.id}</Text>
          <Text style={styles.infoText}>Email: {userData?.email}</Text>
          <Text style={styles.infoText}>Full Name: {userData?.fullName || 'Not set'}</Text>
          <Text style={styles.infoText}>First Name: {userData?.firstName || 'Not set'}</Text>
          <Text style={styles.infoText}>Last Name: {userData?.lastName || 'Not set'}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Metadata</Text>
          <Text style={styles.infoText}>
            First Name (metadata): {userData?.metadata?.firstName || 'Not set'}
          </Text>
          <Text style={styles.infoText}>
            Last Name (metadata): {userData?.metadata?.lastName || 'Not set'}
          </Text>
          <Text style={styles.infoText}>
            Role: {userData?.metadata?.role || 'Not set'}
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Timestamps</Text>
          <Text style={styles.infoText}>
            Created: {userData?.createdAt ? new Date(userData.createdAt).toLocaleString() : 'Not available'}
          </Text>
          <Text style={styles.infoText}>
            Updated: {userData?.updatedAt ? new Date(userData.updatedAt).toLocaleString() : 'Not available'}
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/home')}>
          <Text style={styles.buttonText}>Go to Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4caf50',
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  infoContainer: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  buttonContainer: {
    padding: 20,
    gap: 12,
  },
  button: {
    backgroundColor: '#4caf50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signOutButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 100,
  },
  errorText: {
    fontSize: 18,
    color: '#ff4444',
    textAlign: 'center',
    marginTop: 100,
  },
}); 