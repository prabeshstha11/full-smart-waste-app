import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { ItemService } from '../../utils/itemService';
import { UserService } from '../../utils/userService';

export default function UserHome() {
  const { user } = useUser();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string>('customer');
  const [userItems, setUserItems] = useState<any[]>([]);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const [showAssignRiderModal, setShowAssignRiderModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [availableRiders, setAvailableRiders] = useState<any[]>([]);
  const [selectedRider, setSelectedRider] = useState<string>('');
  
  const [newOrder, setNewOrder] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    quantity: '',
    image: null as string | null,
  });

  useEffect(() => {
    if (user) {
      loadUserData();
      loadUserItems();
      requestLocationPermission();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const userData = await UserService.getUserFromDatabase(user?.id || '');
      setUserRole(userData?.role || 'customer');
      
      // Load different data based on role
      if (userData?.role === 'dealer') {
        loadAvailableItems();
        loadAvailableRiders();
      }
    } catch (error) {
      console.error('Error loading user data:', error);
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

  const loadAvailableItems = async () => {
    try {
      const items = await ItemService.getAvailableItemsForDealers();
      setAvailableItems(items);
    } catch (error) {
      console.error('Error loading available items:', error);
    }
  };

  const loadAvailableRiders = async () => {
    try {
      const riders = await ItemService.getAvailableRidersList();
      setAvailableRiders(riders);
    } catch (error) {
      console.error('Error loading available riders:', error);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setNewOrder({ ...newOrder, image: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImageToCloudinary = async (imageUri: string): Promise<string> => {
    // For now, we'll use a placeholder. In production, you'd upload to Cloudinary
    // const formData = new FormData();
    // formData.append('file', {
    //   uri: imageUri,
    //   type: 'image/jpeg',
    //   name: 'upload.jpg',
    // });
    // formData.append('upload_preset', 'your_upload_preset');
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    return 'https://via.placeholder.com/300x200?text=Waste+Image';
  };

  const handleAddOrder = async () => {
    if (!location) {
      Alert.alert('Location Required', 'Please enable location access to post orders');
      return;
    }

    if (!newOrder.title || !newOrder.description || !newOrder.price) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    const price = parseFloat(newOrder.price);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price');
      return;
    }

    // Check if user is authenticated
    if (!user?.id) {
      console.error('User not authenticated or user ID missing');
      Alert.alert('Authentication Error', 'Please sign in again to post orders');
      return;
    }

    console.log('Posting order with data:', {
      user_id: user.id,
      title: newOrder.title,
      description: newOrder.description,
      price: price,
      location_lat: location.coords.latitude,
      location_lng: location.coords.longitude,
      category: newOrder.category,
      quantity: newOrder.quantity,
    });

    setUploading(true);
    try {
      let imageUrl = null;
      if (newOrder.image) {
        console.log('Uploading image to Cloudinary...');
        imageUrl = await uploadImageToCloudinary(newOrder.image);
        console.log('Image uploaded successfully:', imageUrl);
      }

      console.log('Creating item in database...');
      const result = await ItemService.createNewItem({
        user_id: user.id,
        title: newOrder.title,
        description: newOrder.description,
        price: price,
        location_lat: location.coords.latitude,
        location_lng: location.coords.longitude,
        category: newOrder.category,
        quantity: newOrder.quantity,
        image_url: imageUrl,
      });

      console.log('Order posted successfully:', result);
      Alert.alert('Success', 'Order posted successfully!');
      setShowAddOrderModal(false);
      setNewOrder({
        title: '',
        description: '',
        price: '',
        category: '',
        quantity: '',
        image: null,
      });
      loadUserItems();
    } catch (error) {
      console.error('Error posting order:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      let errorMessage = 'Failed to post order. Please try again.';
      if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleAcceptOrder = async (item: any) => {
    Alert.alert(
      'Accept Order',
      `Are you sure you want to accept "${item.title}" for Rs ${item.price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              await ItemService.acceptItemByDealer(item.id, user?.id || '');
              Alert.alert('Success', 'Order accepted successfully!');
              loadAvailableItems();
              loadUserItems();
            } catch (error) {
              console.error('Error accepting order:', error);
              Alert.alert('Error', 'Failed to accept order');
            }
          },
        },
      ]
    );
  };

  const handleAssignRider = async (item: any) => {
    setSelectedItem(item);
    setShowAssignRiderModal(true);
  };

  const confirmAssignRider = async () => {
    if (!selectedRider) {
      Alert.alert('Error', 'Please select a rider');
      return;
    }

    try {
      await ItemService.assignRiderToItem(selectedItem.id, selectedRider);
      Alert.alert('Success', 'Rider assigned successfully!');
      setShowAssignRiderModal(false);
      setSelectedItem(null);
      setSelectedRider('');
      loadUserItems();
    } catch (error) {
      console.error('Error assigning rider:', error);
      Alert.alert('Error', 'Failed to assign rider');
    }
  };

  const renderUserHome = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back! 👋</Text>
        <Text style={styles.subtitle}>Post your waste for pickup</Text>
      </View>

      <TouchableOpacity
        style={styles.addOrderButton}
        onPress={() => setShowAddOrderModal(true)}
      >
        <Ionicons name="add-circle" size={24} color="#fff" />
        <Text style={styles.addOrderButtonText}>Add New Order</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Orders ({userItems.length})</Text>
        
        {userItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="document-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No orders yet</Text>
            <Text style={styles.emptySubtext}>Create your first order to get started</Text>
          </View>
        ) : (
          userItems.map((item) => (
            <View key={item.id} style={styles.orderCard}>
              {item.image_url && (
                <Image source={{ uri: item.image_url }} style={styles.orderImage} />
              )}
              <View style={styles.orderContent}>
                <Text style={styles.orderTitle}>{item.title}</Text>
                <Text style={styles.orderDescription}>{item.description}</Text>
                <Text style={styles.orderPrice}>Rs {item.price}</Text>
                <View style={styles.orderStatus}>
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
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  const renderDealerHome = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Dealer Dashboard 🏪</Text>
        <Text style={styles.subtitle}>View and manage orders</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Orders ({availableItems.length})</Text>
        
        {availableItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="list-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No available orders</Text>
            <Text style={styles.emptySubtext}>Check back later for new orders</Text>
          </View>
        ) : (
          availableItems.map((item) => (
            <View key={item.id} style={styles.orderCard}>
              {item.image_url && (
                <Image source={{ uri: item.image_url }} style={styles.orderImage} />
              )}
              <View style={styles.orderContent}>
                <Text style={styles.orderTitle}>{item.title}</Text>
                <Text style={styles.orderDescription}>{item.description}</Text>
                <Text style={styles.orderPrice}>Rs {item.price}</Text>
                
                {item.category && (
                  <Text style={styles.orderCategory}>Category: {item.category}</Text>
                )}
                
                {item.quantity && (
                  <Text style={styles.orderQuantity}>Quantity: {item.quantity}</Text>
                )}

                <View style={styles.orderActions}>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAcceptOrder(item)}
                  >
                    <Ionicons name="checkmark" size={16} color="#fff" />
                    <Text style={styles.acceptButtonText}>Accept Order</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Accepted Orders</Text>
        
        {userItems.filter(item => item.status === 'accepted').length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="hand-left-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No accepted orders</Text>
            <Text style={styles.emptySubtext}>Accept orders from the list above</Text>
          </View>
        ) : (
          userItems
            .filter(item => item.status === 'accepted')
            .map((item) => (
              <View key={item.id} style={styles.orderCard}>
                {item.image_url && (
                  <Image source={{ uri: item.image_url }} style={styles.orderImage} />
                )}
                <View style={styles.orderContent}>
                  <Text style={styles.orderTitle}>{item.title}</Text>
                  <Text style={styles.orderDescription}>{item.description}</Text>
                  <Text style={styles.orderPrice}>Rs {item.price}</Text>
                  
                  <View style={styles.orderActions}>
                    <TouchableOpacity
                      style={styles.assignButton}
                      onPress={() => handleAssignRider(item)}
                    >
                      <Ionicons name="bicycle" size={16} color="#fff" />
                      <Text style={styles.assignButtonText}>Assign Rider</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
        )}
      </View>
    </ScrollView>
  );

  const renderRiderHome = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Rider Dashboard 🚚</Text>
        <Text style={styles.subtitle}>Manage your deliveries</Text>
      </View>
      
      <Text style={styles.comingSoon}>Rider features coming soon...</Text>
    </ScrollView>
  );

  const renderContent = () => {
    switch (userRole) {
      case 'dealer':
        return renderDealerHome();
      case 'rider':
        return renderRiderHome();
      default:
        return renderUserHome();
    }
  };

  return (
    <View style={styles.container}>
      {renderContent()}

      {/* Add Order Modal */}
      <Modal
        visible={showAddOrderModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddOrderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📝 Add New Order</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Order Title"
              value={newOrder.title}
              onChangeText={(text) => setNewOrder({ ...newOrder, title: text })}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Description"
              value={newOrder.description}
              onChangeText={(text) => setNewOrder({ ...newOrder, description: text })}
              multiline
              numberOfLines={3}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Price (Rs)"
              value={newOrder.price}
              onChangeText={(text) => setNewOrder({ ...newOrder, price: text })}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Category (e.g., Plastic, Paper, Metal)"
              value={newOrder.category}
              onChangeText={(text) => setNewOrder({ ...newOrder, category: text })}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Quantity (e.g., 5 kg)"
              value={newOrder.quantity}
              onChangeText={(text) => setNewOrder({ ...newOrder, quantity: text })}
            />
            
            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
              <Ionicons name="camera" size={20} color="#4caf50" />
              <Text style={styles.imageButtonText}>
                {newOrder.image ? 'Change Image' : 'Add Image'}
              </Text>
            </TouchableOpacity>
            
            {newOrder.image && (
              <Image source={{ uri: newOrder.image }} style={styles.previewImage} />
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddOrderModal(false);
                  setNewOrder({
                    title: '',
                    description: '',
                    price: '',
                    category: '',
                    quantity: '',
                    image: null,
                  });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.postButton, uploading && styles.postButtonDisabled]}
                onPress={handleAddOrder}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.postButtonText}>Post Order</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Assign Rider Modal */}
      <Modal
        visible={showAssignRiderModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAssignRiderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🚚 Assign Rider</Text>
            
            {selectedItem && (
              <View style={styles.selectedItemInfo}>
                <Text style={styles.selectedItemTitle}>{selectedItem.title}</Text>
                <Text style={styles.selectedItemPrice}>Rs {selectedItem.price}</Text>
              </View>
            )}
            
            <Text style={styles.modalSubtitle}>Select a rider:</Text>
            
            {availableRiders.length === 0 ? (
              <Text style={styles.noRidersText}>No riders available</Text>
            ) : (
              availableRiders.map((rider) => (
                <TouchableOpacity
                  key={rider.id}
                  style={[
                    styles.riderOption,
                    selectedRider === rider.id && styles.riderOptionSelected
                  ]}
                  onPress={() => setSelectedRider(rider.id)}
                >
                  <Ionicons 
                    name="bicycle" 
                    size={20} 
                    color={selectedRider === rider.id ? '#fff' : '#4caf50'} 
                  />
                  <Text style={[
                    styles.riderOptionText,
                    selectedRider === rider.id && styles.riderOptionTextSelected
                  ]}>
                    {rider.name || rider.email}
                  </Text>
                </TouchableOpacity>
              ))
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAssignRiderModal(false);
                  setSelectedItem(null);
                  setSelectedRider('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.postButton, !selectedRider && styles.postButtonDisabled]}
                onPress={confirmAssignRider}
                disabled={!selectedRider}
              >
                <Text style={styles.postButtonText}>Assign Rider</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#e8f5e8',
  },
  addOrderButton: {
    backgroundColor: '#4caf50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 20,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addOrderButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  emptyCard: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  orderImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  orderContent: {
    padding: 16,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  orderDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  orderPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4caf50',
    marginBottom: 8,
  },
  orderCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  orderQuantity: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  orderStatus: {
    alignSelf: 'flex-start',
    marginBottom: 8,
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
  orderActions: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    backgroundColor: '#4caf50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  assignButton: {
    backgroundColor: '#2196f3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  assignButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  comingSoon: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 100,
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
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  selectedItemInfo: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectedItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedItemPrice: {
    fontSize: 14,
    color: '#4caf50',
    fontWeight: 'bold',
  },
  riderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
  },
  riderOptionSelected: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50',
  },
  riderOptionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  riderOptionTextSelected: {
    color: '#fff',
  },
  noRidersText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 16,
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
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#4caf50',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  imageButtonText: {
    color: '#4caf50',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 16,
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
}); 