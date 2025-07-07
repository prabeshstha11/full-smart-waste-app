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
import {
  getCompletedPickupRequestsForUser,
  getPickupRequestsByUser,
  getUnreadNotificationCount
} from '../utils/database';

const { width, height } = Dimensions.get('window');

export default function UserHome() {
  const [pickupRequests, setPickupRequests] = useState<any[]>([]);
  const [completedRequests, setCompletedRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const userId = 'dummy_user_001'; // In a real app, this would come from authentication
      
      const [requestsData, completedData, unreadCountData] = await Promise.all([
        getPickupRequestsByUser(userId),
        getCompletedPickupRequestsForUser(userId),
        getUnreadNotificationCount(userId)
      ]);
      
      setPickupRequests(requestsData);
      setCompletedRequests(completedData);
      setUnreadCount(unreadCountData);
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

  const handleCreateRequest = () => {
    router.push('/pickup-schedule');
  };

  const handleNotifications = () => {
    router.push('/user-notifications');
  };

  const renderRequestCard = (request: any) => (
    <View key={request.id} style={styles.requestCard}>
      {/* Images Section */}
      <View style={styles.imagesSection}>
        <Text style={styles.imagesTitle}>Images:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {request.images && request.images.length > 0 ? (
            request.images.map((imageUrl: string, index: number) => (
              <TouchableOpacity 
                key={`${request.id}_image_${index}`} 
                style={styles.imageContainer}
                onPress={() => setSelectedImage(imageUrl)}
              >
                <Image source={{ uri: imageUrl }} style={styles.requestImage} />
              </TouchableOpacity>
            ))
          ) : (
            <View key={`${request.id}_placeholder`} style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={32} color="#ccc" />
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
        </ScrollView>
      </View>

      <View style={styles.requestHeader}>
        <Text style={styles.requestTitle}>Pickup Request</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{request.status}</Text>
        </View>
      </View>
      
      <View style={styles.itemsSection}>
        <Text style={styles.itemsTitle}>Items:</Text>
        {Array.isArray(request.selected_items) ? (
          request.selected_items.map((itemName: string, index: number) => (
            <View key={`${request.id}_item_${index}`} style={styles.itemRow}>
              <Text style={styles.itemName}>{itemName}</Text>
              <Text style={styles.itemQuantity}>Qty: {request.quantities[itemName] || 0}</Text>
            </View>
          ))
        ) : (
          Object.entries(request.selected_items || {}).map(([itemName, itemData]: [string, any]) => (
            <View key={`${request.id}_item_${itemName}`} style={styles.itemRow}>
              <Text style={styles.itemName}>{itemName}</Text>
              <Text style={styles.itemQuantity}>Qty: {request.quantities[itemName] || 0}</Text>
            </View>
          ))
        )}
      </View>
      
      <View style={styles.detailsSection}>
        <Text style={styles.detailText}>
          📅 Pickup Date: {new Date(request.pickup_date).toLocaleDateString()}
        </Text>
        <Text style={styles.detailText}>
          🕒 Pickup Time: {new Date(request.pickup_time).toLocaleTimeString()}
        </Text>
        <Text style={styles.detailText}>
          📍 Location: {request.location}
        </Text>
        {request.offered_price && (
          <Text style={styles.offeredPrice}>
            💰 Offered Price: Rs.{request.offered_price}
          </Text>
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
          <Text style={styles.userText}>(User)</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon} onPress={handleNotifications}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="person-circle-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Pickup Requests</Text>
            <TouchableOpacity style={styles.createButton} onPress={handleCreateRequest}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.createButtonText}>New Request</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>Loading your requests...</Text>
            </View>
          ) : pickupRequests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="list-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No pickup requests</Text>
              <Text style={styles.emptySubtext}>Create your first pickup request</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={handleCreateRequest}>
                <Text style={styles.emptyButtonText}>Create Request</Text>
              </TouchableOpacity>
            </View>
          ) : (
            pickupRequests.map(renderRequestCard)
          )}
        </View>

        {/* Completed Orders Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Completed Orders</Text>
          </View>

          {completedRequests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No completed orders</Text>
              <Text style={styles.emptySubtext}>Your completed orders will appear here</Text>
            </View>
          ) : (
            completedRequests.map((request) => (
              <View key={request.id} style={styles.completedCard}>
                <View style={styles.completedHeader}>
                  <Text style={styles.completedTitle}>Completed Pickup</Text>
                  <Text style={styles.completedDate}>
                    {new Date(request.updated_at).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.dealerName}>Dealer: {request.dealer_name || 'N/A'}</Text>
                <Text style={styles.riderName}>Rider: {request.rider_name || 'N/A'}</Text>
                <Text style={styles.offeredPrice}>Price: Rs.{request.offered_price}</Text>
                <Text style={styles.location}>📍 {request.location}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

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
  userText: {
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
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
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
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    backgroundColor: '#FFA726',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
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
  offeredPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 4,
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
  completedCard: {
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
  completedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  completedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  completedDate: {
    fontSize: 14,
    color: '#666',
  },
  dealerName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  riderName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#666',
  },
}); 