import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { UserService } from '../utils/userService';

export default function DealerPage() {
  const { user, signOut } = useUser();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingItem, setAcceptingItem] = useState<string | null>(null);
  const [acceptedItems, setAcceptedItems] = useState<any[]>([]);
  const [availableRiders, setAvailableRiders] = useState<any[]>([]);
  const [assigningRider, setAssigningRider] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadUserData();
      loadAvailableItems();
      loadAcceptedItems();
      loadAvailableRiders();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      console.log('Loading dealer data for:', user?.id);
      const data = await UserService.getUserFromDatabase(user?.id || '');
      console.log('Dealer data from database:', data);
      setUserData(data);
    } catch (error) {
      console.error('Error loading dealer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableItems = async () => {
    try {
      const items = await ItemService.getAvailableItemsForDealers();
      setAvailableItems(items);
    } catch (error) {
      console.error('Error loading available items:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadAvailableItems(),
      loadAcceptedItems(),
      loadAvailableRiders()
    ]);
    setRefreshing(false);
  };

  const loadAcceptedItems = async () => {
    try {
      if (user?.id) {
        const items = await ItemService.getUserItems(user.id);
        const accepted = items.filter(item => item.dealer_id === user.id && item.status === 'accepted');
        setAcceptedItems(accepted);
      }
    } catch (error) {
      console.error('Error loading accepted items:', error);
    }
  };

  const loadAvailableRiders = async () => {
    try {
      const riders = await ItemService.getAvailableRiders();
      setAvailableRiders(riders);
    } catch (error) {
      console.error('Error loading available riders:', error);
    }
  };

  const handleAcceptItem = async (itemId: string) => {
    if (!user?.id) return;

    setAcceptingItem(itemId);
    try {
      await ItemService.acceptItemByDealer(itemId, user.id);
      Alert.alert('Success', 'Item accepted successfully!');
      loadAvailableItems(); // Refresh the list
      loadAcceptedItems(); // Refresh accepted items
    } catch (error) {
      console.error('Error accepting item:', error);
      Alert.alert('Error', 'Failed to accept item. Please try again.');
    } finally {
      setAcceptingItem(null);
    }
  };

  const handleAssignRider = async (itemId: string, riderId: string) => {
    setAssigningRider(itemId);
    try {
      await ItemService.assignRiderToItem(itemId, riderId);
      Alert.alert('Success', 'Rider assigned successfully!');
      loadAcceptedItems(); // Refresh the list
    } catch (error) {
      console.error('Error assigning rider:', error);
      Alert.alert('Error', 'Failed to assign rider. Please try again.');
    } finally {
      setAssigningRider(null);
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

  const dealerName = user?.firstName || userData?.first_name || 'Dealer';

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Hello {dealerName}! 🏪</Text>
        <Text style={styles.subtitle}>Available waste items from customers</Text>
      </View>

      {/* Available Items Section */}
      <View style={styles.sectionTitle}>
        <Text style={styles.sectionTitleText}>🔍 Available Items ({availableItems.length})</Text>
      </View>
      
      {availableItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No items available</Text>
          <Text style={styles.emptySubtext}>Pull down to refresh</Text>
        </View>
      ) : (
        availableItems.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemDescription}>{item.description}</Text>
            <Text style={styles.itemPrice}>Rs {item.price}</Text>
            <Text style={styles.itemLocation}>
              📍 Location: {item.location_lat.toFixed(4)}, {item.location_lng.toFixed(4)}
            </Text>
            <Text style={styles.itemCustomer}>
              👤 Customer: {item.customer_name || 'Unknown'}
            </Text>
            <TouchableOpacity
              style={[
                styles.acceptButton,
                acceptingItem === item.id && styles.acceptButtonDisabled
              ]}
              onPress={() => handleAcceptItem(item.id)}
              disabled={acceptingItem === item.id}
            >
              <Text style={styles.acceptButtonText}>
                {acceptingItem === item.id ? 'Accepting...' : 'Accept Item'}
              </Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      {/* Accepted Items Section */}
      <View style={styles.sectionTitle}>
        <Text style={styles.sectionTitleText}>✅ Accepted Items ({acceptedItems.length})</Text>
      </View>
      
      {acceptedItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No accepted items</Text>
          <Text style={styles.emptySubtext}>Accept items from above to assign riders</Text>
        </View>
      ) : (
        acceptedItems.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemDescription}>{item.description}</Text>
            <Text style={styles.itemPrice}>Rs {item.price}</Text>
            <Text style={styles.itemLocation}>
              📍 Location: {item.location_lat.toFixed(4)}, {item.location_lng.toFixed(4)}
            </Text>
            <Text style={styles.itemCustomer}>
              👤 Customer: {item.customer_name || 'Unknown'}
            </Text>
            
            {!item.rider_id ? (
              <View style={styles.riderAssignment}>
                <Text style={styles.riderLabel}>Assign Rider:</Text>
                {availableRiders.length > 0 ? (
                  availableRiders.map((rider) => (
                    <TouchableOpacity
                      key={rider.id}
                      style={[
                        styles.assignRiderButton,
                        assigningRider === item.id && styles.assignRiderButtonDisabled
                      ]}
                      onPress={() => handleAssignRider(item.id, rider.id)}
                      disabled={assigningRider === item.id}
                    >
                      <Text style={styles.assignRiderButtonText}>
                        {assigningRider === item.id ? 'Assigning...' : `Assign ${rider.first_name || 'Rider'}`}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.noRidersText}>No riders available</Text>
                )}
              </View>
            ) : (
              <Text style={styles.riderAssignedText}>
                ✅ Rider assigned: {availableRiders.find(r => r.id === item.rider_id)?.first_name || 'Unknown'}
              </Text>
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
    marginBottom: 40,
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
    gap: 16,
  },
  actionCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  actionDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  actionButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
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
    borderLeftColor: '#2196F3',
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
    color: '#2196F3',
    marginBottom: 8,
  },
  itemLocation: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  itemCustomer: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  acceptButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  acceptButtonDisabled: {
    backgroundColor: '#ccc',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Rider assignment styles
  riderAssignment: {
    marginTop: 8,
  },
  riderLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  assignRiderButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 6,
  },
  assignRiderButtonDisabled: {
    backgroundColor: '#ccc',
  },
  assignRiderButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  noRidersText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  riderAssignedText: {
    fontSize: 12,
    color: '#4caf50',
    fontWeight: 'bold',
    marginTop: 8,
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