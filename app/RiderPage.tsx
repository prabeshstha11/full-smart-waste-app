import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ItemService } from '../utils/itemService';
import { UserService } from '../utils/userService';

export default function RiderPage() {
  const { user, signOut } = useUser();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [assignedItems, setAssignedItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [pickingUpItem, setPickingUpItem] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadUserData();
      loadAssignedItems();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      console.log('Loading rider data for:', user?.id);
      const data = await UserService.getUserFromDatabase(user?.id || '');
      console.log('Rider data from database:', data);
      setUserData(data);
    } catch (error) {
      console.error('Error loading rider data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignedItems = async () => {
    try {
      if (user?.id) {
        // Get items assigned to this rider
        const items = await ItemService.getAssignedItems(user.id);
        setAssignedItems(items);
      }
    } catch (error) {
      console.error('Error loading assigned items:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAssignedItems();
    setRefreshing(false);
  };

  const handlePickupItem = async (itemId: string) => {
    setPickingUpItem(itemId);
    try {
      await ItemService.pickupItem(itemId);
      Alert.alert('Success', 'Item picked up successfully!');
      loadAssignedItems(); // Refresh the list
    } catch (error) {
      console.error('Error picking up item:', error);
      Alert.alert('Error', 'Failed to pick up item. Please try again.');
    } finally {
      setPickingUpItem(null);
    }
  };

  const handleCompleteItem = async (itemId: string) => {
    try {
      await ItemService.completeItem(itemId);
      Alert.alert('Success', 'Item delivered successfully!');
      loadAssignedItems(); // Refresh the list
    } catch (error) {
      console.error('Error completing item:', error);
      Alert.alert('Error', 'Failed to complete item. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/get-started');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const riderName = user?.firstName || userData?.first_name || 'Rider';

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Hello {riderName}! 🚚</Text>
        <Text style={styles.subtitle}>Your assigned pickup and delivery tasks</Text>
      </View>

      {/* Assigned Items Section */}
      <View style={styles.sectionTitle}>
        <Text style={styles.sectionTitleText}>🚚 Assigned Items ({assignedItems.length})</Text>
      </View>
      
      {assignedItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No items assigned yet</Text>
          <Text style={styles.emptySubtext}>Pull down to refresh</Text>
        </View>
      ) : (
        assignedItems.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemDescription}>{item.description}</Text>
            <Text style={styles.itemPrice}>Rs {item.price}</Text>
            <Text style={styles.itemLocation}>
              📍 Location: {item.location_lat.toFixed(4)}, {item.location_lng.toFixed(4)}
            </Text>
            <View style={styles.itemStatus}>
              <Text style={[
                styles.statusText,
                item.status === 'accepted' && styles.statusAccepted,
                item.status === 'picked_up' && styles.statusPickedUp,
                item.status === 'completed' && styles.statusCompleted,
              ]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
            
            {item.status === 'accepted' && (
              <TouchableOpacity
                style={[
                  styles.pickupButton,
                  pickingUpItem === item.id && styles.pickupButtonDisabled
                ]}
                onPress={() => handlePickupItem(item.id)}
                disabled={pickingUpItem === item.id}
              >
                <Text style={styles.pickupButtonText}>
                  {pickingUpItem === item.id ? 'Picking up...' : 'Pick Up Item'}
                </Text>
              </TouchableOpacity>
            )}
            
            {item.status === 'picked_up' && (
              <TouchableOpacity
                style={styles.completeButton}
                onPress={() => handleCompleteItem(item.id)}
              >
                <Text style={styles.completeButtonText}>Mark as Delivered</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}

      <View style={styles.navigation}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => router.push('/welcome')}
        >
          <Text style={styles.navButtonText}>Back to Welcome</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* DEBUG INFORMATION - COMMENTED OUT
      <View style={styles.debugInfo}>
        <Text style={styles.debugTitle}>Debug Information:</Text>
        <Text>User ID: {user?.id}</Text>
        <Text>Email: {user?.emailAddresses[0]?.emailAddress}</Text>
        <Text>Role: {userData?.role}</Text>
        <Text>Database ID: {userData?.id}</Text>
      </View>
      */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 100,
  },
  content: {
    flex: 1,
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#f9f9f9',
    padding: 14,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    lineHeight: 16,
  },
  actionButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  navigation: {
    gap: 12,
    marginBottom: 20,
  },
  navButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signOutButton: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Item styles
  sectionTitle: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyCard: {
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  itemCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 8,
  },
  itemLocation: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  itemStatus: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusAccepted: {
    backgroundColor: '#fff3e0',
    color: '#ff9800',
  },
  statusPickedUp: {
    backgroundColor: '#e3f2fd',
    color: '#2196f3',
  },
  statusCompleted: {
    backgroundColor: '#e8f5e8',
    color: '#4caf50',
  },
  pickupButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  pickupButtonDisabled: {
    backgroundColor: '#ccc',
  },
  pickupButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  completeButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // DEBUG STYLES - COMMENTED OUT
  /*
  debugInfo: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  */
}); 