import { useUser } from '@clerk/clerk-expo';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { UserService } from '../utils/userService';

export default function UserPage() {
  const { user, signOut } = useUser();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [userItems, setUserItems] = useState<any[]>([]);
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    price: ''
  });
  const [postingItem, setPostingItem] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserData();
      requestLocationPermission();
      loadUserItems();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      console.log('Loading user data for:', user?.id);
      const data = await UserService.getUserFromDatabase(user?.id || '');
      console.log('User data from database:', data);
      setUserData(data);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        setLocationPermission(true);
        getCurrentLocation();
      } else {
        setLocationPermission(false);
        Alert.alert(
          'Location Permission',
          'Location permission is required to show your current location for waste pickup.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Location.requestForegroundPermissionsAsync() }
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setLocationPermission(false);
    } finally {
      setLocationLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(currentLocation);
      console.log('Current location:', currentLocation);
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Location Error', 'Failed to get current location');
    } finally {
      setLocationLoading(false);
    }
  };

  const loadUserItems = async () => {
    try {
      if (user?.id) {
        const items = await ItemService.getUserItems(user.id);
        setUserItems(items);
      }
    } catch (error) {
      console.error('Error loading user items:', error);
    }
  };

  const handlePostItem = async () => {
    if (!location) {
      Alert.alert('Location Required', 'Please enable location access to post items');
      return;
    }

    if (!newItem.title || !newItem.description || !newItem.price) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }

    const price = parseFloat(newItem.price);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price');
      return;
    }

    setPostingItem(true);
    try {
      await ItemService.createNewItem({
        user_id: user?.id || '',
        title: newItem.title,
        description: newItem.description,
        price: price,
        location_lat: location.coords.latitude,
        location_lng: location.coords.longitude,
      });

      Alert.alert('Success', 'Item posted successfully!');
      setShowAddItemModal(false);
      setNewItem({ title: '', description: '', price: '' });
      loadUserItems(); // Refresh items list
    } catch (error) {
      console.error('Error posting item:', error);
      Alert.alert('Error', 'Failed to post item. Please try again.');
    } finally {
      setPostingItem(false);
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

  const userName = user?.firstName || userData?.first_name || 'User';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Hello {userName}! 👋</Text>
        <Text style={styles.subtitle}>You can post your waste for sale</Text>
      </View>

      {/* Location Section */}
      <View style={styles.locationSection}>
        <Text style={styles.sectionTitle}>📍 Current Location</Text>
        
        {locationPermission ? (
          <View style={styles.locationCard}>
            {locationLoading ? (
              <Text style={styles.locationText}>Getting location...</Text>
            ) : location ? (
              <View>
                <Text style={styles.locationText}>
                  Latitude: {location.coords.latitude.toFixed(6)}
                </Text>
                <Text style={styles.locationText}>
                  Longitude: {location.coords.longitude.toFixed(6)}
                </Text>
                <Text style={styles.locationText}>
                  Accuracy: {location.coords.accuracy?.toFixed(1)}m
                </Text>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={getCurrentLocation}
                >
                  <Text style={styles.refreshButtonText}>🔄 Refresh Location</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.locationText}>Location not available</Text>
            )}
          </View>
        ) : (
          <View style={styles.locationCard}>
            <Text style={styles.locationText}>Location permission not granted</Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestLocationPermission}
            >
              <Text style={styles.permissionButtonText}>Grant Location Permission</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.actionCard}>
          <Text style={styles.actionTitle}>📝 Post Waste</Text>
          <Text style={styles.actionDescription}>
            List your waste items for sale. Set prices and descriptions to attract buyers.
          </Text>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowAddItemModal(true)}
          >
            <Text style={styles.actionButtonText}>Create New Post</Text>
          </TouchableOpacity>
        </View>

        {/* My Items Section */}
        <View style={styles.sectionTitle}>
          <Text style={styles.sectionTitleText}>📋 My Posts ({userItems.length})</Text>
        </View>
        
        {userItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No items posted yet</Text>
            <Text style={styles.emptySubtext}>Create your first post to start selling waste</Text>
          </View>
        ) : (
          userItems.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemDescription}>{item.description}</Text>
              <Text style={styles.itemPrice}>Rs {item.price}</Text>
              <View style={styles.itemStatus}>
                <Text style={[
                  styles.statusText,
                  item.status === 'available' && styles.statusAvailable,
                  item.status === 'accepted' && styles.statusAccepted,
                  item.status === 'picked_up' && styles.statusPickedUp,
                  item.status === 'completed' && styles.statusCompleted,
                ]}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
            </View>
          ))
        )}

        <View style={styles.actionCard}>
          <Text style={styles.actionTitle}>💰 Earnings</Text>
          <Text style={styles.actionDescription}>
            Track your earnings from waste sales.
          </Text>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>View Earnings</Text>
          </TouchableOpacity>
        </View>
      </View>

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

      {/* Add Item Modal */}
      <Modal
        visible={showAddItemModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddItemModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📝 Post New Item</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Item Title"
              value={newItem.title}
              onChangeText={(text) => setNewItem({ ...newItem, title: text })}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Description"
              value={newItem.description}
              onChangeText={(text) => setNewItem({ ...newItem, description: text })}
              multiline
              numberOfLines={3}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Price (Rs)"
              value={newItem.price}
              onChangeText={(text) => setNewItem({ ...newItem, price: text })}
              keyboardType="numeric"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddItemModal(false);
                  setNewItem({ title: '', description: '', price: '' });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.postButton, postingItem && styles.postButtonDisabled]}
                onPress={handlePostItem}
                disabled={postingItem}
              >
                <Text style={styles.postButtonText}>
                  {postingItem ? 'Posting...' : 'Post Item'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  locationSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  locationCard: {
    backgroundColor: '#e8f5e8',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  refreshButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  permissionButton: {
    backgroundColor: '#ff9800',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
    borderLeftColor: '#4caf50',
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: '#4caf50',
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
    backgroundColor: '#2196F3',
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
    borderLeftColor: '#4caf50',
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
    color: '#4caf50',
    marginBottom: 8,
  },
  itemStatus: {
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusAvailable: {
    backgroundColor: '#e8f5e8',
    color: '#4caf50',
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#ff6b6b',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  postButton: {
    flex: 1,
    backgroundColor: '#4caf50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#ccc',
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
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