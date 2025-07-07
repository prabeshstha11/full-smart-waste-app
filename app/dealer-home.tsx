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
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import {
  assignRiderToPickupRequest,
  createNotification,
  getAcceptedPickupRequestsForDealer,
  getAvailableRiders,
  getCompletedPickupRequests,
  getDealerRequestedPickupRequests,
  getPendingPickupRequestsWithUser,
  makeOfferOnPickupRequest,
  PickupRequest,
  User
} from '../utils/database';

const { width, height } = Dimensions.get('window');

export default function DealerHome() {
  const [activeTab, setActiveTab] = useState('home');
  const [homeSubTab, setHomeSubTab] = useState('new'); // 'new', 'my', or 'requested'
  const [pendingRequests, setPendingRequests] = useState<(PickupRequest & { customer_name: string; customer_email: string })[]>([]);
  const [myRequests, setMyRequests] = useState<(PickupRequest & { customer_name: string; customer_email: string })[]>([]);
  const [acceptedRequests, setAcceptedRequests] = useState<(PickupRequest & { customer_name: string; customer_email: string })[]>([]);
  const [completedRequests, setCompletedRequests] = useState<(PickupRequest & { customer_name: string; customer_email: string; rider_name: string })[]>([]);
  const [riders, setRiders] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [requestedItems, setRequestedItems] = useState<Set<string>>(new Set());
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showRiderModal, setShowRiderModal] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<{ id: string; userId: string } | null>(null);
  const [currentRequestForRider, setCurrentRequestForRider] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const dealerId = 'dummy_dealer_001'; // In a real app, this would come from authentication
      
      const [pendingData, myRequestsData, acceptedData, completedData, ridersData] = await Promise.all([
        getPendingPickupRequestsWithUser(),
        getDealerRequestedPickupRequests(dealerId),
        getAcceptedPickupRequestsForDealer(dealerId),
        getCompletedPickupRequests(dealerId),
        getAvailableRiders()
      ]);
      
      setPendingRequests(pendingData);
      setMyRequests(myRequestsData);
      setAcceptedRequests(acceptedData);
      setCompletedRequests(completedData);
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

  const handleMakeOffer = async (requestId: string, userId: string) => {
    try {
      console.log('handleMakeOffer called with:', { requestId, userId });
      
      // Set current request and show price modal
      setCurrentRequest({ id: requestId, userId });
      setPriceInput('');
      setShowPriceModal(true);
    } catch (error) {
      console.error('Error making offer:', error);
      Alert.alert('Error', 'Failed to send offer');
    }
  };

  const handleSubmitOffer = async () => {
    if (!currentRequest) return;
    
    const price = parseFloat(priceInput);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    try {
      const dealerId = 'dummy_dealer_001';
      
      console.log('Making offer with price:', price);
      
      // Update the pickup request in database
      await makeOfferOnPickupRequest(currentRequest.id, dealerId, price);
      
      // Create notification for user
      const notificationId = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await createNotification({
        id: notificationId,
        user_id: currentRequest.userId,
        title: 'New Dealer Offer',
        message: `A dealer has made an offer of Rs.${price} for your pickup request`,
        type: 'dealer_offer',
        related_id: currentRequest.id
      });
      
      // Mark as requested
      setRequestedItems(prev => new Set(prev).add(currentRequest.id));
      
      Alert.alert('Success', `Request sent successfully with Rs.${price}! Waiting for user approval.`);
      
      // Close modal and refresh data
      setShowPriceModal(false);
      setCurrentRequest(null);
      setPriceInput('');
      
      // Refresh data and switch to My Request tab
      await loadData();
      setHomeSubTab('my');
    } catch (error) {
      console.error('Error making offer:', error);
      Alert.alert('Error', 'Failed to send offer');
    }
  };

  const handleAssignRider = async (requestId: string) => {
    try {
      // Load available riders from database
      const availableRiders = await getAvailableRiders();
      
      if (availableRiders.length === 0) {
        Alert.alert('No Riders', 'No riders are currently available');
        return;
      }

      // Show custom rider selection modal
      setCurrentRequestForRider(requestId);
      setShowRiderModal(true);
    } catch (error) {
      console.error('Error assigning rider:', error);
      Alert.alert('Error', 'Failed to assign rider');
    }
  };

  const handleAssignRiderToRequest = async (riderId: string, riderName: string) => {
    if (!currentRequestForRider) return;
    
    try {
      await assignRiderToPickupRequest(currentRequestForRider, riderId);
      
      // Send notification to rider
      const notificationId = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await createNotification({
        id: notificationId,
        user_id: riderId,
        title: 'New Pickup Assignment',
        message: `You have been assigned a new pickup request. Please check your orders.`,
        type: 'pickup_assignment',
        related_id: currentRequestForRider
      });
      
      Alert.alert('Success', `Rider ${riderName} assigned successfully`);
      setShowRiderModal(false);
      setCurrentRequestForRider(null);
      loadData();
    } catch (error) {
      console.error('Error assigning rider:', error);
      Alert.alert('Error', 'Failed to assign rider');
    }
  };

  const renderRequestCard = (item: PickupRequest & { customer_name: string; customer_email: string }, isMyRequest: boolean = false) => (
    <View key={item.id} style={styles.requestCard}>
      {/* Images Section - First */}
      <View style={styles.imagesSection}>
        <Text style={styles.imagesTitle}>Images:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {item.images && item.images.length > 0 ? (
            item.images.map((imageUrl: string, index: number) => (
              <TouchableOpacity 
                key={`${item.id}_image_${index}`} 
                style={styles.imageContainer}
                onPress={() => setSelectedImage(imageUrl)}
              >
                <Image source={{ uri: imageUrl }} style={styles.requestImage} />
              </TouchableOpacity>
            ))
          ) : (
            <View key={`${item.id}_placeholder`} style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={32} color="#ccc" />
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
        </ScrollView>
      </View>

      <View style={styles.requestHeader}>
        <Text style={styles.customerName}>{item.customer_name}</Text>
        <Text style={styles.customerEmail}>{item.customer_email}</Text>
        {isMyRequest && item.offered_price && (
          <Text style={styles.offeredPrice}>Offered: Rs.{item.offered_price}</Text>
        )}
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.itemsSection}>
        <Text style={styles.itemsTitle}>Items:</Text>
        {Array.isArray(item.selected_items) ? (
          item.selected_items.map((itemName: string, index: number) => (
            <View key={`${item.id}_item_${index}`} style={styles.itemRow}>
              <Text style={styles.itemName}>{itemName}</Text>
              <Text style={styles.itemQuantity}>Qty: {item.quantities[itemName] || 0}</Text>
            </View>
          ))
        ) : (
          Object.entries(item.selected_items || {}).map(([itemName, itemData]: [string, any]) => (
            <View key={`${item.id}_item_${itemName}`} style={styles.itemRow}>
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
      
      <View style={styles.actionButtons}>
        {!isMyRequest ? (
          <TouchableOpacity
            style={[
              styles.requestButton,
              requestedItems.has(item.id) && styles.disabledButton
            ]}
            onPress={() => {
              console.log('Request button pressed for item:', item.id);
              handleMakeOffer(item.id, item.user_id);
            }}
            disabled={requestedItems.has(item.id)}
          >
            <Text style={styles.buttonText}>
              {requestedItems.has(item.id) ? 'Request Sent, Waiting for Approval' : 'Request'}
            </Text>
          </TouchableOpacity>
        ) : (
          // Only show assign rider button if status is 'accepted'
          item.status === 'accepted' ? (
            <TouchableOpacity
              style={styles.assignButton}
              onPress={() => handleAssignRider(item.id)}
            >
              <Text style={styles.buttonText}>Assign Rider</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.statusContainer}>
              <Text style={styles.statusMessage}>
                {item.status === 'offered' ? 'Waiting for user to accept offer' : 
                 item.status === 'assigned' ? 'Rider assigned, pickup in progress' :
                 item.status === 'completed' ? 'Pickup completed' : 'Processing...'}
              </Text>
            </View>
          )
        )}
      </View>
    </View>
  );

  const renderHomeContent = () => (
    <View style={styles.content}>
      {/* Sub-tab Navigation */}
      <View style={styles.subTabNavigation}>
        <TouchableOpacity 
          style={[styles.subTabItem, homeSubTab === 'new' && styles.subTabItemActive]} 
          onPress={() => setHomeSubTab('new')}
        >
          <Text style={[styles.subTabText, homeSubTab === 'new' && styles.subTabTextActive]}>
            New Request
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.subTabItem, homeSubTab === 'my' && styles.subTabItemActive]} 
          onPress={() => setHomeSubTab('my')}
        >
          <Text style={[styles.subTabText, homeSubTab === 'my' && styles.subTabTextActive]}>
            My Request
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.subTabItem, homeSubTab === 'requested' && styles.subTabItemActive]} 
          onPress={() => setHomeSubTab('requested')}
        >
          <Text style={[styles.subTabText, homeSubTab === 'requested' && styles.subTabTextActive]}>
            Requested
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sub-tab Content */}
      {homeSubTab === 'new' && (
        <ScrollView 
          style={styles.subTabContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.section}>
            {/* <Text style={styles.sectionTitle}>New Requests</Text> */}
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
        </ScrollView>
      )}

      {homeSubTab === 'my' && (
        <ScrollView 
          style={styles.subTabContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.section}>
            {/* <Text style={styles.sectionTitle}>My Requests</Text> */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Loading your requests...</Text>
              </View>
            ) : acceptedRequests.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="time-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No accepted orders</Text>
                <Text style={styles.emptySubtext}>Accepted orders will appear here</Text>
              </View>
            ) : (
              acceptedRequests.map((request) => renderRequestCard(request, true))
            )}
          </View>
        </ScrollView>
      )}

      {homeSubTab === 'requested' && (
        <ScrollView 
          style={styles.subTabContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.section}>
            {/* <Text style={styles.sectionTitle}>Requested Items</Text> */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Loading requested items...</Text>
              </View>
            ) : pendingRequests.filter(request => requestedItems.has(request.id)).length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="hourglass-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No requested items</Text>
                <Text style={styles.emptySubtext}>Items you've requested will appear here</Text>
              </View>
            ) : (
              pendingRequests
                .filter(request => requestedItems.has(request.id))
                .map((request) => renderRequestCard(request, false))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );

  const renderHistoryContent = () => (
    <View style={styles.content}>
      <ScrollView 
        style={styles.subTabContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>Loading history...</Text>
            </View>
          ) : completedRequests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="time-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No completed transactions</Text>
              <Text style={styles.emptySubtext}>Your completed transactions will appear here</Text>
            </View>
          ) : (
            completedRequests.map((request) => (
              <View key={request.id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.customerName}>{request.customer_name}</Text>
                  <Text style={styles.completedDate}>
                    {new Date(request.updated_at).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.customerEmail}>{request.customer_email}</Text>
                <Text style={styles.riderName}>Rider: {request.rider_name || 'N/A'}</Text>
                <Text style={styles.offeredPrice}>Price: Rs.{request.offered_price}</Text>
                <Text style={styles.location}>📍 {request.location}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
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

      {/* Price Input Modal */}
      <Modal
        visible={showPriceModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPriceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBackground}>
            <View style={styles.priceModalContent}>
              <Text style={styles.priceModalTitle}>Make Offer</Text>
              <Text style={styles.priceModalSubtitle}>Enter your offered price (Rs.)</Text>
              
              <TextInput
                style={styles.priceInput}
                placeholder="Enter price..."
                value={priceInput}
                onChangeText={setPriceInput}
                keyboardType="numeric"
                autoFocus
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowPriceModal(false);
                    setCurrentRequest(null);
                    setPriceInput('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmitOffer}
                >
                  <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rider Selection Modal */}
      <Modal
        visible={showRiderModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRiderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBackground}>
            <View style={styles.riderModalContent}>
              <Text style={styles.riderModalTitle}>Select Rider</Text>
              <Text style={styles.riderModalSubtitle}>Choose a rider to assign to this pickup request</Text>
              
              {riders.length === 0 ? (
                <View style={styles.emptyRiderContainer}>
                  <Ionicons name="bicycle-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyRiderText}>No riders available</Text>
                  <Text style={styles.emptyRiderSubtext}>Please try again later</Text>
                </View>
              ) : (
                <ScrollView style={styles.riderList} showsVerticalScrollIndicator={false}>
                  {riders.map((rider) => (
                    <View key={rider.id} style={styles.riderItem}>
                      <View style={styles.riderInfo}>
                        <View style={styles.riderAvatar}>
                          <Text style={styles.riderInitial}>
                            {rider.first_name.charAt(0)}{rider.last_name.charAt(0)}
                          </Text>
                        </View>
                        <View style={styles.riderDetails}>
                          <Text style={styles.riderName}>{rider.first_name} {rider.last_name}</Text>
                          <Text style={styles.riderEmail}>{rider.email}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.assignButton}
                        onPress={() => handleAssignRiderToRequest(rider.id, `${rider.first_name} ${rider.last_name}`)}
                      >
                        <Text style={styles.assignButtonText}>Assign</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowRiderModal(false);
                  setCurrentRequestForRider(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
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
  subTabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  subTabItem: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  subTabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  subTabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  subTabTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  subTabContent: {
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
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
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
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  assignButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
    color: '#fff',
    textTransform: 'capitalize',
  },
  statusBadge: {
    backgroundColor: '#4CAF50',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 8,
  },
  statusMessage: {
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
  priceModalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
  },
  priceModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  priceModalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  priceInput: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  historyCard: {
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
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  completedDate: {
    fontSize: 14,
    color: '#666',
  },
  location: {
    fontSize: 14,
    color: '#666',
  },
  riderModalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    width: '85%',
    maxHeight: '70%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  riderModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  riderModalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  riderList: {
    maxHeight: 300,
    width: '100%',
    marginBottom: 20,
  },
  riderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  emptyRiderContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyRiderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  emptyRiderSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },

}); 