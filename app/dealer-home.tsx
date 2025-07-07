import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { assignRider, createNotification, getAvailableRiders, getDealerRequestedPickupRequests, getPendingPickupRequestsWithUser, makeOfferOnPickupRequest, PickupRequest, User } from '../utils/database';

const { width, height } = Dimensions.get('window');

export default function DealerHome() {
  const [activeTab, setActiveTab] = useState('home');
  const [pendingRequests, setPendingRequests] = useState<(PickupRequest & { customer_name: string; customer_email: string })[]>([]);
  const [myRequests, setMyRequests] = useState<(PickupRequest & { customer_name: string; customer_email: string })[]>([]);
  const [riders, setRiders] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [requestedItems, setRequestedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const dealerId = 'dummy_dealer_001'; // In a real app, this would come from authentication
      const [requestsData, myRequestsData, ridersData] = await Promise.all([
        getPendingPickupRequestsWithUser(),
        getDealerRequestedPickupRequests(dealerId),
        getAvailableRiders()
      ]);
      
      console.log('Pending requests:', requestsData);
      console.log('My requests:', myRequestsData);
      console.log('Riders:', ridersData);
      
      setPendingRequests(requestsData);
      setMyRequests(myRequestsData);
      setRiders(ridersData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleProfilePress = () => {
    router.push('/dealer-profile');
  };

  const handleMakeOffer = async (requestId: string) => {
    try {
      const dealerId = 'dummy_dealer_001';
      
      Alert.prompt(
        'Make Offer',
        'Enter your offered price (₹):',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Send Offer',
            onPress: async (price) => {
              if (price && !isNaN(Number(price))) {
                const offeredPrice = Number(price);
                await makeOfferOnPickupRequest(requestId, dealerId, offeredPrice);
                
                // Create notification for user
                const notificationId = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                await createNotification({
                  id: notificationId,
                  user_id: 'dummy_user_001', // In a real app, get from request
                  title: 'New Dealer Offer',
                  message: `A dealer has made an offer of ₹${offeredPrice} for your pickup request`,
                  type: 'dealer_offer',
                  related_id: requestId
                });
                
                // Mark as requested
                setRequestedItems(prev => new Set(prev).add(requestId));
                
                Alert.alert('Success', 'Offer sent to user successfully');
                loadData();
              } else {
                Alert.alert('Error', 'Please enter a valid price');
              }
            },
          },
        ],
        'plain-text',
        '',
        'numeric'
      );
    } catch (error) {
      console.error('Error making offer:', error);
      Alert.alert('Error', 'Failed to send offer');
    }
  };

  const handleAssignRider = async (requestId: string) => {
    try {
      if (riders.length === 0) {
        Alert.alert('No Riders', 'No riders are currently available');
        return;
      }

      const riderOptions = riders.map(rider => ({
        text: `${rider.first_name} ${rider.last_name}`,
        onPress: async () => {
          try {
            await assignRider(requestId, rider.id);
            Alert.alert('Success', `Rider ${rider.first_name} assigned successfully`);
            loadData();
          } catch (error) {
            console.error('Error assigning rider:', error);
            Alert.alert('Error', 'Failed to assign rider');
          }
        }
      }));

      Alert.alert(
        'Assign Rider',
        'Select a rider to assign:',
        riderOptions
      );
    } catch (error) {
      console.error('Error assigning rider:', error);
      Alert.alert('Error', 'Failed to assign rider');
    }
  };

  const renderRequestCard = (item: PickupRequest & { customer_name: string; customer_email: string }, isMyRequest: boolean = false) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <Text style={styles.customerName}>{item.customer_name}</Text>
        <Text style={styles.customerEmail}>{item.customer_email}</Text>
        {isMyRequest && item.offered_price && (
          <Text style={styles.offeredPrice}>Offered: ₹{item.offered_price}</Text>
        )}
      </View>
      
      <View style={styles.itemsSection}>
        <Text style={styles.itemsTitle}>Items:</Text>
        {Array.isArray(item.selected_items) ? (
          item.selected_items.map((itemName: string, index: number) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemName}>{itemName}</Text>
              <Text style={styles.itemQuantity}>Qty: {item.quantities[itemName] || 0}</Text>
            </View>
          ))
        ) : (
          Object.entries(item.selected_items || {}).map(([itemName, itemData]: [string, any]) => (
            <View key={itemName} style={styles.itemRow}>
              <Text style={styles.itemName}>{itemName}</Text>
              <Text style={styles.itemQuantity}>Qty: {item.quantities[itemName] || 0}</Text>
            </View>
          ))
        )}
      </View>
      
      <View style={styles.detailsSection}>
        <Text style={styles.detailText}>
          📅 Pickup Date: {new Date(item.pickup_date).toLocaleDateString()}
        </Text>
        <Text style={styles.detailText}>
          🕒 Pickup Time: {new Date(item.pickup_time).toLocaleTimeString()}
        </Text>
        <Text style={styles.detailText}>
          📍 Location: {item.location}
        </Text>
      </View>
      
      {item.images && item.images.length > 0 && (
        <View style={styles.imagesSection}>
          <Text style={styles.imagesTitle}>Images:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {item.images.map((imageUrl: string, index: number) => (
              <TouchableOpacity 
                key={index} 
                style={styles.imageContainer}
                onPress={() => setSelectedImage(imageUrl)}
              >
                <Image source={{ uri: imageUrl }} style={styles.requestImage} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      
      <View style={styles.actionButtons}>
        {!isMyRequest ? (
          <TouchableOpacity
            style={[
              styles.requestButton,
              requestedItems.has(item.id) && styles.disabledButton
            ]}
            onPress={() => handleMakeOffer(item.id)}
            disabled={requestedItems.has(item.id)}
          >
            <Text style={styles.buttonText}>
              {requestedItems.has(item.id) ? 'Requested' : 'Request'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.assignButton}
            onPress={() => handleAssignRider(item.id)}
          >
            <Text style={styles.buttonText}>Assign Rider</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderHomeContent = () => (
    <ScrollView 
      style={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>New Requests</Text>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Loading new requests...</Text>
          </View>
        ) : pendingRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No new requests</Text>
            <Text style={styles.emptySubtext}>New pickup requests will appear here</Text>
          </View>
        ) : (
          pendingRequests.map((request) => renderRequestCard(request, false))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Requests</Text>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Loading your requests...</Text>
          </View>
        ) : myRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No requested orders</Text>
            <Text style={styles.emptySubtext}>Your requested orders will appear here</Text>
          </View>
        ) : (
          myRequests.map((request) => renderRequestCard(request, true))
        )}
      </View>
    </ScrollView>
  );

  const renderHistoryContent = () => (
    <View style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction History</Text>
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No transaction history</Text>
          <Text style={styles.emptySubtext}>Your completed transactions will appear here</Text>
        </View>
      </View>
    </View>
  );

  const renderActivityContent = () => (
    <View style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.emptyContainer}>
          <Ionicons name="pulse-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No recent activity</Text>
          <Text style={styles.emptySubtext}>Your recent activities will appear here</Text>
        </View>
      </View>
    </View>
  );

  const renderRidersContent = () => (
    <View style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Riders</Text>
        {riders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No riders available</Text>
            <Text style={styles.emptySubtext}>Riders will appear here when they register</Text>
          </View>
        ) : (
          riders.map((rider) => (
            <View key={rider.id} style={styles.riderCard}>
              <View style={styles.riderInfo}>
                <View style={styles.riderAvatar}>
                  <Text style={styles.riderInitial}>
                    {rider.first_name?.charAt(0) || rider.email?.charAt(0) || 'R'}
                  </Text>
                </View>
                <View style={styles.riderDetails}>
                  <Text style={styles.riderName}>
                    {rider.first_name && rider.last_name 
                      ? `${rider.first_name} ${rider.last_name}`
                      : 'Rider'
                    }
                  </Text>
                  <Text style={styles.riderEmail}>{rider.email}</Text>
                </View>
              </View>
              <View style={styles.riderStatus}>
                <View style={styles.onlineIndicator} />
                <Text style={styles.statusText}>Available</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logo}>Sajilo Waste</Text>
          <Text style={styles.dealerText}>(Dealer)</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon} onPress={handleProfilePress}>
            <Ionicons name="person-circle-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      {activeTab === 'home' && renderHomeContent()}
      {activeTab === 'history' && renderHistoryContent()}
      {activeTab === 'activity' && renderActivityContent()}
      {activeTab === 'riders' && renderRidersContent()}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'home' && styles.navItemActive]} 
          onPress={() => setActiveTab('home')}
        >
          <Ionicons 
            name="home-outline" 
            size={24} 
            color={activeTab === 'home' ? '#4CAF50' : '#666'} 
          />
          <Text style={[styles.navText, activeTab === 'home' && styles.navTextActive]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'history' && styles.navItemActive]} 
          onPress={() => setActiveTab('history')}
        >
          <Ionicons 
            name="time-outline" 
            size={24} 
            color={activeTab === 'history' ? '#4CAF50' : '#666'} 
          />
          <Text style={[styles.navText, activeTab === 'history' && styles.navTextActive]}>History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'activity' && styles.navItemActive]} 
          onPress={() => setActiveTab('activity')}
        >
          <Ionicons 
            name="pulse-outline" 
            size={24} 
            color={activeTab === 'activity' ? '#4CAF50' : '#666'} 
          />
          <Text style={[styles.navText, activeTab === 'activity' && styles.navTextActive]}>Activity</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'riders' && styles.navItemActive]} 
          onPress={() => setActiveTab('riders')}
        >
          <Ionicons 
            name="people-outline" 
            size={24} 
            color={activeTab === 'riders' ? '#4CAF50' : '#666'} 
          />
          <Text style={[styles.navText, activeTab === 'riders' && styles.navTextActive]}>Riders</Text>
        </TouchableOpacity>
      </View>

      {/* Image Modal */}
      <Modal
        visible={selectedImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackground} 
            onPress={() => setSelectedImage(null)}
          >
            <Image 
              source={{ uri: selectedImage || '' }} 
              style={styles.modalImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#4CAF50',
  },
  headerLeft: {
    flex: 1,
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  dealerText: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginLeft: 20,
    padding: 4,
  },
  content: {
    flex: 1,
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
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
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
  requestHeader: {
    marginBottom: 12,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  customerEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  offeredPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 4,
  },
  itemsSection: {
    marginBottom: 12,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 14,
    color: '#333',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  detailsSection: {
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  imagesSection: {
    marginBottom: 16,
  },
  imagesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    overflow: 'hidden',
  },
  requestImage: {
    width: '100%',
    height: '100%',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  requestButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  assignButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  riderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  riderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  riderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  riderInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  riderDetails: {
    flex: 1,
  },
  riderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  riderEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  riderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navItemActive: {
    // Active state styling
  },
  navText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  navTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  modalImage: {
    width: width * 0.9,
    height: height * 0.7,
    borderRadius: 12,
  },
}); 