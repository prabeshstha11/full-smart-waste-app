import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getUserByEmail, User } from '../utils/database';

export default function DealerProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      // Fetch user data from database using the dummy dealer email
      const userData = await getUserByEmail('dealer@sajilowaste.com');
      if (userData) {
        setUser(userData);
      } else {
        // If user not found in DB, create a default profile
        setUser({
          id: 'default-dealer-id',
          email: 'dealer@sajilowaste.com',
          first_name: 'Dealer',
          last_name: 'Test',
          role: 'dealer',
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      // Set default user data if database fails
      setUser({
        id: 'default-dealer-id',
        email: 'dealer@sajilowaste.com',
        first_name: 'Dealer',
        last_name: 'Test',
        role: 'dealer',
        created_at: new Date(),
        updated_at: new Date(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    router.push('/login');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Profile</Text>
        
        <View style={styles.userInfoContainer}>
          <Text style={styles.userInfoLabel}>Name:</Text>
          <Text style={styles.userInfoValue}>
            {user?.first_name && user?.last_name 
              ? `${user.first_name} ${user.last_name}`
              : 'Dealer Name'
            }
          </Text>
        </View>
        
        <View style={styles.userInfoContainer}>
          <Text style={styles.userInfoLabel}>Email:</Text>
          <Text style={styles.userInfoValue}>{user?.email}</Text>
        </View>
      </View>
      
      <View style={styles.logoutContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 40,
    textAlign: 'center',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userInfoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginRight: 12,
    minWidth: 60,
  },
  userInfoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  logoutContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 