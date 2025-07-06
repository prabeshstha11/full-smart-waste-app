import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HelloUser() {
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      const email = user.emailAddresses[0]?.emailAddress || 'No email found';
      setUserEmail(email);
      console.log('User ID for database:', user.id);
      console.log('User email:', email);
      
      // Sync user to database
      syncUserToDatabase();
    }
  }, [user, isLoaded]);

  const syncUserToDatabase = async () => {
    if (!user) return;
    
    setSyncing(true);
    try {
      console.log('Syncing user to database...');
      const syncedUser = await UserService.syncUserToDatabase(user);
      setDbUser(syncedUser);
      console.log('User synced to database successfully');
    } catch (error) {
      console.error('Error syncing user to database:', error);
      Alert.alert('Database Error', 'Failed to sync user to database');
    } finally {
      setSyncing(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/get-started');
  };

  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hello {userEmail}!</Text>
        <Text style={styles.subtitle}>Clerk is connected successfully</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>User ID: {user.id}</Text>
        <Text style={styles.infoText}>Email: {userEmail}</Text>
        <Text style={styles.infoText}>Full Name: {user.fullName || 'Not set'}</Text>
        <Text style={styles.infoText}>Role: {user.unsafeMetadata?.role || 'Not set'}</Text>
        
        {dbUser && (
          <>
            <Text style={styles.dbTitle}>Database Info:</Text>
            <Text style={styles.infoText}>DB Role: {dbUser.role}</Text>
            <Text style={styles.infoText}>DB First Name: {dbUser.first_name}</Text>
            <Text style={styles.infoText}>DB Last Name: {dbUser.last_name}</Text>
            <Text style={styles.infoText}>Created: {new Date(dbUser.created_at).toLocaleString()}</Text>
          </>
        )}
        
        {syncing && (
          <Text style={styles.syncingText}>Syncing to database...</Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/test-user')}>
          <Text style={styles.buttonText}>View Full User Info</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.syncButton} onPress={syncUserToDatabase}>
          <Text style={styles.buttonText}>Sync to Database</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    backgroundColor: '#4caf50',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
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
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    lineHeight: 24,
  },
  buttonContainer: {
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
  },
  errorText: {
    fontSize: 18,
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  dbTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 8,
  },
  syncingText: {
    fontSize: 14,
    color: '#4caf50',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  syncButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
}); 