import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { UserService } from '../utils/userService';

export default function Welcome() {
  const { user } = useUser();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      if (user?.id) {
        const data = await UserService.getUserFromDatabase(user.id);
        setUserData(data);
        
        // Redirect to the main app with tab navigation
        setTimeout(() => {
          router.replace('/(tabs)/home');
        }, 2000);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'customer':
        return 'Customer';
      case 'dealer':
        return 'Dealer';
      case 'rider':
        return 'Rider';
      default:
        return 'User';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'customer':
        return 'person';
      case 'dealer':
        return 'business';
      case 'rider':
        return 'bicycle';
      default:
        return 'person';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4caf50" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="checkmark-circle" size={80} color="#4caf50" />
        <Text style={styles.welcomeTitle}>Welcome!</Text>
        <Text style={styles.welcomeSubtitle}>
          You're all set up and ready to go
        </Text>
      </View>

      <View style={styles.userInfo}>
        <View style={styles.userCard}>
          <View style={styles.userHeader}>
            <Ionicons 
              name={getRoleIcon(userData?.role || 'customer') as any} 
              size={24} 
              color="#4caf50" 
            />
            <Text style={styles.userName}>
              {user?.firstName} {user?.lastName}
            </Text>
          </View>
          
          <Text style={styles.userEmail}>{user?.emailAddresses[0]?.emailAddress}</Text>
          
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {getRoleDisplayName(userData?.role || 'customer')}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.redirectInfo}>
        <Ionicons name="arrow-forward" size={24} color="#4caf50" />
        <Text style={styles.redirectText}>
          Redirecting to your dashboard...
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.continueButton}
        onPress={() => router.replace('/(tabs)/home')}
      >
        <Text style={styles.continueButtonText}>Continue Now</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
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
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  userInfo: {
    width: '100%',
    marginBottom: 40,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  roleBadge: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  redirectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  redirectText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  continueButton: {
    backgroundColor: '#4caf50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
}); 